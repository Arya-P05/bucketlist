-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bucket_lists table
CREATE TABLE IF NOT EXISTS bucket_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_list_id UUID NOT NULL REFERENCES bucket_lists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bucket_lists_user_id ON bucket_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_items_bucket_list_id ON items(bucket_list_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own data" ON users
  FOR DELETE USING (auth.uid() = id);

-- Add INSERT policy for users table
CREATE POLICY "Allow public user registration" ON users
  FOR INSERT WITH CHECK (true);

-- Create policies for bucket_lists table
CREATE POLICY "Users can view their own bucket lists" ON bucket_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bucket lists" ON bucket_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bucket lists" ON bucket_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bucket lists" ON bucket_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for items table
CREATE POLICY "Users can view items in their bucket lists" ON items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bucket_lists
      WHERE bucket_lists.id = items.bucket_list_id
      AND bucket_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items in their bucket lists" ON items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bucket_lists
      WHERE bucket_lists.id = items.bucket_list_id
      AND bucket_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their bucket lists" ON items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bucket_lists
      WHERE bucket_lists.id = items.bucket_list_id
      AND bucket_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items in their bucket lists" ON items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bucket_lists
      WHERE bucket_lists.id = items.bucket_list_id
      AND bucket_lists.user_id = auth.uid()
    )
  ); 