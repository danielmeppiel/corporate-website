# Feature Specification: Contact Form with Database Integration

**Feature Branch**: `copilot/add-contact-form-to-website`  
**Created**: 2025-10-14  
**Status**: In Progress  
**Input**: User wants to add a contact form that fills a database on the website

## Overview

Add a simple contact form to the corporate website that stores submissions in a database. The implementation follows the KISS (Keep It Simple, Stupid) principle while maintaining GDPR compliance and security standards already established in the codebase.

## User Scenarios & Testing

### Primary User Story
A visitor to the corporate website wants to contact the company. They:
1. Navigate to the contact section
2. Fill in their name, email, and message
3. Submit the form
4. Receive confirmation that their message was received
5. Their data is securely stored in a database for the company to review

### Acceptance Scenarios
1. **Given** a visitor is on the contact page, **When** they fill in all required fields (name, email, message) and submit, **Then** the form data is validated, stored in the database, and they see a success message
2. **Given** a visitor submits the form, **When** the backend receives the data, **Then** it validates the input, checks GDPR consent, and stores it securely with proper audit logging
3. **Given** invalid data is submitted, **When** validation fails, **Then** the user sees clear error messages without the data being stored

### Edge Cases
- What happens when the database is unavailable?
- How does the system handle duplicate submissions from the same user?
- What happens if required fields are missing or contain malicious content?
- How are submissions with invalid email formats handled?

## Requirements

### Functional Requirements
- **FR-001**: System MUST store contact form submissions (name, email, message, timestamp, consent flag) in a database
- **FR-002**: System MUST validate all input data before storing (email format, field lengths, suspicious content detection)
- **FR-003**: System MUST require and verify GDPR consent before storing personal data
- **FR-004**: System MUST log all form submissions to an audit trail for compliance
- **FR-005**: System MUST rate-limit submissions to prevent abuse (max 5 requests per 5 minutes per IP)
- **FR-006**: System MUST hash IP addresses before storage for privacy compliance
- **FR-007**: System MUST provide feedback to users (success or error messages)
- **FR-008**: System MUST handle database connection failures gracefully
- **FR-009**: System MUST implement data retention policies (5 years for contact forms)
- **FR-010**: System MUST support GDPR data export and deletion requests

### Key Entities
- **ContactSubmission**: Represents a contact form submission
  - Fields: id (UUID), name (string, max 100 chars), email (string, max 255 chars), message (string, max 5000 chars), timestamp (ISO datetime), consent_given (boolean), ip_address_hash (string), created_at, updated_at
  - Relationships: May have associated audit logs
  
- **AuditLog**: Tracks all form submission events for compliance
  - Fields: id (UUID), event_type (string), timestamp (ISO datetime), ip_hash (string), event_data (JSON), submission_id (optional FK to ContactSubmission)

## Implementation Plan (KISS Approach)

### Tech Stack (Already Present)
- Frontend: Vanilla HTML/CSS/JavaScript (already has form in index.html)
- Backend: Python with FastAPI (backend/api/ structure exists)
- Database: SQLite for simplicity (can upgrade to PostgreSQL later)
- Testing: pytest (tests/ structure exists)

### Atomic Tasks

**Task 1: Database Setup**
- Create SQLite database schema for contact_submissions and audit_logs tables
- Set up database connection management
- Create basic migration script

**Task 2: Backend API Endpoint**
- Create POST /api/contact endpoint in FastAPI
- Integrate with existing contact_handler.py validation logic
- Connect to database for storing submissions
- Return appropriate success/error responses

**Task 3: Frontend Integration**
- Update main.js to call the new API endpoint
- Add proper error handling and user feedback
- Ensure GDPR consent checkbox is included and validated

**Task 4: Testing**
- Add integration tests for the complete flow
- Test database operations (insert, query)
- Test error scenarios (validation failures, database errors)
- Manual testing of the UI

**Task 5: Documentation**
- Update API documentation
- Add deployment instructions for database setup

## Review & Acceptance Checklist

### Content Quality
- [x] No unnecessary complexity - using simple SQLite database
- [x] Focused on user value - storing contact submissions for business follow-up
- [x] Written for stakeholders - clear requirements and user stories
- [x] All mandatory sections completed

### Requirement Completeness  
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (form submission success rate, validation accuracy)
- [x] Scope is clearly bounded (contact form only, no other features)
- [x] Dependencies identified (requires FastAPI backend, SQLite)
- [x] GDPR and security requirements specified

## Next Steps

The immediate next step is to implement **Task 1: Database Setup**, which involves:
1. Creating the SQLite database schema
2. Setting up connection management
3. Creating migration scripts
4. Testing basic database operations

This will provide the foundation for the remaining tasks to build upon.
