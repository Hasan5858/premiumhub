# Provider System Documentation

This document describes the new provider system for managing multiple scraping sources in the phub-main project.

## Overview

The provider system allows you to easily add and manage multiple scraping sources (providers) for fetching video content. Each provider is a separate module that can scrape data from different websites.

## Architecture

```
pages/api/providers/
├── index.ts                    # Provider registry
├── unified.ts                  # Unified API endpoint
└── indianpornhq/              # IndianPornHQ provider
    ├── videos.ts              # Videos endpoint
    ├── categories.ts          # Categories endpoint
    ├── search.ts              # Search endpoint
    ├── video/[id].ts          # Video details endpoint
    └── utils/
        └── scraper.ts         # Scraping utilities
```

## Current Providers

### IndianPornHQ Provider

**Base URL:** `/api/providers/indianpornhq`

**Endpoints:**
- `GET /videos` - Get latest videos from homepage
- `GET /categories` - Get available categories
- `GET /search?q={query}&page={page}` - Search videos
- `GET /video/{id}` - Get video details

**Example Usage:**
```typescript
// Get latest videos
const response = await fetch('/api/providers/indianpornhq/videos')
const data = await response.json()

// Search videos
const searchResponse = await fetch('/api/providers/indianpornhq/search?q=indian&page=1')
const searchData = await searchResponse.json()

// Get video details
const videoResponse = await fetch('/api/providers/indianpornhq/video/12345')
const videoData = await videoResponse.json()
```

## Unified API

The unified API allows you to interact with all providers through a single endpoint:

**Base URL:** `/api/providers/unified`

**Parameters:**
- `action` - The action to perform (videos, search, video, categories, providers)
- `provider` - Specific provider name or 'all' for all providers
- `query` - Search query (for search action)
- `page` - Page number (for pagination)
- `videoId` - Video ID (for video details)

**Examples:**

```typescript
// Get videos from all providers
GET /api/providers/unified?action=videos&provider=all

// Get videos from specific provider
GET /api/providers/unified?action=videos&provider=indianpornhq

// Search across all providers
GET /api/providers/unified?action=search&provider=all&query=indian&page=1

// Get video details
GET /api/providers/unified?action=video&provider=indianpornhq&videoId=12345

// Get categories from all providers
GET /api/providers/unified?action=categories&provider=all

// List available providers
GET /api/providers/unified?action=providers
```

## Service Integration

The provider system is integrated with the existing API service:

```typescript
import { 
  fetchIndianPornHQVideos,
  searchAllProviderVideos,
  fetchProviderVideoDetails,
  fetchAllProviderCategories 
} from '@/services/api'

// Get videos from IndianPornHQ
const videos = await fetchIndianPornHQVideos()

// Search across all providers
const searchResults = await searchAllProviderVideos('indian', 1)

// Get video details
const videoDetails = await fetchProviderVideoDetails('indianpornhq', '12345')

// Get all categories
const categories = await fetchAllProviderCategories()
```

## Adding New Providers

To add a new provider:

1. **Create provider directory:**
   ```
   pages/api/providers/yourprovider/
   ├── videos.ts
   ├── categories.ts
   ├── search.ts
   ├── video/[id].ts
   └── utils/scraper.ts
   ```

2. **Update provider registry:**
   ```typescript
   // In pages/api/providers/index.ts
   const PROVIDERS = {
     indianpornhq: { ... },
     yourprovider: {
       name: 'Your Provider',
       baseUrl: '/api/providers/yourprovider',
       endpoints: {
         videos: '/videos',
         categories: '/categories',
         search: '/search',
         video: '/video'
       }
     }
   }
   ```

3. **Update service manager:**
   ```typescript
   // In services/providers.ts
   const PROVIDERS = {
     indianpornhq: { ... },
     yourprovider: { ... }
   }
   ```

## Response Format

All provider endpoints return a consistent response format:

```typescript
interface ProviderResponse<T> {
  success: boolean
  data: T[]
  total: number
  provider: string
  timestamp: string
  error?: string
  detail?: string
}
```

## Caching

The provider system includes built-in caching:
- Videos are cached for better performance
- Search results are cached to reduce API calls
- Video details are cached to avoid repeated scraping
- Cache keys are automatically generated based on parameters

## Error Handling

The system includes comprehensive error handling:
- Individual provider failures don't affect other providers
- Fallback data is provided when scraping fails
- Detailed error messages for debugging
- Graceful degradation when providers are unavailable

## Testing

To test the provider system:

1. **Test individual provider:**
   ```bash
   curl http://localhost:3000/api/providers/indianpornhq/videos
   ```

2. **Test unified API:**
   ```bash
   curl "http://localhost:3000/api/providers/unified?action=videos&provider=all"
   ```

3. **Test search:**
   ```bash
   curl "http://localhost:3000/api/providers/unified?action=search&provider=all&query=indian"
   ```

## Future Enhancements

- Add more providers (site2.xyz, site3.xyz, etc.)
- Implement provider health monitoring
- Add provider-specific configuration
- Implement rate limiting per provider
- Add provider analytics and metrics
- Implement provider failover mechanisms
