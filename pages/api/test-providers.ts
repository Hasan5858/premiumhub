import type { NextApiRequest, NextApiResponse } from "next"
import { providerManager } from "@/services/providers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    }

    // Test 1: Get available providers
    try {
      const providers = providerManager.getProviders()
      testResults.tests.push({
        name: 'Get Providers',
        status: 'success',
        data: providers,
        message: `Found ${Object.keys(providers).length} providers`
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Get Providers',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Get videos from IndianPornHQ
    try {
      const videos = await providerManager.getVideos('indianpornhq')
      testResults.tests.push({
        name: 'Get IndianPornHQ Videos',
        status: 'success',
        data: {
          total: videos.total,
          provider: videos.provider,
          sampleTitles: videos.data.slice(0, 3).map((v: any) => v.title)
        },
        message: `Found ${videos.total} videos from IndianPornHQ`
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Get IndianPornHQ Videos',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: Get categories from IndianPornHQ
    try {
      const categories = await providerManager.getCategories('indianpornhq')
      testResults.tests.push({
        name: 'Get IndianPornHQ Categories',
        status: 'success',
        data: {
          total: categories.total,
          provider: categories.provider,
          sampleCategories: categories.data.slice(0, 3).map((c: any) => c.name)
        },
        message: `Found ${categories.total} categories from IndianPornHQ`
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Get IndianPornHQ Categories',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: Search videos
    try {
      const searchResults = await providerManager.searchVideos('indianpornhq', 'indian', 1)
      testResults.tests.push({
        name: 'Search IndianPornHQ Videos',
        status: 'success',
        data: {
          total: searchResults.total,
          provider: searchResults.provider,
          query: 'indian'
        },
        message: `Found ${searchResults.total} search results for 'indian'`
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Search IndianPornHQ Videos',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Calculate overall status
    const successCount = testResults.tests.filter(t => t.status === 'success').length
    const totalTests = testResults.tests.length
    const overallStatus = successCount === totalTests ? 'success' : 'partial'

    res.status(200).json({
      success: true,
      overallStatus,
      summary: {
        total: totalTests,
        passed: successCount,
        failed: totalTests - successCount
      },
      ...testResults
    })

  } catch (error) {
    console.error('Provider Test Error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Test failed', 
      detail: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
