// Create a new API route that generates placeholder SVG images
import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { height = 300, width = 300, query = "placeholder" } = req.query

  // Parse dimensions, ensuring they're numbers and have reasonable limits
  const h = Math.min(Math.max(Number(height) || 300, 50), 1000)
  const w = Math.min(Math.max(Number(width) || 300, 50), 1000)

  // Create a simple SVG placeholder with the query text
  const svg = `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#1F2937" />
      <rect width="${w}" height="${h}" fill="url(#gradient)" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>
      <text 
        x="50%" 
        y="50%" 
        fontFamily="system-ui, sans-serif" 
        fontSize="${Math.max(w, h) > 200 ? "16" : "12"}" 
        fill="#9CA3AF"
        textAnchor="middle" 
        dominantBaseline="middle"
      >
        ${query}
      </text>
    </svg>
  `

  // Set appropriate headers
  res.setHeader("Content-Type", "image/svg+xml")
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable")

  // Send the SVG
  res.status(200).send(svg)
}
