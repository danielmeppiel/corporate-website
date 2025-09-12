/**
 * Utility functions for data validation and security
 * Following compliance standards from APM dependencies
 */

/**
 * Sanitize user input to prevent XSS attacks
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
 * Validate email format with comprehensive checks
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
 * Generate secure random tokens for CSRF protection
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
 * Hash sensitive data for privacy compliance
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
 * Rate limiting utility to prevent abuse
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  /**
   * Check if request is allowed under rate limit
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
   * Get remaining requests in current window
   */
  getRemaining(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Export rate limiter instance
export const contactFormRateLimiter = new RateLimiter(5, 300000); // 5 requests per 5 minutes

/**
 * Validate phone number format (international)
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
 * Clean and validate URL input
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
 * Data retention utility for GDPR compliance
 */
export class DataRetentionManager {
  private retentionPolicies: Map<string, number> = new Map([
    ['contact_forms', 5 * 365 * 24 * 60 * 60 * 1000], // 5 years
    ['audit_logs', 7 * 365 * 24 * 60 * 60 * 1000],    // 7 years
    ['user_sessions', 30 * 24 * 60 * 60 * 1000],       // 30 days
    ['analytics', 26 * 30 * 24 * 60 * 60 * 1000]       // 26 months (GA4 default)
  ]);
  
  /**
   * Check if data should be retained based on policy
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
   * Get expiry date for data type
   */
  getExpiryDate(dataType: string, createdAt: Date): Date | null {
    const retentionPeriod = this.retentionPolicies.get(dataType);
    if (!retentionPeriod) {
      return null;
    }
    
    return new Date(createdAt.getTime() + retentionPeriod);
  }
}

export const dataRetentionManager = new DataRetentionManager();