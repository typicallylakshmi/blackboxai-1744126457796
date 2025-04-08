-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'vendor', 'attendee')),
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendors table
CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  services TEXT[],
  rating NUMERIC(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attendees table
CREATE TABLE attendees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  deadline TIMESTAMP,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  spent_amount NUMERIC(10,2) DEFAULT 0.00,
  categories JSONB NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_vendors_rating ON vendors(rating);