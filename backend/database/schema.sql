-- Contact Form Database Schema
-- Following GDPR compliance and data retention requirements
-- SQLite database for simplicity (KISS principle)

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id TEXT PRIMARY KEY,  -- UUID stored as TEXT
    name TEXT NOT NULL CHECK(length(name) <= 100),
    email TEXT NOT NULL CHECK(length(email) <= 255),
    message TEXT NOT NULL CHECK(length(message) <= 5000),
    timestamp TEXT NOT NULL,  -- ISO 8601 format
    consent_given BOOLEAN NOT NULL CHECK(consent_given = 1),  -- Must be true
    ip_address_hash TEXT NOT NULL,  -- Hashed for privacy
    user_agent TEXT,  -- Sanitized user agent string
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    retention_expiry TEXT,  -- Calculated expiry date for GDPR compliance
    
    -- Indexes for common queries
    CONSTRAINT email_format CHECK(email LIKE '%@%.%')
);

-- Index for efficient queries by email (for GDPR data export/deletion)
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);

-- Index for efficient queries by timestamp (for retention cleanup)
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);

-- Index for retention expiry queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_retention_expiry ON contact_submissions(retention_expiry);

-- Audit logs table for compliance tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,  -- UUID stored as TEXT
    event_type TEXT NOT NULL,
    timestamp TEXT NOT NULL,  -- ISO 8601 format
    user_id TEXT,  -- Optional, for authenticated users
    ip_hash TEXT,  -- Hashed IP address
    user_agent TEXT,  -- Sanitized user agent
    submission_id TEXT,  -- Optional FK to contact_submissions
    event_data TEXT,  -- JSON string with event details
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (submission_id) REFERENCES contact_submissions(id) ON DELETE SET NULL
);

-- Index for efficient audit log queries by event type
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);

-- Index for efficient audit log queries by timestamp
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Index for efficient audit log queries by submission
CREATE INDEX IF NOT EXISTS idx_audit_logs_submission_id ON audit_logs(submission_id);

-- Trigger to update updated_at timestamp on contact_submissions
CREATE TRIGGER IF NOT EXISTS update_contact_submission_timestamp 
AFTER UPDATE ON contact_submissions
FOR EACH ROW
BEGIN
    UPDATE contact_submissions 
    SET updated_at = datetime('now') 
    WHERE id = NEW.id;
END;

-- View for submissions needing cleanup (past retention period)
CREATE VIEW IF NOT EXISTS expired_submissions AS
SELECT id, email, created_at, retention_expiry
FROM contact_submissions
WHERE retention_expiry IS NOT NULL 
  AND datetime(retention_expiry) < datetime('now');

-- View for recent submissions (last 30 days) for monitoring
CREATE VIEW IF NOT EXISTS recent_submissions AS
SELECT id, name, email, timestamp, created_at
FROM contact_submissions
WHERE datetime(created_at) > datetime('now', '-30 days')
ORDER BY created_at DESC;

-- View for audit trail summary
CREATE VIEW IF NOT EXISTS audit_summary AS
SELECT 
    event_type,
    COUNT(*) as event_count,
    MIN(timestamp) as first_occurrence,
    MAX(timestamp) as last_occurrence
FROM audit_logs
GROUP BY event_type
ORDER BY event_count DESC;
