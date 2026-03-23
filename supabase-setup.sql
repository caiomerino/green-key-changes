-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Creates the email_captures table and enables public insert access

-- 1. Create the table
CREATE TABLE IF NOT EXISTS email_captures (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'green-key-changes',
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add a unique constraint to prevent duplicate emails
ALTER TABLE email_captures ADD CONSTRAINT email_captures_email_unique UNIQUE (email);

-- 3. Enable Row Level Security
ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous inserts (the anon key can insert but NOT read/update/delete)
CREATE POLICY "Allow anonymous inserts" ON email_captures
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5. Only authenticated users (you, in the dashboard) can read
CREATE POLICY "Authenticated users can read" ON email_captures
  FOR SELECT
  TO authenticated
  USING (true);
