import { GetServerSideProps } from 'next'
import fs from 'fs'
import path from 'path'
import { SitemapData } from '@/types/sitemap'

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://premiumhub.vip'

  try {
    // Read sitemap data
    const sitemapPath = path.join(process.cwd(), 'public', 'data', 'sitemap-data.json')
    const fileContent = fs.readFileSync(sitemapPath, 'utf-8')
    const data: SitemapData = JSON.parse(fileContent)

    const tags = Object.entries(data.structure.tags)

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${tags
  .map(
    ([slug, tag]) => `  <url>
    <loc>${baseUrl}${tag.url}</loc>
    <lastmod>${tag.added_at}</lastmod>
    <changefreq>${tag.changefreq}</changefreq>
    <priority>${tag.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate')
    res.write(sitemap)
    res.end()
  } catch (error) {
    console.error('Error generating tags sitemap:', error)
    res.statusCode = 500
    res.end()
  }

  return {
    props: {},
  }
}

export default function TagsSitemap() {
  return null
}
