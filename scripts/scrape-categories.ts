/**
 * Category Scraper - All Providers
 * Scrapes categories from all providers and saves to local JSON
 * Run: npx ts-node scripts/scrape-categories.ts
 */

import fs from 'fs'
import path from 'path'

interface Category {
  id: string
  provider: string
  name: string
  slug: string
  thumbnail: string
  thumbnail_type: 'direct' | 'proxy' // direct URL or needs worker proxy
  thumbnail_proxy_url?: string // If needs proxy
  post_count: number
  scraped_at: string
  verified: boolean
}

interface ProviderConfig {
  name: string
  scrape_function: () => Promise<Category[]>
  needs_proxy: boolean
  proxy_worker_url?: string
}

// Provider configurations
const providers: ProviderConfig[] = [
  {
    name: 'webxseries',
    scrape_function: scrapeWebXSeriesCategories,
    needs_proxy: false // Direct URLs
  },
  {
    name: 'fsiblog5',
    scrape_function: scrapeFSIBlog5Categories,
    needs_proxy: true,
    proxy_worker_url: 'https://your-fsiblog-proxy.workers.dev'
  },
  {
    name: 'kamababa',
    scrape_function: scrapeKamaBabaCategories,
    needs_proxy: true,
    proxy_worker_url: 'https://your-kamababa-proxy.workers.dev'
  },
  {
    name: 'superporn',
    scrape_function: scrapeSuperPornCategories,
    needs_proxy: false // Direct URLs via worker
  },
  {
    name: 'indianpornhq',
    scrape_function: scrapeIndianPornHQCategories,
    needs_proxy: false // Direct URLs
  }
]

// Main scraper function
async function scrapeAllCategories() {
  console.log('🚀 Starting category scraping for all providers...\n')
  
  const allCategories: Record<string, Category[]> = {}
  const summary = {
    total_providers: providers.length,
    total_categories: 0,
    providers_success: 0,
    providers_failed: 0,
    scraped_at: new Date().toISOString()
  }
  
  for (const provider of providers) {
    try {
      console.log(`📦 Scraping ${provider.name}...`)
      const categories = await provider.scrape_function()
      
      // Add proxy URLs if needed
      const processedCategories = categories.map(cat => ({
        ...cat,
        thumbnail_type: provider.needs_proxy ? 'proxy' as const : 'direct' as const,
        thumbnail_proxy_url: provider.needs_proxy 
          ? `${provider.proxy_worker_url}/image?url=${encodeURIComponent(cat.thumbnail)}`
          : undefined
      }))
      
      allCategories[provider.name] = processedCategories
      summary.total_categories += processedCategories.length
      summary.providers_success++
      
      console.log(`✅ ${provider.name}: ${processedCategories.length} categories scraped\n`)
      
      // Save individual provider file
      const providerFile = path.join(__dirname, '../data/categories', `${provider.name}.json`)
      fs.writeFileSync(providerFile, JSON.stringify(processedCategories, null, 2))
      
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error)
      summary.providers_failed++
      allCategories[provider.name] = []
    }
  }
  
  // Save combined file
  const combinedFile = path.join(__dirname, '../data/categories', 'all-categories.json')
  fs.writeFileSync(combinedFile, JSON.stringify(allCategories, null, 2))
  
  // Save summary
  const summaryFile = path.join(__dirname, '../data/categories', 'summary.json')
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))
  
  console.log('\n📊 Scraping Summary:')
  console.log(`Total providers: ${summary.total_providers}`)
  console.log(`Successful: ${summary.providers_success}`)
  console.log(`Failed: ${summary.providers_failed}`)
  console.log(`Total categories: ${summary.total_categories}`)
  console.log(`\n✅ All categories saved to: data/categories/`)
}

// WebXSeries Categories (Direct URLs)
async function scrapeWebXSeriesCategories(): Promise<Category[]> {
  const response = await fetch('http://localhost:3000/api/v2/providers/webxseries/categories')
  const data = await response.json()
  
  if (!data.success) throw new Error('Failed to fetch WebXSeries categories')
  
  return data.data.map((cat: any, idx: number) => ({
    id: `webxseries-${cat.slug}`,
    provider: 'webxseries',
    name: cat.name,
    slug: cat.slug,
    thumbnail: cat.thumbnail || 'https://via.placeholder.com/300x200?text=WebXSeries',
    post_count: cat.videoCount || 0,
    scraped_at: new Date().toISOString(),
    verified: false
  }))
}

// FSIBlog5 Categories (Needs Proxy)
async function scrapeFSIBlog5Categories(): Promise<Category[]> {
  const response = await fetch('http://localhost:3000/api/v2/providers/fsiblog5/categories')
  const data = await response.json()
  
  if (!data.success) throw new Error('Failed to fetch FSIBlog5 categories')
  
  return data.data.map((cat: any, idx: number) => ({
    id: `fsiblog5-${cat.slug}`,
    provider: 'fsiblog5',
    name: cat.name,
    slug: cat.slug,
    thumbnail: cat.thumbnail || 'https://via.placeholder.com/300x200?text=FSIBlog',
    post_count: cat.videoCount || 0,
    scraped_at: new Date().toISOString(),
    verified: false
  }))
}

// KamaBaba Categories (Needs Proxy)
async function scrapeKamaBabaCategories(): Promise<Category[]> {
  const response = await fetch('http://localhost:3000/api/v2/providers/kamababa/categories')
  const data = await response.json()
  
  if (!data.success) throw new Error('Failed to fetch KamaBaba categories')
  
  return data.data.map((cat: any, idx: number) => ({
    id: `kamababa-${cat.slug}`,
    provider: 'kamababa',
    name: cat.name,
    slug: cat.slug,
    thumbnail: cat.thumbnail || 'https://via.placeholder.com/300x200?text=KamaBaba',
    post_count: cat.videoCount || 0,
    scraped_at: new Date().toISOString(),
    verified: false
  }))
}

// SuperPorn Categories (Worker Proxy)
async function scrapeSuperPornCategories(): Promise<Category[]> {
  const response = await fetch('https://superpornapi.premiumhub.workers.dev/categories')
  const data = await response.json()
  
  return data.categories.map((cat: any, idx: number) => ({
    id: `superporn-${cat.slug}`,
    provider: 'superporn',
    name: cat.name,
    slug: cat.slug,
    thumbnail: cat.thumbnail || 'https://via.placeholder.com/300x200?text=SuperPorn',
    post_count: cat.count || 0,
    scraped_at: new Date().toISOString(),
    verified: false
  }))
}

// IndianPornHQ Categories (Direct URLs)
async function scrapeIndianPornHQCategories(): Promise<Category[]> {
  const response = await fetch('http://localhost:3000/api/v2/providers/indianpornhq/categories')
  const data = await response.json()
  
  if (!data.success) throw new Error('Failed to fetch IndianPornHQ categories')
  
  return data.data.map((cat: any, idx: number) => ({
    id: `indianpornhq-${cat.slug}`,
    provider: 'indianpornhq',
    name: cat.name,
    slug: cat.slug,
    thumbnail: cat.thumbnail || 'https://via.placeholder.com/300x200?text=IndianPornHQ',
    post_count: cat.videoCount || 0,
    scraped_at: new Date().toISOString(),
    verified: false
  }))
}

// Run the scraper
scrapeAllCategories()
  .then(() => {
    console.log('\n✅ Category scraping completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Category scraping failed:', error)
    process.exit(1)
  })
