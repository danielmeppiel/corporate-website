/**
 * Utility functions for data validation and security
 * Following compliance standards from APM dependencies
 * 
 * This module provides comprehensive validation and security utilities including:
 * - **XSS Prevention**: Input sanitization to prevent cross-site scripting attacks
 * - **Input Validation**: Email, phone, and URL validation with security checks
 * - **CSRF Protection**: Secure token generation for cross-site request forgery prevention
 * - **Privacy Compliance**: Data hashing utilities for GDPR compliance
 * - **Rate Limiting**: Protection against abuse and denial-of-service attacks
 * - **Data Retention**: GDPR-compliant data lifecycle management
 * 
 * All functions implement defense-in-depth security principles and fail securely.
 * 
 * @module utils/validation
 * @see {@link https://www.npmjs.com/package/compliance-rules} for GDPR standards reference
 */

/**
 * Sanitize user input to prevent XSS (Cross-Site Scripting) attacks.
 * 
 * XSS protection measures:
 * - Removes angle brackets (< >) to prevent HTML tag injection
 * - Removes quotes (' ") to prevent attribute injection
 * - Trims whitespace to normalize input
 * - Limits length to 1000 characters to prevent DoS
 * 
 * This is a basic sanitization layer. For HTML rendering, use additional
 * context-aware escaping (e.g., DOMPurify for rich content).
 * 
 * Security note: This function provides defense-in-depth but should be
 * combined with Content Security Policy (CSP) headers for comprehensive XSS protection.
 * 
 * @param {string} input - User input string to sanitize
 * 
 * @returns {string} Sanitized string safe for display (empty string if input is not a string)
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const userInput = "<script>alert('xss')</script>";
 * const safe = sanitizeInput(userInput);
 * console.log(safe); // "scriptalert('xss')/script"
 * ```
 * 
 * @example
 * ```typescript
 * // Form input sanitization
 * const formData = {
 *   name: sanitizeInput(document.getElementById('name').value),
 *   comment: sanitizeInput(document.getElementById('comment').value)
 * };
 * ```
 * 
 * @see {@link https://owasp.org/www-community/attacks/xss/} OWASP XSS Prevention
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break attributes
    .trim()
    .substring(0, 1000); // Limit length to prevent DoS
}

/**
 * Validate email format with comprehensive security checks.
 * 
 * Implements multi-layer validation:
 * - **Format Validation**: Checks RFC-compliant email pattern
 * - **Length Validation**: Enforces RFC 5321 limit (254 characters)
 * - **Security Validation**: Detects dangerous patterns and protocol handlers
 * - **Type Safety**: Ensures input is a string
 * 
 * Dangerous patterns detected:
 * - JavaScript protocol handlers (javascript:)
 * - Script tags (<script)
 * - Data URIs (data:)
 * - VBScript handlers (vbscript:)
 * 
 * Note: This validates format only. For deliverability verification,
 * implement server-side email verification with confirmation emails.
 * 
 * @param {string} email - Email address to validate
 * 
 * @returns {boolean} true if email is valid and safe, false otherwise
 * 
 * @example
 * ```typescript
 * // Basic validation
 * console.log(validateEmail('user@example.com')); // true
 * console.log(validateEmail('invalid.email')); // false
 * console.log(validateEmail('user@')); // false
 * ```
 * 
 * @example
 * ```typescript
 * // Form validation with feedback
 * function validateEmailField(input: HTMLInputElement) {
 *   const email = input.value;
 *   if (!validateEmail(email)) {
 *     input.setCustomValidity('Please enter a valid email address');
 *     return false;
 *   }
 *   input.setCustomValidity('');
 *   return true;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Security check detection
 * console.log(validateEmail('javascript:alert(1)')); // false
 * console.log(validateEmail('<script>@example.com')); // false
 * ```
 * 
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5321} RFC 5321 - Email Format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Length checks
  if (email.length > 254) { // RFC 5321 limit
    return false;
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /javascript:/i,
    /<script/i,
    /data:/i,
    /vbscript:/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(email));
}

/**
 * Generate cryptographically secure random tokens for CSRF protection.
 * 
 * CSRF (Cross-Site Request Forgery) tokens prevent attackers from executing
 * unauthorized actions on behalf of authenticated users.
 * 
 * Token properties:
 * - Cryptographically random (uses Math.random - upgrade to crypto.getRandomValues in production)
 * - Configurable length (default 32 characters)
 * - Alphanumeric characters only (A-Z, a-z, 0-9)
 * - Unique per session/request
 * 
 * Security best practices:
 * - Generate new token for each session
 * - Validate token server-side before processing state-changing requests
 * - Use HTTPS to prevent token interception
 * - Include token in custom header (X-CSRF-Token) or hidden form field
 * 
 * **IMPORTANT SECURITY NOTE**: The current implementation uses Math.random() which is NOT
 * cryptographically secure. In production, replace Math.random() with crypto.getRandomValues()
 * or use Web Crypto API to ensure unpredictable token generation. Predictable tokens can
 * be exploited by attackers to bypass CSRF protection.
 * 
 * @param {number} [length=32] - Length of the generated token (default: 32 characters)
 * 
 * @returns {string} Secure random token string
 * 
 * @example
 * ```typescript
 * // Generate default length token
 * const csrfToken = generateSecureToken();
 * console.log(csrfToken); // e.g., "a7B3xK9mP2qW8dE5fR1nY4tL6jC0vG2s"
 * ```
 * 
 * @example
 * ```typescript
 * // Generate custom length token
 * const shortToken = generateSecureToken(16);
 * console.log(shortToken.length); // 16
 * ```
 * 
 * @example
 * ```typescript
 * // Use in form submission
 * async function submitFormWithCSRF(formData: any) {
 *   const csrfToken = generateSecureToken();
 *   sessionStorage.setItem('csrf_token', csrfToken);
 *   
 *   await fetch('/api/submit', {
 *     method: 'POST',
 *     headers: {
 *       'X-CSRF-Token': csrfToken
 *     },
 *     body: JSON.stringify(formData)
 *   });
 * }
 * ```
 * 
 * @see {@link https://owasp.org/www-community/attacks/csrf} OWASP CSRF Prevention
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Hash sensitive data for privacy compliance and secure storage.
 * 
 * Uses Web Crypto API with SHA-256 algorithm for:
 * - **Privacy Protection**: Irreversible transformation of PII (e.g., IP addresses, emails)
 * - **GDPR Compliance**: Data minimization and pseudonymization (Article 4, Article 25)
 * - **Security**: One-way hashing prevents data recovery even if database is compromised
 * - **Correlation**: Same input always produces same hash for pattern detection
 * 
 * Use cases:
 * - IP address hashing for audit logs
 * - Email hashing for analytics (without storing actual email)
 * - User identifier pseudonymization
 * - Data breach impact minimization
 * 
 * Security properties:
 * - SHA-256 algorithm (256-bit hash)
 * - Cryptographically secure (Web Crypto API)
 * - Deterministic (same input = same output)
 * - Irreversible (cannot recover original data)
 * 
 * Note: For password hashing, use bcrypt, scrypt, or Argon2 with salt.
 * SHA-256 alone is not suitable for password storage.
 * 
 * @async
 * @param {string} data - Sensitive data to hash (e.g., IP address, email)
 * 
 * @returns {Promise<string>} Hexadecimal string representation of SHA-256 hash
 * 
 * @example
 * ```typescript
 * // Hash IP address for audit logging
 * // Note: logAuditEvent is imported from '../api/contact'
 * import { logAuditEvent } from '../api/contact';
 * 
 * const ipAddress = '192.168.1.1';
 * const hashedIP = await hashSensitiveData(ipAddress);
 * console.log(hashedIP); // "c71e7b3a24f8e256..."
 * 
 * await logAuditEvent('user_login', {
 *   hashedIP: hashedIP,
 *   timestamp: new Date().toISOString()
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Hash email for analytics without storing PII
 * // Note: trackEvent is a placeholder for your analytics function
 * const userEmail = 'user@example.com';
 * const hashedEmail = await hashSensitiveData(userEmail);
 * 
 * // Use with your analytics service
 * analyticsService.trackEvent('newsletter_signup', {
 *   user_hash: hashedEmail, // Can correlate events without storing email
 *   timestamp: Date.now()
 * });
 * ```
 * 
 * @see {@link https://gdpr-info.eu/art-25-gdpr/} GDPR Article 25 - Data Protection by Design
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest} Web Crypto API
 */
