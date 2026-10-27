'use client'

import { useEffect, useState } from 'react'

type Comment = { name: string; content: string; date: string }

export default function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const r = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
    const data = await r.json()
    setComments(data.comments || [])
  }

  useEffect(() => {
    load()
  }, [slug])

  async function submit() {
    if (!content.trim()) return
    setLoading(true)
    await fetch('/api/comments/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name, content }),
    })
    setContent('')
    setLoading(false)
    load()
  }

  return (
    <div className="mt-10 border-t border-gray-200 pt-6 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
        评论 ({comments.length})
      </h3>

      <div className="mb-6 max-h-96 space-y-3 overflow-y-auto pr-2">
        {comments.length === 0 && (
          <div className="text-sm text-gray-400">还没有评论，来抢沙发。</div>
        )}
        {comments.map((c, i) => (
          <div key={i} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</span>
              <span className="text-xs text-gray-400">
                {new Date(c.date).toLocaleString('zh-CN')}
              </span>
            </div>
            <div className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {c.content}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="你的昵称（可留空）"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="说点什么…"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          onClick={submit}
          disabled={loading || !content.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? '提交中…' : '发表评论'}
        </button>
      </div>
    </div>
  )
}
