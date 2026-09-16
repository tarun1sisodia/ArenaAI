-- Migration 0014: Add status, notes, and updated_at to inquiries table for admin operations desk management

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'new';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notes TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
