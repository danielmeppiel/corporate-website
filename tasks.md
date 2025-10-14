# Tasks: Contact Form with Database Integration

**Input**: spec.md - Contact form implementation plan
**Prerequisites**: Existing contact_handler.py, frontend form in index.html

## Task Format
- **[P]**: Can run in parallel (different files, no dependencies)
- Tasks are numbered sequentially (T001, T002...)
- Each task includes exact file paths

## Phase 1: Database Setup

### T001: Create database schema and initialization
**Description**: Create SQLite database schema with contact_submissions and audit_logs tables
**Files**: 
- Create `backend/database/schema.sql`
- Create `backend/database/init_db.py`
**Dependencies**: None
**Acceptance Criteria**:
- Schema includes all required fields from spec (id, name, email, message, timestamp, consent_given, ip_address_hash, created_at, updated_at)
- Audit logs table includes event tracking fields
- init_db.py can create and initialize the database
- Tables have proper indexes for query performance

### T002: [P] Create database connection manager
**Description**: Implement database connection management with proper error handling
**Files**:
- Create `backend/database/db_manager.py`
**Dependencies**: None (can run parallel with T001)
**Acceptance Criteria**:
- Connection pooling for efficiency
- Automatic retry logic for transient failures
- Graceful error handling
- Context manager support for transactions

### T003: [P] Create database models
**Description**: Create Python models for contact_submissions and audit_logs
**Files**:
- Create `backend/models/contact_submission.py`
- Create `backend/models/audit_log.py`
**Dependencies**: None (can run parallel with T001-T002)
**Acceptance Criteria**:
- Models match database schema
- Include validation methods
- Support for serialization to/from database rows

## Phase 2: Backend API Implementation

### T004: Integrate database with contact handler
**Description**: Update contact_handler.py to use database for storage
**Files**:
- Modify `server/contact_handler.py`
**Dependencies**: T001, T002, T003 (requires database setup)
**Acceptance Criteria**:
- Replace placeholder storage with actual database operations
- Maintain all existing validation and security features
- Add proper error handling for database failures
- Audit logging continues to work

### T005: Create FastAPI endpoint for contact submissions
**Description**: Create POST /api/contact endpoint in FastAPI backend
**Files**:
- Create `backend/api/contact.py` (or update if exists)
- Update `backend/main.py` to register the endpoint
**Dependencies**: T004 (requires integrated contact handler)
**Acceptance Criteria**:
- Endpoint accepts JSON payload with name, email, message, consent
- Returns appropriate HTTP status codes (200, 400, 429, 500)
- Includes CORS headers
- Rate limiting implemented
- CSRF token validation

### T006: [P] Add database cleanup/maintenance script
**Description**: Create script to clean up expired submissions per GDPR retention policy
**Files**:
- Create `backend/scripts/cleanup_expired_data.py`
**Dependencies**: T002, T003 (requires database access)
**Acceptance Criteria**:
- Identifies submissions older than retention period (5 years)
- Deletes expired submissions
- Logs cleanup actions to audit log
- Can be run as cron job

## Phase 3: Frontend Integration

### T007: Update frontend to call backend API
**Description**: Modify main.js handleSubmit to call the FastAPI backend
**Files**:
- Modify `main.js`
**Dependencies**: T005 (requires backend endpoint)
**Acceptance Criteria**:
- Form submission calls POST /api/contact
- Includes CSRF token in request
- Shows loading state during submission
- Displays success/error messages to user
- Handles network errors gracefully

### T008: [P] Add GDPR consent checkbox to form
**Description**: Add explicit GDPR consent checkbox to contact form
**Files**:
- Modify `index.html`
- Update `style.css` for checkbox styling
**Dependencies**: None (can run in parallel)
**Acceptance Criteria**:
- Checkbox is clearly labeled with GDPR consent text
- Form cannot be submitted without consent
- Accessible (proper ARIA labels)
- Styled consistently with rest of form

## Phase 4: Testing & Documentation

### T009: [P] Add backend integration tests
**Description**: Create comprehensive tests for backend functionality
**Files**:
- Create `tests/integration/test_contact_api.py`
- Create `tests/unit/test_db_manager.py`
**Dependencies**: T001-T005 (requires implementation)
**Acceptance Criteria**:
- Tests cover successful submission flow
- Tests cover validation failures
- Tests cover database error scenarios
- Tests cover rate limiting
- All tests pass

### T010: [P] Add end-to-end tests
**Description**: Create tests that verify complete user flow
**Files**:
- Create `tests/e2e/test_contact_form_submission.py`
**Dependencies**: T007 (requires frontend integration)
**Acceptance Criteria**:
- Test simulates user filling and submitting form
- Verifies data is stored in database
- Verifies user sees success message
- Tests error scenarios

### T011: [P] Update documentation
**Description**: Document the contact form feature and deployment
**Files**:
- Update `docs/API.md` with contact endpoint documentation
- Create `docs/DEPLOYMENT.md` with database setup instructions
**Dependencies**: T001-T007 (requires implementation)
**Acceptance Criteria**:
- API documentation includes request/response examples
- Deployment docs include database initialization steps
- GDPR compliance measures are documented
- Rate limiting behavior is documented

## Phase 5: Manual Testing & Polish

### T012: Manual testing and bug fixes
**Description**: Manually test the complete feature and fix any issues found
**Files**:
- Various files as needed for bug fixes
**Dependencies**: T001-T011 (requires all implementation)
**Acceptance Criteria**:
- Successfully submit contact form and verify database storage
- Test on different browsers
- Test with various input data (valid and invalid)
- Test error scenarios (database down, network issues)
- All bugs found are fixed

## Task Dependencies Graph

```
T001 (schema) ─┬─> T004 (integrate DB) ──> T005 (API endpoint) ──> T007 (frontend)
               │                                                           │
T002 (DB mgr) ─┴─> T006 (cleanup)                                        │
               │                                                           │
T003 (models) ─┘                                                          │
                                                                           │
T008 (consent) ──────────────────────────────────────────────────────────┤
                                                                           │
                                                                           v
                                                                      T009-T012
                                                                    (Testing & Docs)
```

## Parallel Execution Examples

### Can Run Together (Phase 1):
- T002 (DB manager) + T003 (models) - different files, no overlap

### Can Run Together (Phase 4):
- T009 (backend tests) + T010 (e2e tests) + T011 (docs) - independent tasks

## Notes
- Follow KISS principle: Use SQLite, not complex database
- Leverage existing code: contact_handler.py already has validation
- Security first: Maintain GDPR compliance and security measures
- Test thoroughly: Both automated and manual testing
- Document clearly: Make deployment easy for next developer

## Current Status
- **Next Task**: T001 - Create database schema and initialization
- **Blocked Tasks**: T004-T005 (waiting on T001-T003)
- **Ready for Parallel**: T002, T003 (can start alongside T001)
