# PremiumHub Next.js Project

A Next.js application for browsing and viewing content from external APIs.

## Features

- Browse content by categories
- View creator profiles and their content
- Watch videos and webseries
- Basic search functionality (via external API)
- Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory with your API configuration:
   ```
   # API endpoints
   CATEGORY_API_URL=your_category_api_url
   CREATOR_API_URL=your_creator_api_url
   API_BASE_URL=your_api_base_url
   WEBSERIES_API_URL=your_webseries_api_url
   SEARCH_API_URL=your_search_api_url
   AUTH_API_URL=your_auth_api_url
   EMBED_API_URL=your_embed_api_url
   PLAYER_API_URL=your_player_api_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `components/` - React components
- `pages/` - Next.js pages
- `services/` - API services
- `utils/` - Utility functions
- `types/` - TypeScript type definitions

## API Integration

The application integrates with external APIs for:
- Categories and their videos
- Creators and their content
- Search functionality
- Video embedding and playback

## Search Functionality

Currently, the search functionality relies directly on the external API. A more advanced search implementation is planned as a separate service.

## License

This project is licensed under the MIT License. 