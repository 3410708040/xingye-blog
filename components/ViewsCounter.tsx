'use client'

import { useEffect, useState } from 'react'

export default function ViewsCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/views?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => setViews(d.views || 0))
    fetch('/api/views/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => {})
  }, [slug])

  if (views === null) return null
  return <span className="ml-3 text-sm text-gray-400">👁 {views} 次阅读</span>
}
