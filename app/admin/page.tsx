'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Post = {
  slug: string
  title: string
  date: string
  tags: string[]
  draft: boolean
  summary: string
}

export default function AdminHome() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function load() {
    const r = await fetch('/api/admin/posts/')
    if (r.status === 401) {
      router.push('/admin/login/')
      return
    }
    const data = await r.json()
    setPosts(data.posts || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function logout() {
    await fetch('/api/admin/logout/', { method: 'POST' })
    router.push('/')
  }

  async function del(slug: string) {
    if (!confirm(`确定删除《${slug}》？`)) return
    await fetch(`/api/admin/posts/${slug}/`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="p-8">加载中…</div>

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">文章管理</h1>
        <div className="flex gap-3">
          <Link href="/admin/new/" className="rounded-lg bg-indigo-600 px-4 py-2 text-white">
            + 写新文章
          </Link>
          <button
            onClick={logout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"
          >
            退出登录
          </button>
        </div>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="py-2">标题</th>
            <th className="py-2">日期</th>
            <th className="py-2">标签</th>
            <th className="py-2">状态</th>
            <th className="py-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.slug} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 pr-4">
                <Link
                  href={`/blog/${p.slug}`}
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                >
                  {p.title || p.slug}
                </Link>
              </td>
              <td className="py-2 pr-4 text-gray-500">{p.date}</td>
              <td className="py-2 pr-4 text-gray-500">{p.tags.join(', ')}</td>
              <td className="py-2 pr-4">
                {p.draft ? (
                  <span className="text-amber-500">草稿</span>
                ) : (
                  <span className="text-green-600">已发布</span>
                )}
              </td>
              <td className="py-2">
                <Link
                  href={`/admin/edit/${p.slug}/`}
                  className="mr-3 text-indigo-600 hover:underline"
                >
                  编辑
                </Link>
                <button onClick={() => del(p.slug)} className="text-red-500 hover:underline">
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
