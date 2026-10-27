import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'

type Comment = { name: string; content: string; date: string }

function commentsFile() {
  return path.join(process.cwd(), 'data-store', 'comments.json')
}

function load(): Record<string, Comment[]> {
  const f = commentsFile()
  if (!fs.existsSync(f)) return {}
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'))
  } catch {
    return {}
  }
}

function save(data: Record<string, Comment[]>) {
  fs.writeFileSync(commentsFile(), JSON.stringify(data, null, 2), 'utf8')
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || ''
  const data = load()
  return NextResponse.json({ comments: data[slug] || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, name, content } = body
  if (!slug || !content) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 })
  }
  const data = load()
  if (!data[slug]) data[slug] = []
  data[slug].push({
    name: (name || '匿名').slice(0, 30),
    content: String(content).slice(0, 2000),
    date: new Date().toISOString(),
  })
  save(data)
  return NextResponse.json({ ok: true })
}
