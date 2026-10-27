import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import { blogDir, requireAuth } from '@/lib/admin'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req)
  if (auth) return auth
  const { slug } = await params
  const file = path.join(blogDir(), `${slug}.mdx`)
  if (!fs.existsSync(file)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const raw = fs.readFileSync(file, 'utf8')
  return NextResponse.json({ slug, raw })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req)
  if (auth) return auth
  const { slug } = await params
  const body = await req.json()
  const { title, date, tags, summary, content, draft } = body
  const tagsStr = (tags || []).map((t: string) => `'${t}'`).join(', ')
  const mdx = `---
title: '${(title || '未命名').replace(/'/g, "''")}'
date: '${date || new Date().toISOString().slice(0, 10)}'
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

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req)
  if (auth) return auth
  const { slug } = await params
  const file = path.join(blogDir(), `${slug}.mdx`)
  if (fs.existsSync(file)) fs.unlinkSync(file)
  return NextResponse.json({ ok: true })
}
