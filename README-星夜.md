# 星夜博客

基于 [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) 二次开发的个人博客，内置 RAG 聊天助手。

## 技术栈

- Next.js 15 (App Router) + React 19
- Tailwind CSS 4
- Contentlayer2 (MDX 内容管理)
- 自带暗模式、RSS、本地搜索 (kbar)、标签系统

## 启动

```bash
cd D:\新建文件夹\blog
npm run dev
```

打开 http://localhost:3000

## 写文章

在 `data/blog/` 下新建 `.mdx` 文件，frontmatter 格式：

```mdx
---
title: '文章标题'
date: '2026-10-27'
tags: ['标签1', '标签2']
draft: false
summary: '一句话摘要'
authors: ['default']
---

正文写这里…
```

保存后 dev server 自动热更新。RAG 聊天助手会在下次请求时自动把新文章纳入检索范围（首次启动时扫描，改完文章重启 dev server 即可）。

## 定制站点信息

编辑 `data/siteMetadata.js`：改标题、作者、邮箱、GitHub、siteUrl 等。

导航栏在 `data/headerNavLinks.ts`。

关于页文案在 `data/authors/default.mdx`。

## RAG 聊天助手配置

右下角悬浮聊天框默认就能用——**不配 LLM Key 时会直接展示从博客里检索到的原文片段**（降级模式）。

要让它真正"对话"，编辑 `.env.local`：

```bash
OPENAI_API_KEY=sk-xxxx
# 兼容 OpenAI / 火山方舟 / DeepSeek / 通义千问 等所有 OpenAI 协议接口
# 方舟示例：https://ark.cn-beijing.volces.com/api/v3
# DeepSeek 示例：https://api.deepseek.com/v1
OPENAI_BASE_URL=https://api.openai.com/v1
# 方舟填 endpoint id（ep-xxxx）；DeepSeek 填 deepseek-chat
OPENAI_CHAT_MODEL=gpt-4o-mini
```

改完重启 dev server。

### 当前 RAG 实现

- 检索：本地中英混合分词 + 词频打分（无外部 embedding 依赖），取 top 3 段落
- 生成：OpenAI 兼容接口，SSE 流式返回
- 上下文：把 top 3 段落拼进 system prompt，要求模型严格基于原文回答

后续可演进：embedding 向量检索、引用溯源跳转、多轮对话、重排序。

## 部署

`npm run build && npm run start`，或者直接推到 Vercel。环境变量在 Vercel 控制台配。
