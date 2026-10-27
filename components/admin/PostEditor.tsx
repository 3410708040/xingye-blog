'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

type Props = { slug?: string }

export default function PostEditor({ slug }: Props) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [tags, setTags] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [draft, setDraft] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!slug) {
      setDate(new Date().toISOString().slice(0, 10))
      setLoaded(true)
      return
    }
    fetch(`/api/admin/posts/${slug}/`)
      .then((r) => r.json())
      .then((data) => {
        const raw = data.raw || ''
        const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
        if (fmMatch) {
          const fm = fmMatch[1]
          setTitle(fm.match(/title:\s*['"]([^'"]+)['"]/)?.[1] || '')
          setDate(fm.match(/date:\s*['"]([^'"]+)['"]/)?.[1] || '')
          setSummary(fm.match(/summary:\s*['"]([^'"]*)['"]/)?.[1] || '')
          setDraft(/draft:\s*true/.test(fm))
          const tagsMatch = fm.match(/tags:\s*\[([^\]]*)\]/)
          setTags(
            tagsMatch
              ? tagsMatch[1]
                  .split(',')
                  .map((t) => t.trim().replace(/['"]/g, ''))
                  .join(', ')
              : ''
          )
          setContent(fmMatch[2].trim())
        }
        setLoaded(true)
      })
  }, [slug])

  async function save() {
    setSaving(true)
    const payload = {
      title,
      date,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      summary,
      content,
      draft,
    }
    const url = slug ? `/api/admin/posts/${slug}/` : '/api/admin/posts/'
    const method = slug ? 'PUT' : 'POST'
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    setSaving(false)
    if (r.ok) {
      // 新建成功后跳到编辑页（后续保存走 PUT，不会重复创建）；编辑成功直接回列表
      if (!slug && data.slug) {
        router.replace(`/admin/edit/${data.slug}/`)
      } else {
        router.push('/admin/')
      }
      router.refresh()
    } else {
      alert('保存失败：' + (data.error || ''))
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('/api/upload/', { method: 'POST', body: fd })
    const data = await r.json()
    if (data.url) {
      const insert = file.type.startsWith('video/')
        ? `\n\n<video src="${data.url}" controls />\n\n`
        : `\n\n![${file.name}](${data.url})\n\n`
      setContent((c) => c + insert)
    } else {
      alert('上传失败：' + (data.error || ''))
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!loaded) return <div className="p-8">加载中…</div>

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {slug ? '编辑文章' : '写新文章'}
        </h1>
        <div className="flex gap-2">
          <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">
            📎 上传图片/视频
            <input
              type="file"
              accept="image/*,video/*"
              ref={fileInputRef}
              onChange={uploadFile}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setDraft(!draft)}
            className={`rounded-lg px-3 py-2 text-sm ${draft ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            {draft ? '草稿模式' : '发布模式'}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <div className="flex gap-3">
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="标签，用逗号分隔"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="一句话摘要"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="正文（Markdown）"
            rows={20}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-2 text-sm font-semibold text-gray-500">预览</div>
          <article className="prose dark:prose-invert max-w-none">
            <h1>{title || '（无标题）'}</h1>
            <ReactMarkdown
              components={{
                img: ({ node, ...props }) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img {...props} className="rounded-lg" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  )
}
