/**
 * Post Verification Script
 * Manually verify scraped posts before database upload
 * Run: npx ts-node scripts/verify-posts.ts indianpornhq
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'

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
  verified?: boolean
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function verifyPosts(provider: string) {
  const postsFile = path.join(__dirname, `../data/posts/${provider}-posts.json`)
  
  if (!fs.existsSync(postsFile)) {
    console.error(`❌ Posts file not found: ${postsFile}`)
    console.log('Available providers:')
    const files = fs.readdirSync(path.join(__dirname, '../data/posts'))
    files.forEach(file => console.log(`  - ${file}`))
    process.exit(1)
  }
  
  const posts: Post[] = JSON.parse(fs.readFileSync(postsFile, 'utf-8'))
  
  console.log('\n' + '='.repeat(60))
  console.log(`📝 POST VERIFICATION - ${provider.toUpperCase()}`)
  console.log('='.repeat(60))
  console.log(`Total Posts: ${posts.length}`)
  console.log(`Verified: ${posts.filter(p => p.verified).length}`)
  console.log(`Pending: ${posts.filter(p => !p.verified).length}`)
  console.log('='.repeat(60))
  
  // Show sample posts
  console.log('\n📊 Sample Posts (first 5):')
  posts.slice(0, 5).forEach((post, idx) => {
    console.log(`\n${idx + 1}. ${post.title}`)
    console.log(`   ID: ${post.id}`)
    console.log(`   Slug: ${post.slug}`)
    console.log(`   Duration: ${post.duration} | Quality: ${post.quality}`)
    console.log(`   Thumbnail: ${post.thumbnail.substring(0, 60)}...`)
    console.log(`   Video URL: ${post.video_url ? '✓ Present' : '✗ Missing'}`)
    console.log(`   Categories: ${post.categories.slice(0, 3).join(', ')}`)
    console.log(`   Tags: ${post.tags.slice(0, 5).join(', ')}`)
  })
  
  console.log('\n' + '='.repeat(60))
  console.log('Verification Options:')
  console.log('1. Approve all posts')
  console.log('2. Review posts individually (by sampling)')
  console.log('3. Check for issues (missing data)')
  console.log('4. Skip verification')
  console.log('='.repeat(60))
  
  const choice = await question('\nYour choice (1-4): ')
  
  if (choice === '1') {
    // Approve all
    posts.forEach(post => post.verified = true)
    console.log(`✅ Approved all ${posts.length} posts`)
  } else if (choice === '2') {
    // Sample review - show every 50th post
    const sampleSize = Math.min(20, Math.floor(posts.length / 50) + 1)
    const sampleInterval = Math.floor(posts.length / sampleSize)
    
    console.log(`\n📊 Reviewing ${sampleSize} sample posts...`)
    
    for (let i = 0; i < posts.length; i += sampleInterval) {
      const post = posts[i]
      console.log(`\n--- Post ${i + 1}/${posts.length} ---`)
      console.log(`Title: ${post.title}`)
      console.log(`Slug: ${post.slug}`)
      console.log(`Duration: ${post.duration}`)
      console.log(`Thumbnail: ${post.thumbnail.substring(0, 60)}...`)
      console.log(`Video URL: ${post.video_url ? '✓' : '✗'}`)
      console.log(`Categories: ${post.categories.join(', ')}`)
      
      const approve = await question('Looks good? (y/n/quit): ')
      
      if (approve.toLowerCase() === 'quit') {
        console.log('Verification stopped')
        break
      }
      
      if (approve.toLowerCase() === 'y') {
        post.verified = true
      }
    }
    
    // Ask if want to approve all based on samples
    const approveAll = await question('\nApprove all posts based on samples? (y/n): ')
    if (approveAll.toLowerCase() === 'y') {
      posts.forEach(post => post.verified = true)
      console.log('✅ Approved all posts')
    }
  } else if (choice === '3') {
    // Check for issues
    console.log('\n🔍 Checking for issues...')
    
    const issues = {
      missing_title: posts.filter(p => !p.title || p.title.length < 3),
      missing_thumbnail: posts.filter(p => !p.thumbnail),
      missing_video_url: posts.filter(p => !p.video_url),
      missing_categories: posts.filter(p => !p.categories || p.categories.length === 0),
      missing_slug: posts.filter(p => !p.slug)
    }
    
    console.log('\n📋 Issue Summary:')
    Object.entries(issues).forEach(([issue, posts]) => {
      console.log(`  ${issue}: ${posts.length}`)
      if (posts.length > 0 && posts.length <= 5) {
        posts.forEach(p => console.log(`    - ${p.id}: ${p.title}`))
      }
    })
    
    const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0)
    
    if (totalIssues === 0) {
      console.log('\n✅ No issues found! All posts have complete data.')
      const approveAll = await question('\nApprove all posts? (y/n): ')
      if (approveAll.toLowerCase() === 'y') {
        posts.forEach(post => post.verified = true)
        console.log('✅ Approved all posts')
      }
    } else {
      console.log(`\n⚠️  Found ${totalIssues} posts with issues`)
      const proceed = await question('Do you want to approve posts without issues? (y/n): ')
      if (proceed.toLowerCase() === 'y') {
        const issueIds = new Set(
          Object.values(issues).flatMap(arr => arr.map(p => p.id))
        )
        posts.forEach(post => {
          if (!issueIds.has(post.id)) {
            post.verified = true
          }
        })
        console.log(`✅ Approved ${posts.filter(p => p.verified).length} posts without issues`)
      }
    }
  } else {
    console.log('⏭️  Skipping verification')
    rl.close()
    return
  }
  
  // Save updated posts
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2))
  console.log(`\n💾 Updated posts saved to: ${postsFile}`)
  
  // Generate verification report
  const report = {
    provider,
    timestamp: new Date().toISOString(),
    total_posts: posts.length,
    verified_posts: posts.filter(p => p.verified).length,
    pending_posts: posts.filter(p => !p.verified).length,
    verification_rate: Math.round((posts.filter(p => p.verified).length / posts.length) * 100),
    ready_for_upload: posts.every(p => p.verified)
  }
  
  const reportFile = path.join(__dirname, `../data/posts/${provider}-verification-report.json`)
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 VERIFICATION REPORT')
  console.log('='.repeat(60))
  console.log(`Total Posts: ${report.total_posts}`)
  console.log(`Verified: ${report.verified_posts} (${report.verification_rate}%)`)
  console.log(`Pending: ${report.pending_posts}`)
  console.log(`Ready for Upload: ${report.ready_for_upload ? '✅ YES' : '⏳ NO'}`)
  console.log('='.repeat(60))
  console.log(`\nReport saved to: ${reportFile}`)
  
  if (report.ready_for_upload) {
    console.log('\n✅ All posts verified! Ready to upload to database.')
    console.log('Next step: Run upload script')
  } else {
    console.log(`\n⚠️  ${report.pending_posts} posts still need verification`)
  }
  
  rl.close()
}

// Parse command line arguments
const provider = process.argv[2]

if (!provider) {
  console.error('Usage: npx ts-node scripts/verify-posts.ts <provider>')
  console.error('Example: npx ts-node scripts/verify-posts.ts indianpornhq')
  process.exit(1)
}

verifyPosts(provider).catch(error => {
  console.error('Error:', error)
  rl.close()
  process.exit(1)
})
