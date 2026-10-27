import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import { requireAuth } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth) return auth

  const formData = await req.formData()
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'no file' }, { status: 400 })
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: '文件超过 50MB' }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), 'public', 'static', 'images', 'uploads')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  const ext = path.extname(file.name) || (file.type.startsWith('video/') ? '.mp4' : '.jpg')
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(path.join(uploadDir, name), buf)

  return NextResponse.json({ url: `/static/images/uploads/${name}` })
}
