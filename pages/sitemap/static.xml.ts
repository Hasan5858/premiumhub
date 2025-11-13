import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://premiumhub.vip'

  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/categories', priority: 0.9, changefreq: 'weekly' },
    { url: '/providers', priority: 0.9, changefreq: 'weekly' },
    { url: '/webseries', priority: 0.9, changefreq: 'weekly' },
    { url: '/search', priority: 0.8, changefreq: 'weekly' },
    { url: '/login', priority: 0.5, changefreq: 'monthly' },
    { url: '/signup', priority: 0.5, changefreq: 'monthly' },
    { url: '/membership', priority: 0.7, changefreq: 'monthly' },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default function StaticSitemap() {
  return null
}
