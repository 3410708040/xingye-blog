'use client'

import { useEffect, useRef, useState } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: '你好，我是小星 🌠 可以问我这个博客里写过的内容。' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const ct = res.headers.get('content-type') || ''
      const assistantIdx = messages.length + 1 // 即将插入的位置
      setMessages((m) => [...m, { role: 'assistant', content: '' }])

      if (ct.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buf = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() || ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') continue
            try {
              const json = JSON.parse(data)
              const delta = json.choices?.[0]?.delta?.content || ''
              if (delta) {
                setMessages((m) => {
                  const next = [...m]
                  next[next.length - 1] = {
                    role: 'assistant',
                    content: next[next.length - 1].content + delta,
                  }
                  return next
                })
              }
            } catch {
              // ignore partial json
            }
          }
        }
      } else {
        // 降级：纯文本
        const text_ = await res.text()
        setMessages((m) => {
          const next = [...m]
          next[next.length - 1] = { role: 'assistant', content: text_ }
          return next
        })
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: '出错了：' + ((e as Error).message || '网络问题') },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="打开聊天助手"
        className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl shadow-lg shadow-indigo-600/30 transition hover:scale-105 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* 聊天面板 */}
      {open && (
        <div className="fixed right-6 bottom-24 z-50 flex h-[70vh] w-[92vw] max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              小星 · 博客助手
            </div>
            <div className="text-xs text-gray-400">基于本站文章回答</div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}
                >
                  {m.content || (loading && i === messages.length - 1 ? '思考中…' : '')}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-3 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="问问博客里写了什么…"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
