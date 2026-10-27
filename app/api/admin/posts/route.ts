import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import { blogDir, readBlogPosts, requireAuth, slugify } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth) return auth
  return NextResponse.json({ posts: readBlogPosts() })
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth) return auth
  const body = await req.json()
  const { title, date, tags, summary, content, draft } = body

  const slug = slugify(title || `post-${Date.now()}`)
  const tagsStr = (tags || []).map((t: string) => `'${t}'`).join(', ')
  const today = date || new Date().toISOString().slice(0, 10)
  const mdx = `---
title: '${(title || '未命名').replace(/'/g, "''")}'
date: '${today}'
tags: [${tagsStr}]
draft: ${draft ? 'true' : 'false'}
summary: '${(summary || '').replace(/'/g, "''")}'
authors: ['default']
---

${content || ''}
`
  fs.writeFileSync(path.join(blogDir(), `${slug}.mdx`), mdx, 'utf8')
  return NextResponse.json({ ok: true, slug })
}
