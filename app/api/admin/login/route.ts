import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, getAdminPassword } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  if (password !== getAdminPassword()) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, getAdminPassword(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
