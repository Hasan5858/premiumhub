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

    const videos = Object.entries(data.structure.videos)

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${videos
  .map(
    ([slug, video]) => `  <url>
    <loc>${baseUrl}${video.url}</loc>
    <lastmod>${video.added_at}</lastmod>
    <changefreq>${video.changefreq}</changefreq>
    <priority>${video.priority}</priority>
    <video:video>
      <video:thumbnail_loc>${video.thumbnail}</video:thumbnail_loc>
      <video:title>${escapeXml(video.title)}</video:title>
      <video:description>${escapeXml(video.title)}</video:description>
      ${video.duration ? `<video:duration>${parseDuration(video.duration)}</video:duration>` : ''}
      <video:view_count>${video.views}</video:view_count>
    </video:video>
  </url>`
  )
  .join('\n')}
</urlset>`

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate')
    res.write(sitemap)
    res.end()
  } catch (error) {
    console.error('Error generating videos sitemap:', error)
    res.statusCode = 500
    res.end()
  }

  return {
    props: {},
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function parseDuration(duration: string): number {
  // Parse duration like "12:34" or "1:23:45" to seconds
  const parts = duration.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return 0
}

export default function VideosSitemap() {
  return null
}
