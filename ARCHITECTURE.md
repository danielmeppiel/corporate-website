# Architecture

This document describes the high-level architecture, component responsibilities, and key architectural decisions for the Corporate Website project.

## System Overview

The Corporate Website is an enterprise-grade web application built with a layered architecture that separates concerns across frontend presentation, business logic, and server-side processing. The project leverages APM (Agent Package Manager) dependencies for automated compliance and design enforcement.

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                         │
│  (index.html, main.js, style.css, frontend/components/)    │
├─────────────────────────────────────────────────────────────┤
│                    Source Layer (src/)                      │
│  (api/, components/, utils/ - TypeScript/React modules)    │
├─────────────────────────────────────────────────────────────┤
│                     Server Layer                            │
│  (server/ - Python handlers, backend/api/ - FastAPI)       │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

### Root Files

| File | Purpose |
|------|---------|
| `index.html` | Main entry point with semantic HTML structure |
| `main.js` | Application initialization, GDPR compliance, and accessibility features |
| `style.css` | Global styles and CSS variables |
| `apm.yml` | APM configuration defining dependencies and workflow scripts |
| `vite.config.js` | Vite build system configuration |

### `src/` - Source Modules

Contains the core TypeScript/JavaScript application logic:

- **`src/api/`** - API client utilities for server communication
  - `contact.ts` - Contact form submission with GDPR compliance (audit logging, data retention, CSRF protection)
  
- **`src/components/`** - React UI components
  - `ContactForm.tsx` - Accessible contact form with WCAG 2.1 AA compliance
  - `ContactForm.scss` - Component styles
  
- **`src/utils/`** - Shared utility functions
  - `validation.ts` - Input sanitization, email validation, rate limiting, and data retention management

### `server/` - Python Server Handlers

Contains server-side request handlers:

- `contact_handler.py` - Contact form processing with:
  - Input validation and sanitization
  - GDPR-compliant audit logging
  - Rate limiting
  - Data retention policy enforcement
  - CSRF token validation

### `backend/` - Backend API

Contains the backend API implementation:

- **`backend/api/`** - FastAPI REST endpoints
  - `users.py` - User management endpoints (GET/POST /users)

### `frontend/` - Frontend Components

Additional frontend UI components:

- **`frontend/components/`** - Standalone React components
  - `Header.tsx` - Site header with navigation

### `tests/` - Test Suite

Contains test files organized by type:

- `ContactForm.test.tsx` - React component tests
- `test_contact_handler.py` - Python handler tests
- `unit/` - Unit tests
- `integration/` - Integration tests

### `docs/` - Documentation

Project documentation:

- `API.md` - API endpoint documentation
- `wip/` - Work in progress documentation

### `scripts/` - Automation Scripts

- **`scripts/deployment/`** - Deployment automation
  - `deploy.sh` - Deployment script

### `.apm/` - APM Configuration

Contains APM-managed instructions and context files generated from dependencies.

### `styles/` - Style Assets

Additional CSS/SCSS style files.

## Data Flow: Contact Form Submission

The contact form submission follows a secure, GDPR-compliant flow:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   User Input     │────▶│  Frontend        │────▶│  Server          │
│   (Browser)      │     │  Validation      │     │  Processing      │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                │                         │
                                ▼                         ▼
                         ┌──────────────────┐     ┌──────────────────┐
                         │  Audit Logging   │     │  Data Storage    │
                         │  (Compliance)    │     │  (Encrypted)     │
                         └──────────────────┘     └──────────────────┘
```

### Step-by-Step Flow

1. **User Input** (`index.html`, `main.js`)
   - User fills out the contact form with name, email, and message
   - Client-side validation checks required fields and email format

2. **Frontend Validation** (`src/components/ContactForm.tsx`, `src/utils/validation.ts`)
   - Input sanitization to prevent XSS attacks
   - Email format validation
   - Rate limiting check

3. **Audit Logging** (`src/api/contact.ts`)
   - Log submission attempt with anonymized data
   - Record consent status for GDPR compliance

4. **API Request** (`src/api/contact.ts`)
   - CSRF token validation
   - POST request to `/api/contact` endpoint

5. **Server Processing** (`server/contact_handler.py`)
   - Validate CSRF token
   - Check rate limits (5 requests per 5 minutes)
   - Validate and sanitize input data
   - Hash IP address for privacy
   - Verify consent was given
   - Store data with retention policy metadata

6. **Response Handling**
   - Log success/failure to audit trail
   - Return user-friendly response
   - Reset form on success

## Key Architectural Decisions

### APM Dependency Integration

The project uses APM (Agent Package Manager) to compose enterprise dependencies:

```yaml
dependencies:
  apm:
    - danielmeppiel/compliance-rules    # GDPR, legal review, audit trails
    - danielmeppiel/design-guidelines   # WCAG 2.1 AA, design system
```

**Benefits:**
- Automated compliance enforcement through AI agent context
- Consistent design standards across all components
- Reusable enterprise workflows (audit, accessibility, legal review)

**Integration Points:**
- `apm compile` generates `AGENTS.md` files with context for AI coding agents
- Workflows defined in `apm.yml` trigger compliance and design review prompts
- Dependencies provide `.instructions.md` and `.prompt.md` files for agent guidance

### GDPR Compliance Patterns

The codebase implements several GDPR compliance patterns:

1. **Data Minimization**
   - Only collect necessary form fields
   - Truncate user agent strings to prevent fingerprinting

2. **Consent Management**
   - Explicit consent verification before data processing
   - Consent status logged in audit trail

3. **Audit Logging**
   - All data operations logged with timestamps
   - IP addresses hashed for privacy
   - Audit logs retained for 7 years per policy

4. **Data Retention**
   - Automated cleanup based on retention policies:
     - Contact forms: 5 years
     - Audit logs: 7 years
     - User sessions: 30 days
     - Analytics: 26 months

5. **Right to Erasure**
   - `deleteUserData()` function for data deletion requests
   - Audit trail maintained for deletion events

6. **Right to Data Portability**
   - `exportUserData()` function for data export requests
   - Machine-readable format support

### Accessibility Standards

All UI components follow WCAG 2.1 AA compliance:

- Semantic HTML structure
- ARIA attributes for form validation states
- Skip links for keyboard navigation
- Screen reader announcements for notifications
- Proper form labeling and help text

### Security Measures

1. **Input Validation**
   - XSS prevention through input sanitization
   - SQL injection prevention patterns
   - Maximum length enforcement

2. **CSRF Protection**
   - Token-based CSRF validation
   - Secure token generation

3. **Rate Limiting**
   - Request throttling per IP (hashed)
   - Configurable limits per endpoint

## Technology Stack

| Layer | Technology |
|-------|------------|
| Build System | Vite |
| Frontend | HTML, CSS, JavaScript (ES Modules) |
| Components | React, TypeScript, SCSS |
| Backend | Python, FastAPI |
| Testing | pytest, React Testing Library |
| Accessibility | axe-core, pa11y |
| APM Integration | APM CLI, AGENTS.md standard |

## Related Documentation

- [API Documentation](docs/API.md) - REST API endpoint reference
- [README.md](README.md) - Project overview and quick start guide
