-- Migration 023: Helpdesk & Support Tickets Schema
CREATE TABLE IF NOT EXISTS helpdesk_tickets (
  id VARCHAR(50) PRIMARY KEY,
  ticket_no VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  assigned_agent VARCHAR(100) DEFAULT 'Support Desk',
  category VARCHAR(50) DEFAULT 'General',
  description TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  history JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_status ON helpdesk_tickets(status);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_priority ON helpdesk_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_customer ON helpdesk_tickets(customer_id);

-- Seed initial existing tickets without resetting or deleting records
INSERT INTO helpdesk_tickets (
  id,
  ticket_no,
  subject,
  customer_name,
  customer_id,
  priority,
  status,
  assigned_agent,
  category,
  description,
  created_at,
  updated_at,
  history
)
VALUES 
  (
    'TCK-201',
    'HD-8091',
    'Invoice PDF download alignment query',
    'Globex Corporation',
    'CUST-001',
    'Medium',
    'Open',
    'Support Desk',
    'Billing',
    'Customer reported invoice header overlapping line items when generating PDF download.',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour',
    '[{"action": "Created", "author": "System / George Globex", "timestamp": "1 hour ago", "note": "Initial ticket submission"}]'::jsonb
  ),
  (
    'TCK-202',
    'HD-8088',
    'Biometric Attendance sync delay',
    'Initech LLC',
    'CUST-002',
    'High',
    'In Progress',
    'Tech Team',
    'Technical',
    'Automated biometric sync is lagging by 45 minutes during morning punch-in spikes.',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '2 hours',
    '[{"action": "Created", "author": "System / Bill Lumbergh", "timestamp": "5 hours ago", "note": "Reported biometric sync issue"}, {"action": "Assigned", "author": "Support Desk", "timestamp": "2 hours ago", "note": "Assigned to Tech Team for network investigation"}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

