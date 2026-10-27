import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

const SESSION_COOKIE = 'xingye_admin'

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'xingye2026'
}

export function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get(SESSION_COOKIE)
  return cookie?.value === getAdminPassword()
}

export function requireAuth(req: NextRequest): NextResponse | null {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return null
}

export const ADMIN_COOKIE = SESSION_COOKIE

export function blogDir(): string {
  return path.join(process.cwd(), 'data', 'blog')
}

export function readBlogPosts(): Array<{
  slug: string
  title: string
  date: string
  tags: string[]
  draft: boolean
  summary: string
}> {
  const dir = blogDir()
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8')
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
    let meta: {
      slug: string
      title: string
      date: string
      summary: string
      draft: boolean
      tags: string[]
    } = {
      slug: file.replace(/\.mdx$/, ''),
      title: '',
      date: '',
      summary: '',
      draft: false,
      tags: [],
    }
    if (fmMatch) {
      const fm = fmMatch[1]
      const title = fm.match(/title:\s*['"]([^'"]+)['"]/)?.[1] || ''
      const date = fm.match(/date:\s*['"]([^'"]+)['"]/)?.[1] || ''
      const summary = fm.match(/summary:\s*['"]([^'"]*)['"]/)?.[1] || ''
      const draft = /draft:\s*true/.test(fm)
      const tagsMatch = fm.match(/tags:\s*\[([^\]]*)\]/)
      const tags = tagsMatch
        ? tagsMatch[1].split(',').map((t) => t.trim().replace(/['"]/g, ''))
        : []
      meta = { ...meta, title, date, summary, draft, tags }
    }
    return meta
  })
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function slugify(s: string): string {
  // 中文标题直接用拼音不安全，改成时间戳+随机串
  const clean = s
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (/[\u4e00-\u9fa5]/.test(clean)) {
    // 含中文，用时间戳 slug
    return `post-${Date.now()}`
  }
  return clean || `post-${Date.now()}`
}
