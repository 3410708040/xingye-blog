import { NextRequest } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Chunk = {
  title: string
  slug: string
  text: string
}

let chunksCache: Chunk[] | null = null

function loadChunks(): Chunk[] {
  if (chunksCache) return chunksCache
  const dir = path.join(process.cwd(), 'data', 'blog')
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))
  const chunks: Chunk[] = []
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8')
    const { data, content } = matter(raw)
    const slug = file.replace(/\.mdx$/, '')
    // 去掉图片和 HTML 注释，减少噪声
    const cleaned = content.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/<!--[\s\S]*?-->/g, '')
    const paras = cleaned
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 40 && !s.startsWith('#'))
    let buf = ''
    for (const p of paras) {
      if ((buf + '\n\n' + p).length > 600 && buf) {
        chunks.push({ title: data.title, slug, text: buf })
        buf = p
      } else {
        buf = buf ? buf + '\n\n' + p : p
      }
    }
    if (buf) chunks.push({ title: data.title, slug, text: buf })
  }
  chunksCache = chunks
  return chunks
}

// 简易中英混合分词：英文按单词、中文按单字
function tokenize(text: string): string[] {
  const en = text.toLowerCase().match(/[a-z0-9]+/g) || []
  const cn = text.match(/[\u4e00-\u9fa5]/g) || []
  return [...en, ...cn]
}

function scoreChunk(chunk: Chunk, query: string): number {
  const qTokens = tokenize(query)
  if (qTokens.length === 0) return 0
  const cTokens = tokenize(chunk.text)
  const cFreq = new Map<string, number>()
  for (const t of cTokens) cFreq.set(t, (cFreq.get(t) || 0) + 1)
  let score = 0
  for (const t of qTokens) score += cFreq.get(t) || 0
  // 标题命中加权
  if (chunk.title && qTokens.some((t) => chunk.title.toLowerCase().includes(t))) {
    score *= 1.5
  }
  return score
}

async function callLLMStream(context: string, question: string) {
  const apiKey = process.env.OPENAI_API_KEY!
  const baseURL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'
  return fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `你是「星夜博客」的智能助手小星。请严格基于下面提供的博客原文片段回答用户问题；如果原文里没有相关信息，就如实说"这篇博客里暂时没有提到这个问题"，不要编造。回答用简体中文，口语化、简洁，不要列提纲。\n\n博客原文片段：\n${context}`,
        },
        { role: 'user', content: question },
      ],
    }),
  })
}

export async function POST(req: NextRequest) {
  let body: { message?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('bad request', { status: 400 })
  }
  const message = (body.message || '').trim()
  if (!message) {
    return new Response('empty message', { status: 400 })
  }

  const chunks = loadChunks()
  const scored = chunks
    .map((c) => ({ c, s: scoreChunk(c, message) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)

  const context = scored
    .map((x) => `【《${x.c.title}》】(/blog/${x.c.slug})\n${x.c.text}`)
    .join('\n\n---\n\n')

  const apiKey = process.env.OPENAI_API_KEY

  // 未配置 LLM 或没检索到内容：降级为原文片段返回
  if (!apiKey || scored.length === 0) {
    const fallback =
      scored.length === 0
        ? '我在博客里没有找到和这个问题相关的内容。你可以换个问法，或者直接去博客列表看看文章。'
        : `（未配置 LLM API Key，以下是从博客原文中检索到的相关片段）\n\n${context}`
    return new Response(fallback, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const upstream = await callLLMStream(context, message)
  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '')
    return new Response(`LLM 调用失败：${upstream.status} ${errText.slice(0, 200)}`, {
      status: 502,
    })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
