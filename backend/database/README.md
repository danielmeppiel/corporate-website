# Contact Form Database

This directory contains the database schema and initialization scripts for the contact form feature.

## Quick Start

Initialize the database:
```bash
python3 backend/database/init_db.py
```

Verify the database:
```bash
python3 backend/database/init_db.py --verify
```

## Files

- **schema.sql**: Complete database schema with tables, indexes, views, and triggers
- **init_db.py**: Database initialization and management script
- **contact_form.db**: SQLite database file (gitignored, created on initialization)

## Database Schema

### Tables

#### contact_submissions
Stores contact form submissions with GDPR compliance.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| name | TEXT | User's name (max 100 chars) |
| email | TEXT | User's email (max 255 chars) |
| message | TEXT | User's message (max 5000 chars) |
| timestamp | TEXT (ISO 8601) | Submission timestamp |
| consent_given | BOOLEAN | GDPR consent flag (must be true) |
| ip_address_hash | TEXT | Hashed IP address for privacy |
| user_agent | TEXT | Sanitized user agent string |
| created_at | TEXT (ISO 8601) | Record creation time |
| updated_at | TEXT (ISO 8601) | Last update time |
| retention_expiry | TEXT (ISO 8601) | Data retention expiry date |

#### audit_logs
Tracks all form submission events for compliance.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| event_type | TEXT | Type of event |
| timestamp | TEXT (ISO 8601) | Event timestamp |
| user_id | TEXT | User ID (if authenticated) |
| ip_hash | TEXT | Hashed IP address |
| user_agent | TEXT | Sanitized user agent |
| submission_id | TEXT | FK to contact_submissions |
| event_data | TEXT (JSON) | Additional event data |
| created_at | TEXT (ISO 8601) | Record creation time |

### Views

- **expired_submissions**: Submissions past retention period (for cleanup)
- **recent_submissions**: Last 30 days of submissions (for monitoring)
- **audit_summary**: Event type statistics (for reporting)

## Usage

### Command Line

```bash
# Initialize database
python3 backend/database/init_db.py

# Verify database structure
python3 backend/database/init_db.py --verify

# Reset database (deletes all data)
python3 backend/database/init_db.py --reset

# Use custom database path
python3 backend/database/init_db.py --path /path/to/custom.db

# Quiet mode (suppress output)
python3 backend/database/init_db.py --quiet
```

### Python Code

```python
from backend.database.init_db import init_database, verify_database
from pathlib import Path

# Initialize database
success = init_database()

# Verify database
is_valid = verify_database()

# Custom path
custom_db = Path("/custom/location/db.db")
init_database(db_path=custom_db)
```

## GDPR Compliance

The database design supports GDPR requirements:

- **Data Minimization**: Only necessary fields are stored
- **Consent Management**: Mandatory consent flag
- **Audit Trail**: Complete event logging
- **Right to Erasure**: Indexed by email for quick deletion
- **Right to Data Portability**: Structured data format
- **Data Retention**: Expiry date tracking
- **Privacy**: IP addresses are hashed before storage

## Maintenance

### Data Retention Cleanup

Query expired submissions:
```sql
SELECT * FROM expired_submissions;
```

Delete expired submissions:
```sql
DELETE FROM contact_submissions 
WHERE id IN (SELECT id FROM expired_submissions);
```

### Monitoring

View recent submissions:
```sql
SELECT * FROM recent_submissions;
```

View audit event summary:
```sql
SELECT * FROM audit_summary;
```

## Performance

The database includes indexes for:
- Email lookups (GDPR data export/deletion)
- Timestamp queries (data retention)
- Audit log filtering (event type, timestamp)
- Submission relationships (audit logs to submissions)

SQLite is configured with:
- WAL mode for better concurrency
- Foreign key constraints enabled
- Automatic timestamp updates via triggers

## Security

- Input validation enforced at database level (constraints)
- Email format validation
- Field length limits
- Mandatory GDPR consent
- IP addresses hashed before storage
- User agent strings sanitized

## Development

For development and testing:

1. Initialize a fresh database: `python3 backend/database/init_db.py`
2. The database file is gitignored
3. Reset database for testing: `python3 backend/database/init_db.py --reset`
4. Verify structure after changes: `python3 backend/database/init_db.py --verify`

## Production Deployment

1. On production server, run: `python3 backend/database/init_db.py`
2. Ensure database file has proper permissions (read/write for app user)
3. Set up automated cleanup job for expired data (cron job)
4. Regular backups of database file
5. Monitor disk space (SQLite database will grow over time)

## Troubleshooting

### Database is locked
- SQLite uses file locking
- Only one write operation at a time
- Use WAL mode (automatically enabled) for better concurrency

### Database file not found
- Run init_db.py to create the database
- Check database path is correct

### Schema mismatch
- Run `--verify` to check database structure
- Run `--reset` to recreate with current schema (WARNING: deletes all data)
