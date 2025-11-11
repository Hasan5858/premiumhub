/**
 * Category Verification Script
 * Manually verify and approve scraped categories
 * Run: npx ts-node scripts/verify-categories.ts
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'

interface Category {
  id: string
  provider: string
  name: string
  slug: string
  thumbnail: string
  thumbnail_type: 'direct' | 'proxy'
  thumbnail_proxy_url?: string
  post_count: number
  scraped_at: string
  verified: boolean
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function verifyCategories() {
  console.log('🔍 Category Verification Tool\n')
  
  const categoriesDir = path.join(__dirname, '../data/categories')
  const providers = ['webxseries', 'fsiblog5', 'kamababa', 'superporn', 'indianpornhq']
  
  for (const provider of providers) {
    const filePath = path.join(categoriesDir, `${provider}.json`)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${provider}.json not found, skipping...`)
      continue
    }
    
    const categories: Category[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    console.log(`\n📦 Provider: ${provider.toUpperCase()}`)
    console.log(`Total categories: ${categories.length}`)
    console.log(`Verified: ${categories.filter(c => c.verified).length}`)
    console.log(`Pending: ${categories.filter(c => !c.verified).length}\n`)
    
    // Show sample categories
    console.log('Sample categories:')
    categories.slice(0, 5).forEach((cat, idx) => {
      console.log(`  ${idx + 1}. ${cat.name} (${cat.post_count} posts)`)
      console.log(`     Thumbnail: ${cat.thumbnail_type === 'proxy' ? 'Via Proxy' : 'Direct URL'}`)
      if (cat.thumbnail_type === 'proxy') {
        console.log(`     Proxy URL: ${cat.thumbnail_proxy_url}`)
      }
    })
    
    const action = await question(
      `\nOptions:\n` +
      `  1. Approve all categories\n` +
      `  2. Review individually\n` +
      `  3. Skip to next provider\n` +
      `Choose (1-3): `
    )
    
    if (action === '1') {
      // Approve all
      categories.forEach(cat => cat.verified = true)
      fs.writeFileSync(filePath, JSON.stringify(categories, null, 2))
      console.log(`✅ All ${categories.length} categories approved for ${provider}`)
    } else if (action === '2') {
      // Individual review
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i]
        console.log(`\n[${i + 1}/${categories.length}] ${cat.name}`)
        console.log(`Slug: ${cat.slug}`)
        console.log(`Posts: ${cat.post_count}`)
        console.log(`Thumbnail: ${cat.thumbnail}`)
        
        const approve = await question('Approve? (y/n/q to quit): ')
        
        if (approve.toLowerCase() === 'q') break
        if (approve.toLowerCase() === 'y') {
          categories[i].verified = true
        }
      }
      
      fs.writeFileSync(filePath, JSON.stringify(categories, null, 2))
      console.log(`✅ Saved verification status for ${provider}`)
    }
  }
  
  // Generate verification report
  const report = {
    verified_at: new Date().toISOString(),
    providers: {} as Record<string, any>
  }
  
  for (const provider of providers) {
    const filePath = path.join(categoriesDir, `${provider}.json`)
    if (fs.existsSync(filePath)) {
      const categories: Category[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      report.providers[provider] = {
        total: categories.length,
        verified: categories.filter(c => c.verified).length,
        pending: categories.filter(c => !c.verified).length,
        needs_proxy: categories[0]?.thumbnail_type === 'proxy'
      }
    }
  }
  
  const reportPath = path.join(categoriesDir, 'verification-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log('\n📊 Verification Report:')
  console.log(JSON.stringify(report, null, 2))
  console.log(`\nReport saved to: ${reportPath}`)
  
  rl.close()
}

verifyCategories()
  .then(() => {
    console.log('\n✅ Verification completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error)
    rl.close()
    process.exit(1)
  })
