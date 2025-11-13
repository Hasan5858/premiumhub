// Gallery page for FSIBlog image galleries
// Reuses the video detail page since galleries use the same data structure
// This is just a routing wrapper to differentiate galleries from videos in URLs

import VideoDetailPage from '../video/[id]'

export default VideoDetailPage

// Re-export getServerSideProps
export { getServerSideProps } from '../video/[id]'
