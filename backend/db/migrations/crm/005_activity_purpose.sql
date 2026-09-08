-- Migration 005: Add purpose to activities table for CRM lead-stage negotiation tracking
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS purpose TEXT DEFAULT 'General';
