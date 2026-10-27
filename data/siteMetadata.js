/** @type {import("pliny/config").PlinyConfig } */
const siteMetadata = {
  title: '星夜博客',
  author: '星夜',
  headerTitle: '星夜',
  description: '记录代码、思考与深夜里的光 —— 一个关于技术、工程与个人成长的自留地。',
  language: 'zh-CN',
  theme: 'dark', // system, dark or light
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  siteRepo: 'https://github.com/yourname/xingye-blog',
  siteLogo: `${process.env.BASE_PATH || ''}/static/images/logo.png`,
  socialBanner: `${process.env.BASE_PATH || ''}/static/images/twitter-card.png`,
  email: 'hello@xingye.dev',
  github: 'https://github.com',
  locale: 'zh-CN',
  stickyNav: true,
  analytics: {},
  newsletter: {
    provider: '', // 暂不启用邮件订阅
  },
  comments: {
    provider: '', // 暂不启用评论，后续可配置 giscus
  },
  search: {
    provider: 'kbar',
    kbarConfig: {
      searchDocumentsPath: `${process.env.BASE_PATH || ''}/search.json`,
    },
  },
}

module.exports = siteMetadata
