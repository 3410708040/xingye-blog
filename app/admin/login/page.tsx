'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit() {
    setLoading(true)
    setErr('')
    const r = await fetch('/api/admin/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    })
    if (r.ok) {
      router.push('/admin/')
      router.refresh()
    } else {
      setErr('密码错误')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-24 max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        星夜博客 · 后台登录
      </h1>
      <input
        type="password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="输入管理密码"
        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      />
      {err && <div className="mb-3 text-sm text-red-500">{err}</div>}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-2 text-white disabled:opacity-50"
      >
        {loading ? '登录中…' : '登录'}
      </button>
    </div>
  )
}
