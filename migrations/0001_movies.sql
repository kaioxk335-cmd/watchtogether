CREATE TABLE IF NOT EXISTS movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT 'Filme',
  year INTEGER,
  duration TEXT,
  description TEXT,
  poster_key TEXT,
  video_key TEXT,
  poster_url TEXT,
  video_url TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at DESC);
