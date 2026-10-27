import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'

function viewsFile() {
  return path.join(process.cwd(), 'data-store', 'views.json')
}

function load(): Record<string, number> {
  const f = viewsFile()
  if (!fs.existsSync(f)) return {}
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'))
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || ''
  const data = load()
  return NextResponse.json({ views: data[slug] || 0 })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug } = body
  if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 })
  const f = viewsFile()
  const data = load()
  data[slug] = (data[slug] || 0) + 1
  fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf8')
  return NextResponse.json({ views: data[slug] })
}