export async function hashSensitiveData(data: string): Promise<string> {
  // Use Web Crypto API for secure hashing
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Rate limiter for preventing abuse and denial-of-service attacks.
 * 
 * Implements sliding window rate limiting to:
 * - **Prevent Abuse**: Limit request frequency from same source
 * - **DoS Protection**: Prevent resource exhaustion attacks
 * - **Fair Usage**: Ensure service availability for all users
 * - **Security**: Slow down brute force and enumeration attacks
 * 
 * Features:
 * - Sliding window algorithm (more accurate than fixed window)
 * - Configurable limits per identifier (IP, user ID, session)
 * - Automatic cleanup of old requests
 * - Memory-efficient (removes expired entries)
 * 
 * Configuration:
 * - Default: 10 requests per 60 seconds (60000ms)
 * - Customizable per instance
 * - Per-identifier tracking (supports multiple users simultaneously)
 * 
 * @class RateLimiter
 * 
 * @example
 * ```typescript
 * // Create rate limiter for API endpoints
 * const apiLimiter = new RateLimiter(100, 60000); // 100 requests per minute
 * 
 * // Check if request is allowed
 * const clientIP = '192.168.1.1';
 * if (apiLimiter.isAllowed(clientIP)) {
 *   processRequest();
 * } else {
 *   respondWithError(429, 'Too Many Requests');
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Use with login attempts
 * const loginLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
 * 
 * async function handleLogin(username: string, password: string) {
 *   if (!loginLimiter.isAllowed(username)) {
 *     throw new Error('Too many login attempts. Please try again later.');
 *   }
 *   
 *   // Process login...
 * }
 * ```
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  /**
   * Create a new rate limiter instance.
   * 
   * @param {number} [maxRequests=10] - Maximum number of requests allowed in the time window
   * @param {number} [windowMs=60000] - Time window in milliseconds (default: 60 seconds)
   */
  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  /**
   * Check if a request from the given identifier is allowed under the rate limit.
   * 
   * Uses sliding window algorithm:
   * 1. Removes requests outside the current window
   * 2. Checks if remaining requests exceed limit
   * 3. Records current request timestamp
   * 
   * This method automatically cleans up old request records to prevent
   * memory leaks while maintaining accurate rate limiting.
   * 
   * @param {string} identifier - Unique identifier for the client (e.g., IP address, user ID, session ID)
   * 
   * @returns {boolean} true if request is allowed, false if rate limit exceeded
   * 
   * @example
   * ```typescript
   * const limiter = new RateLimiter(5, 60000);
   * const userId = 'user123';
   * 
   * if (limiter.isAllowed(userId)) {
   *   console.log('Request allowed');
   *   // Process request
   * } else {
   *   console.log('Rate limit exceeded');
   *   // Return 429 Too Many Requests
   * }
   * ```
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];
    
    // Remove requests outside the current window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    if (requests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);
    
    return true;
  }
  
  /**
   * Get remaining requests allowed in the current window for an identifier.
   * 
   * Useful for:
   * - Providing feedback to users about remaining attempts
   * - Implementing progressive rate limiting
   * - API response headers (X-RateLimit-Remaining)
   * 
   * @param {string} identifier - Unique identifier for the client
   * 
   * @returns {number} Number of requests remaining in current window (0 if limit exceeded)
   * 
   * @example
   * ```typescript
   * const limiter = new RateLimiter(10, 60000);
   * const clientIP = '192.168.1.1';
   * 
   * const remaining = limiter.getRemaining(clientIP);
   * console.log(`${remaining} requests remaining`);
   * 
   * // Include in API response headers
   * response.setHeader('X-RateLimit-Remaining', remaining.toString());
   * ```
   */
  getRemaining(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

/**
 * Pre-configured rate limiter for contact form submissions.
 * 
 * Limits contact form submissions to prevent spam and abuse:
 * - Maximum 5 submissions per 5 minutes (300000ms)
 * - Per IP address or session tracking
 * - Helps prevent automated form spam
 * - Reduces server load from abuse
 * 
 * Usage: Check before processing contact form to prevent spam.
 * 
 * @constant
 * @type {RateLimiter}
 * 
 * @example
 * ```typescript
 * import { contactFormRateLimiter } from './validation';
 * 
 * async function handleContactFormSubmit(formData: any, clientIP: string) {
 *   if (!contactFormRateLimiter.isAllowed(clientIP)) {
 *     throw new Error('Too many submissions. Please try again later.');
 *   }
 *   
 *   await submitContactForm(formData);
 * }
 * ```
 */
export const contactFormRateLimiter = new RateLimiter(5, 300000); // 5 requests per 5 minutes

/**
 * Validate international phone number format.
 * 
 * Validates phone numbers in international format (E.164 standard):
 * - Must start with + (plus sign)
 * - Followed by 7-15 digits (country code + number)
 * - Non-digit characters (spaces, hyphens, parentheses) are automatically removed
 * 
 * Format: +[country code][number]
 * Examples:
 * - +1234567890 (valid)
 * - +44 20 7123 4567 (valid, spaces removed)
 * - +1-555-123-4567 (valid, hyphens removed)
 * - 555-1234 (invalid, missing country code)
 * 
 * This validation focuses on format only. For full validation:
 * - Use a service like libphonenumber for regional validation
 * - Implement SMS verification for deliverability
 * 
 * @param {string} phone - Phone number to validate
 * 
 * @returns {boolean} true if phone number format is valid, false otherwise
 * 
 * @example
 * ```typescript
 * // Valid formats
 * console.log(validatePhoneNumber('+12025551234')); // true
 * console.log(validatePhoneNumber('+44 20 7123 4567')); // true
 * console.log(validatePhoneNumber('+1-555-123-4567')); // true
 * ```
 * 
 * @example
 * ```typescript
 * // Invalid formats
 * console.log(validatePhoneNumber('555-1234')); // false (no country code)
 * console.log(validatePhoneNumber('+1')); // false (too short)
 * console.log(validatePhoneNumber('12025551234')); // false (missing +)
 * ```
 * 
 * @example
 * ```typescript
 * // Form validation
 * function validatePhoneInput(input: string): string | null {
 *   if (!validatePhoneNumber(input)) {
 *     return 'Please enter a valid international phone number (e.g., +1 555 123 4567)';
 *   }
 *   return null; // Valid
 * }
 * ```
 * 
 * @see {@link https://en.wikipedia.org/wiki/E.164} E.164 International Phone Number Format
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check basic format: + followed by 7-15 digits
  const phoneRegex = /^\+\d{7,15}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validate and sanitize URL input to prevent security vulnerabilities.
 * 
 * Security validations:
 * - **Protocol Restriction**: Only allows http: and https: protocols
 * - **Malicious Pattern Detection**: Blocks javascript:, data:, vbscript:, file: URLs
 * - **Format Validation**: Ensures valid URL structure using URL API
 * - **Type Safety**: Verifies input is a string
 * 
 * Blocked protocols prevent:
 * - XSS attacks via javascript: URIs
 * - Data exfiltration via data: URIs
 * - Local file access via file: URIs
 * - Script execution via vbscript: URIs
 * 
 * Use cases:
 * - Validating user-submitted links
 * - Sanitizing redirect URLs
 * - Checking external resource URLs
 * - Preventing open redirect vulnerabilities
 * 
 * Note: This validates format and security. For additional safety:
 * - Implement allowlist of trusted domains for sensitive operations
 * - Use rel="noopener noreferrer" for external links
 * - Validate server-side before following redirects
 * 
 * @param {string} url - URL string to validate
 * 
 * @returns {boolean} true if URL is valid and safe, false otherwise
 * 
 * @example
 * ```typescript
 * // Valid URLs
 * console.log(validateURL('https://example.com')); // true
 * console.log(validateURL('http://example.com/path')); // true
 * console.log(validateURL('https://example.com/search?q=test')); // true
 * ```
 * 
 * @example
 * ```typescript
 * // Invalid/dangerous URLs
 * console.log(validateURL('javascript:alert(1)')); // false
 * console.log(validateURL('data:text/html,<script>alert(1)</script>')); // false
 * console.log(validateURL('file:///etc/passwd')); // false
 * console.log(validateURL('not-a-url')); // false
 * ```
 * 
 * @example
 * ```typescript
 * // Safe redirect implementation
 * function safeRedirect(url: string) {
 *   if (!validateURL(url)) {
 *     console.error('Invalid or unsafe URL');
 *     return;
 *   }
 *   
 *   // Additional check: ensure URL is from trusted domain
 *   const urlObj = new URL(url);
 *   const trustedDomains = ['example.com', 'trusted.org'];
 *   
 *   if (trustedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
 *     window.location.href = url;
 *   } else {
 *     console.warn('URL not in trusted domains');
 *   }
 * }
 * ```
 * 
 * @see {@link https://owasp.org/www-community/attacks/Open_redirect} OWASP Open Redirect
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(url));
  } catch {
    return false;
  }
}

/**
 * Data retention manager for GDPR compliance and data lifecycle management.
 * 
 * Implements GDPR Article 5(1)(e) - Storage Limitation Principle:
 * "Personal data shall be kept in a form which permits identification of data subjects
 * for no longer than is necessary for the purposes for which the personal data are processed."
 * 
 * Features:
 * - **Automated Retention**: Defines retention periods for different data types
 * - **Legal Compliance**: Balances user privacy with legal retention requirements
 * - **Audit Support**: Determines when data should be deleted
 * - **Transparency**: Clear policies for data lifecycle management
 * 
 * Default retention policies:
 * - Contact forms: 5 years (business records requirement)
 * - Audit logs: 7 years (compliance and security requirements)
 * - User sessions: 30 days (short-term operational data)
 * - Analytics: 26 months (Google Analytics 4 default)
 * 
 * Legal considerations:
 * - Retention periods vary by jurisdiction
 * - Some data must be kept for legal/tax purposes
 * - User can request deletion (Right to Erasure) with exceptions
 * - Audit logs of deletion requests must be retained
 * 
 * @class DataRetentionManager
 * 
 * @example
 * ```typescript
 * // Check if contact form should be retained
 * const manager = new DataRetentionManager();
 * const formDate = new Date('2020-01-01');
 * 
 * if (manager.shouldRetain('contact_forms', formDate)) {
 *   console.log('Keep the form data');
 * } else {
 *   console.log('Data can be deleted - retention period expired');
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Automated cleanup job
 * async function cleanupExpiredData() {
 *   const manager = new DataRetentionManager();
 *   const dataTypes = ['contact_forms', 'user_sessions', 'analytics'];
 *   
 *   for (const dataType of dataTypes) {
 *     const records = await fetchRecords(dataType);
 *     
 *     for (const record of records) {
 *       if (!manager.shouldRetain(dataType, record.createdAt)) {
 *         await deleteRecord(record.id);
 *         await logAuditEvent('data_deletion_automated', {
 *           dataType,
 *           recordId: record.id,
 *           reason: 'retention_period_expired'
 *         });
 *       }
 *     }
 *   }
 * }
 * ```
 * 
 * @see {@link https://gdpr-info.eu/art-5-gdpr/} GDPR Article 5 - Principles
 */
export class DataRetentionManager {
  private retentionPolicies: Map<string, number> = new Map([
    ['contact_forms', 5 * 365 * 24 * 60 * 60 * 1000], // 5 years
    ['audit_logs', 7 * 365 * 24 * 60 * 60 * 1000],    // 7 years
    ['user_sessions', 30 * 24 * 60 * 60 * 1000],       // 30 days
    ['analytics', 26 * 30 * 24 * 60 * 60 * 1000]       // 26 months (GA4 default)
  ]);
  
  /**
   * Check if data should be retained based on retention policy and creation date.
   * 
   * Compares the data's age against the defined retention period for its type.
   * Returns false if:
   * - No retention policy is defined for the data type (fail-safe)
   * - Retention period has expired
   * 
   * @param {string} dataType - Type of data (e.g., 'contact_forms', 'audit_logs', 'user_sessions')
   * @param {Date} createdAt - When the data was created
   * 
   * @returns {boolean} true if data should be retained, false if it can be deleted
   * 
   * @example
   * ```typescript
   * const manager = new DataRetentionManager();
   * const oldForm = new Date('2015-01-01');
   * const recentForm = new Date('2024-01-01');
   * 
   * console.log(manager.shouldRetain('contact_forms', oldForm)); // false (> 5 years)
   * console.log(manager.shouldRetain('contact_forms', recentForm)); // true (< 5 years)
   * ```
   */
  shouldRetain(dataType: string, createdAt: Date): boolean {
    const retentionPeriod = this.retentionPolicies.get(dataType);
    if (!retentionPeriod) {
      // If no policy defined, default to not retaining
      return false;
    }
    
    const expiryDate = new Date(createdAt.getTime() + retentionPeriod);
    return new Date() < expiryDate;
  }
  
  /**
   * Get expiry date for a specific data type and creation date.
   * 
   * Calculates when data should be deleted based on retention policy.
   * Useful for:
   * - Displaying retention information to users
   * - Scheduling automated cleanup jobs
   * - Compliance reporting
   * - Data protection impact assessments
   * 
   * @param {string} dataType - Type of data (e.g., 'contact_forms', 'audit_logs')
   * @param {Date} createdAt - When the data was created
   * 
   * @returns {Date | null} Expiry date when data should be deleted, or null if no policy defined
   * 
   * @example
   * ```typescript
   * const manager = new DataRetentionManager();
   * const formDate = new Date('2024-01-01');
   * const expiryDate = manager.getExpiryDate('contact_forms', formDate);
   * 
   * if (expiryDate) {
   *   console.log(`Data will be deleted on: ${expiryDate.toISOString()}`);
   *   // Output: "Data will be deleted on: 2029-01-01T00:00:00.000Z"
   * }
   * ```
   * 
   * @example
   * ```typescript
   * // Display retention info to user
   * function showRetentionInfo(dataType: string, createdAt: Date) {
   *   const manager = new DataRetentionManager();
   *   const expiry = manager.getExpiryDate(dataType, createdAt);
   *   
   *   if (expiry) {
   *     const daysRemaining = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
   *     return `Your data will be retained for ${daysRemaining} more days.`;
   *   }
   *   return 'No retention policy defined for this data type.';
   * }
   * ```
   */
  getExpiryDate(dataType: string, createdAt: Date): Date | null {
    const retentionPeriod = this.retentionPolicies.get(dataType);
    if (!retentionPeriod) {
      return null;
    }
    
    return new Date(createdAt.getTime() + retentionPeriod);
  }
}

/**
 * Pre-configured data retention manager instance with default policies.
 * 
 * Use this singleton instance for consistent data retention management across the application.
 * 
 * @constant
 * @type {DataRetentionManager}
 * 
 * @example
 * ```typescript
 * import { dataRetentionManager } from './validation';
 * 
 * // Check if old session should be deleted
 * const sessionDate = new Date('2024-09-01');
 * if (!dataRetentionManager.shouldRetain('user_sessions', sessionDate)) {
 *   await deleteSession(sessionId);
 * }
 * ```
 */
export const dataRetentionManager = new DataRetentionManager();