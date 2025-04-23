
-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES 
(1, 'admin', 'Administrator with full access'),
(2, 'user', 'Regular user') 
ON CONFLICT DO NOTHING;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  role_id INTEGER DEFAULT 2 NOT NULL REFERENCES roles(id),
  hearts INTEGER DEFAULT 5 NOT NULL,
  last_heart_refill TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  image_url TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  badge_id INTEGER REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_premium BOOLEAN DEFAULT false,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT REFERENCES modules(id),
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  order_num INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lesson_content table
CREATE TABLE IF NOT EXISTS lesson_content (
  id SERIAL PRIMARY KEY,
  lesson_id TEXT REFERENCES lessons(id),
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  lesson_id TEXT REFERENCES lessons(id),
  is_completed BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  completion_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);

-- Insert some initial badges
INSERT INTO badges (name, description, criteria, image_url) VALUES
('First Step', 'Complete your first lesson', '{"type": "lessons_completed", "count": 1}', NULL),
('Quick Learner', 'Complete 5 lessons', '{"type": "lessons_completed", "count": 5}', NULL),
('Knowledge Hunter', 'Complete 10 lessons', '{"type": "lessons_completed", "count": 10}', NULL),
('Perfect Score', 'Get 100% on any lesson', '{"type": "perfect_score", "count": 1}', NULL),
('Streak Master', 'Maintain a 7-day streak', '{"type": "streak_days", "count": 7}', NULL)
ON CONFLICT DO NOTHING;
