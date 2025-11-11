/**
 * IndianPornHQ Content Scraper
 * Scrapes all posts from IndianPornHQ provider
 * Run: npx ts-node scripts/scrape-indianpornhq.ts
 */

import fs from 'fs'
import path from 'path'

interface Post {
  id: string
  provider: string
  title: string
  slug: string
  thumbnail: string
  video_url: string
  embed_url?: string
  duration: string
  quality: string
  description: string
  tags: string[]
  categories: string[]
  rating: number
  views: number
  uploaded_at: string
  indexed_at: string
  seo_title: string
  seo_description: string
  seo_keywords: string
  is_featured: boolean
  is_trending: boolean
}

interface ScraperStats {
  provider: string
  start_time: string
  end_time?: string
  total_posts_scraped: number
  total_pages_scraped: number
  failed_pages: number
  estimated_time_remaining?: string
  status: 'running' | 'completed' | 'failed'
}

class IndianPornHQScraper {
  private posts: Post[] = []
  private stats: ScraperStats
  private outputDir: string
  
  constructor() {
    this.outputDir = path.join(__dirname, '../data/posts')
    this.stats = {
      provider: 'indianpornhq',
      start_time: new Date().toISOString(),
      total_posts_scraped: 0,
      total_pages_scraped: 0,
      failed_pages: 0,
      status: 'running'
    }
  }
  
  async scrapeAll() {
    console.log('🚀 Starting IndianPornHQ scraping...\n')
    console.log('Provider: IndianPornHQ')
    console.log('Strategy: Small provider, scrape everything\n')
    
    let currentPage = 1
    let hasMorePages = true
    
    while (hasMorePages) {
      try {
        console.log(`📄 Scraping page ${currentPage}...`)
        
        const response = await fetch(
          `http://localhost:3000/api/v2/providers/indianpornhq/videos?page=${currentPage}&limit=30`
        )
        
        const data = await response.json()
        
        if (!data.success || !data.data || data.data.length === 0) {
          console.log(`✅ Reached end of content at page ${currentPage - 1}`)
          hasMorePages = false
          break
        }
        
        // Process and save posts
        const posts = data.data.map((video: any) => this.normalizePost(video))
        this.posts.push(...posts)
        
        this.stats.total_posts_scraped += posts.length
        this.stats.total_pages_scraped = currentPage
        
        console.log(`   ✓ Scraped ${posts.length} posts (Total: ${this.stats.total_posts_scraped})`)
        
        // Save progress every 10 pages
        if (currentPage % 10 === 0) {
          this.saveProgress()
          console.log(`   💾 Progress saved at page ${currentPage}`)
        }
        
        // Rate limiting - wait 1 second between requests
        await this.delay(1000)
        
        currentPage++
        
        // Safety limit - max 500 pages
        if (currentPage > 500) {
          console.log('⚠️  Reached safety limit of 500 pages')
          hasMorePages = false
        }
        
      } catch (error) {
        console.error(`❌ Error scraping page ${currentPage}:`, error)
        this.stats.failed_pages++
        
        // Skip to next page after error
        currentPage++
        
        // If too many failures, stop
        if (this.stats.failed_pages > 10) {
          console.error('Too many failures, stopping scraper')
          hasMorePages = false
        }
      }
    }
    
    this.stats.end_time = new Date().toISOString()
    this.stats.status = 'completed'
    
    // Final save
    this.saveFinal()
    
    this.printSummary()
  }
  
  private normalizePost(video: any): Post {
    const slug = video.slug || this.generateSlug(video.title)
    
    return {
      id: `indianpornhq-${slug}`,
      provider: 'indianpornhq',
      title: video.title,
      slug: slug,
      thumbnail: video.thumbnail || video.thumbnailUrl || '',
      video_url: video.videoUrl || video.video_url || '',
      embed_url: video.embedUrl || video.embed_url,
      duration: video.duration || 'Unknown',
      quality: video.quality || 'HD',
      description: video.description || '',
      tags: video.tags || [],
      categories: video.categories || [],
      rating: 0,
      views: 0,
      uploaded_at: video.uploadedAt || new Date().toISOString(),
      indexed_at: new Date().toISOString(),
      seo_title: `${video.title} - Watch Free on PremiumHUB`,
      seo_description: (video.description || video.title).substring(0, 160),
      seo_keywords: [video.title, ...(video.tags || [])].join(', ').substring(0, 200),
      is_featured: false,
      is_trending: false
    }
  }
  
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
  
  private saveProgress() {
    const progressFile = path.join(this.outputDir, 'indianpornhq-progress.json')
    fs.writeFileSync(progressFile, JSON.stringify({
      stats: this.stats,
      last_saved: new Date().toISOString(),
      posts_count: this.posts.length
    }, null, 2))
  }
  
  private saveFinal() {
    // Save all posts
    const postsFile = path.join(this.outputDir, 'indianpornhq-posts.json')
    fs.writeFileSync(postsFile, JSON.stringify(this.posts, null, 2))
    console.log(`\n💾 Saved ${this.posts.length} posts to: ${postsFile}`)
    
    // Save stats
    const statsFile = path.join(this.outputDir, 'indianpornhq-stats.json')
    fs.writeFileSync(statsFile, JSON.stringify(this.stats, null, 2))
    console.log(`📊 Stats saved to: ${statsFile}`)
    
    // Save metadata
    const metadata = {
      provider: 'indianpornhq',
      total_posts: this.posts.length,
      total_pages: this.stats.total_pages_scraped,
      failed_pages: this.stats.failed_pages,
      start_time: this.stats.start_time,
      end_time: this.stats.end_time,
      duration_seconds: this.calculateDuration(),
      average_posts_per_page: Math.round(this.posts.length / this.stats.total_pages_scraped),
      ready_for_db: true,
      verified: false
    }
    
    const metadataFile = path.join(this.outputDir, 'indianpornhq-metadata.json')
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2))
  }
  
  private calculateDuration(): number {
    if (!this.stats.end_time) return 0
    const start = new Date(this.stats.start_time).getTime()
    const end = new Date(this.stats.end_time).getTime()
    return Math.round((end - start) / 1000)
  }
  
  private printSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 SCRAPING SUMMARY - IndianPornHQ')
    console.log('='.repeat(60))
    console.log(`Total Posts Scraped: ${this.stats.total_posts_scraped}`)
    console.log(`Total Pages Scraped: ${this.stats.total_pages_scraped}`)
    console.log(`Failed Pages: ${this.stats.failed_pages}`)
    console.log(`Duration: ${this.calculateDuration()} seconds`)
    console.log(`Average Posts/Page: ${Math.round(this.posts.length / this.stats.total_pages_scraped)}`)
    console.log(`Status: ${this.stats.status}`)
    console.log('='.repeat(60))
    
    // Show sample posts
    console.log('\n📝 Sample Posts (first 3):')
    this.posts.slice(0, 3).forEach((post, idx) => {
      console.log(`\n${idx + 1}. ${post.title}`)
      console.log(`   Slug: ${post.slug}`)
      console.log(`   Duration: ${post.duration}`)
      console.log(`   Categories: ${post.categories.join(', ')}`)
      console.log(`   Tags: ${post.tags.slice(0, 3).join(', ')}`)
    })
    
    console.log('\n✅ All data saved to: data/posts/')
    console.log('Next step: Run verification script')
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Run the scraper
const scraper = new IndianPornHQScraper()
scraper.scrapeAll()
  .then(() => {
    console.log('\n✅ IndianPornHQ scraping completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Scraping failed:', error)
    process.exit(1)
  })
