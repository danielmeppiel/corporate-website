# GDPR Compliance Implementation

This document describes the GDPR compliance features implemented in the Contoso Industries corporate website.

## Features Implemented

### 1. Cookie Consent Banner

**Location:** `index.html` (lines 104-116), `main.js` (initializeContosoConsent function)

**Functionality:**
- Displays on first visit when no consent is stored
- Three cookie categories: Essential (required), Analytics, Marketing
- Three action buttons:
  - "Accept All" - enables all cookies
  - "Essential Only" - only required cookies
- Stores consent preferences in localStorage with version tracking
- Logs consent decisions to audit trail

**Storage Key:** `contoso_cookie_consent_v1`

### 2. Privacy Consent Checkbox

**Location:** `index.html` (contact form), `main.js` (handleSubmit function), `style.css` (privacy-consent-* classes)

**Functionality:**
- Explicit checkbox required for form submission
- Links to privacy policy modal with detailed information
- Visual feedback when checked (blue border, light blue background)
- Accessible with proper ARIA attributes
- States data retention period (5 years)

**Validation:** Form cannot be submitted without checking the privacy consent checkbox

### 3. Google reCAPTCHA v3 Integration

**Frontend:** 
- Script tag in `index.html` head section
- Token generation in `main.js` handleSubmit function
- Uses action name: 'contact_submit'

**Backend:**
- `verify_recaptcha_token()` function in `server/contact_handler.py`
- Validates token with Google's verification API
- Checks score threshold (0.5) for spam detection
- Logs verification results to audit trail
- Gracefully degrades in development (no secret key)

**Configuration:**
- Site key: Set in index.html script tag
- Secret key: Set via `RECAPTCHA_SECRET_KEY` environment variable

### 4. Privacy Policy

**Location:** `main.js` (showPrivacyPolicyModal function)

**Content Includes:**
- Data collection practices
- Data retention periods (5 years for contact forms)
- User rights under GDPR
- Cookie usage explanation
- Security measures

**Access:** Clicking "Privacy Policy" link in consent checkbox opens modal

## Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Required variables:
- `RECAPTCHA_SECRET_KEY`: Your Google reCAPTCHA v3 secret key
- `RECAPTCHA_SITE_KEY`: Your Google reCAPTCHA v3 site key

Get keys from: https://www.google.com/recaptcha/admin

## Backend Changes

### contact_handler.py Updates

1. **New imports:** `urllib.request`, `urllib.parse` for reCAPTCHA verification
2. **New function:** `verify_recaptcha_token(token, remote_ip)` 
   - Verifies token with Google API
   - Returns success status and score
   - Logs verification events
3. **Updated `ContactFormHandler`:**
   - Added `recaptcha_threshold` attribute (0.5)
   - Updated `process_submission()` to accept `recaptcha_token` parameter
   - Validates reCAPTCHA before processing form
   - Logs reCAPTCHA usage in audit trail

## Testing

Run the GDPR compliance tests:

```bash
python3 tests/test_gdpr_compliance.py
```

Tests verify:
- reCAPTCHA verification function
- Handler configuration
- Form submission with and without reCAPTCHA
- Audit logging

## User Flow

1. **First Visit:**
   - Cookie consent banner appears at bottom of page
   - User chooses consent level
   - Preference stored in localStorage

2. **Contact Form Submission:**
   - User fills out form fields (name, email, message)
   - User checks privacy consent checkbox
   - User clicks "Send Message"
   - Frontend validates all fields and consent
   - reCAPTCHA token generated invisibly
   - Form data + token sent to backend
   - Backend validates reCAPTCHA and processes submission
   - Success message shown to user

## Compliance Features

- **Consent:** Explicit opt-in via checkbox
- **Transparency:** Clear privacy policy with data practices
- **Data Minimization:** Only collect necessary fields
- **Retention:** 5-year retention period clearly stated
- **Security:** IP hashing, CSRF protection, reCAPTCHA
- **Audit Trail:** All actions logged with timestamps
- **Rights:** Privacy policy explains user rights under GDPR

## Accessibility

All GDPR features follow WCAG 2.1 AA standards:
- Keyboard navigation support
- Focus indicators
- ARIA labels and roles
- Reduced motion support
- High contrast mode support
- Minimum touch target sizes (44px)
