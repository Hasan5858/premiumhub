export interface AuthUser {
  id: string
  name: string
  email: string
  role?: string
  membership_status?: string
  membership_expires_at?: string | null
  avatar?: string
  membership?: MembershipPlan
  devices?: Device[]
}

export interface AuthResponse {
  success?: boolean
  token: string
  refresh_token?: string
  refreshToken?: string // Alternative naming
  user: AuthUser
  device_id?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  membership?: MembershipPlan
  devices?: Device[]
}

export interface MembershipPlan {
  id: string
  name: string
  price: number
  duration: string
  features: string[]
  isActive: boolean
  expiresAt?: string
}

export interface Device {
  id: string
  name: string
  type: string
  lastActive: string
  ipAddress: string
  location?: string
}

// Add is_current property to UserDevice interface
export interface UserDevice {
  id: number // Database ID of the device record
  device_id: string // Unique device identifier
  device_info: string
  ip_address: string
  last_login_at: string
  is_current?: boolean // Flag to indicate if this is the current device
}

export interface Category {
  slug: string
  name: string
  videoCount: number
  imageUrl: string
}

export interface CategoryResponse {
  categories: Category[]
  pagination: {
    currentPage: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
    nextPageUrl: string | null
    prevPageUrl: string | null
  }
}

export interface Video {
  id: string
  title: string
  thumbnail: string
  duration: string
  rating: number
  year: number
  category: string
  views: string
  playerUrl: string
}

export interface CategoryDetails {
  category: {
    slug: string
    name: string
    description?: string
  }
  videos: Video[]
  pagination: {
    currentPage: number
    totalPages: number
    hasNextPage: boolean
  }
}


export interface SearchResponse {
  videos: Video[]
  pagination: {
    currentPage: number
    totalPages: number
    hasNextPage: boolean
  }
}

export interface WebseriesPost {
  id: string
  title: string
  thumbnail: string
  duration: string
  quality?: string
  link: string
  originalUrl?: string
  categories?: string[]
}

// Make sure the WebseriesDetails type includes the source field
export interface WebseriesDetails {
  success: boolean
  video: {
    title: string
    description: string
    poster: string
    url: string
    source: string
    tags: string
    playerIframe?: string
    download_link?: string
    duration?: string
  }
}
