-- PremiumHUB Content Database Schema
-- Database: phub-content-db
-- ID: 289636dc-5421-41de-aba9-706033f2b7d9

-- Main posts table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  thumbnail TEXT,
  video_url TEXT,
  embed_url TEXT,
  duration TEXT,
  quality TEXT DEFAULT 'HD',
  description TEXT,
  tags TEXT,
  categories TEXT,
  rating REAL DEFAULT 0,
  views INTEGER DEFAULT 0,
  uploaded_at DATETIME,
  indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  is_featured INTEGER DEFAULT 0,
  is_trending INTEGER DEFAULT 0
);

-- Indexing progress tracking
CREATE TABLE IF NOT EXISTS indexing_progress (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  last_indexed_page INTEGER DEFAULT 0,
  total_posts_indexed INTEGER DEFAULT 0,
  last_index_date DATETIME,
  posts_today INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_log TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily indexing quota
CREATE TABLE IF NOT EXISTS daily_quota (
  date TEXT PRIMARY KEY,
  posts_indexed INTEGER DEFAULT 0,
  posts_quota INTEGER DEFAULT 500,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Homepage cache
CREATE TABLE IF NOT EXISTS homepage_cache (
  provider TEXT PRIMARY KEY,
  posts TEXT,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search index
CREATE TABLE IF NOT EXISTS search_index (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  search_text TEXT,
  provider TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider ON posts(provider);
CREATE INDEX IF NOT EXISTS idx_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_uploaded ON posts(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_is_trending ON posts(is_trending);
CREATE INDEX IF NOT EXISTS idx_is_featured ON posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_provider_date ON posts(provider, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_provider ON search_index(provider);
CREATE INDEX IF NOT EXISTS idx_search_post ON search_index(post_id);

-- Insert initial provider tracking
INSERT INTO indexing_progress (id, provider, status) VALUES 
  ('webxseries-init', 'webxseries', 'pending'),
  ('fsiblog5-init', 'fsiblog5', 'pending'),
  ('kamababa-init', 'kamababa', 'pending'),
  ('superporn-init', 'superporn', 'pending'),
  ('indianpornhq-init', 'indianpornhq', 'pending');

-- Insert today's quota tracking
INSERT INTO daily_quota (date, posts_indexed, posts_quota) 
VALUES (date('now'), 0, 500);
