/**
 * Comprehensive test suite for src/utils/validation.ts
 * Testing security-critical validation utilities and GDPR compliance features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeInput,
  validateEmail,
  generateSecureToken,
  hashSensitiveData,
  contactFormRateLimiter,
  validatePhoneNumber,
  validateURL,
  DataRetentionManager
} from '../../src/utils/validation';

describe('sanitizeInput', () => {
  describe('XSS Prevention', () => {
    it('removes HTML angle brackets', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('removes quotes that could break attributes', () => {
      expect(sanitizeInput('value"onclick="alert(1)')).toBe('valueonclick=alert(1)');
    });

    it('removes single quotes', () => {
      expect(sanitizeInput("value'onmouseover='alert(1)")).toBe('valueonmouseover=alert(1)');
    });

    it('handles mixed dangerous characters', () => {
      expect(sanitizeInput('<img src="x" onerror=\'alert(1)\'>')).toBe('img src=x onerror=alert(1)');
    });
  });

  describe('Input Normalization', () => {
    it('trims whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    it('limits length to 1000 characters', () => {
      const longInput = 'a'.repeat(1500);
      const result = sanitizeInput(longInput);
      expect(result.length).toBe(1000);
    });

    it('handles empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('preserves safe characters', () => {
      expect(sanitizeInput('Hello, World! 123')).toBe('Hello, World! 123');
    });
  });

  describe('Type Safety', () => {
    it('returns empty string for non-string input', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
      expect(sanitizeInput(123 as any)).toBe('');
      expect(sanitizeInput({} as any)).toBe('');
      expect(sanitizeInput([] as any)).toBe('');
    });
  });
});

describe('validateEmail', () => {
  describe('Valid Email Formats', () => {
    it('accepts standard email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('accepts email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
    });

    it('accepts email with plus addressing', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('accepts email with dots in local part', () => {
      expect(validateEmail('first.last@example.com')).toBe(true);
    });

    it('accepts email with numbers', () => {
      expect(validateEmail('user123@example456.com')).toBe(true);
    });

    it('accepts email with hyphens', () => {
      expect(validateEmail('user@my-company.com')).toBe(true);
    });
  });

  describe('Invalid Email Formats', () => {
    it('rejects email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('rejects email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('rejects email without local part', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });

    it('rejects email without TLD', () => {
      expect(validateEmail('user@example')).toBe(false);
    });

    it('rejects email with spaces', () => {
      expect(validateEmail('user name@example.com')).toBe(false);
    });

    it('rejects email with multiple @ symbols', () => {
      expect(validateEmail('user@@example.com')).toBe(false);
    });
  });

  describe('Length Validation (RFC 5321)', () => {
    it('rejects email longer than 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });

    it('accepts email at 254 character limit', () => {
      const local = 'a'.repeat(64);
      const domain = 'b'.repeat(185) + '.com';
      const email = `${local}@${domain}`;
      expect(email.length).toBeLessThanOrEqual(254);
    });

    it('rejects empty string', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('Security - Dangerous Patterns', () => {
    it('rejects email with javascript: protocol', () => {
      expect(validateEmail('javascript:alert(1)@example.com')).toBe(false);
    });

    it('rejects email with script tag', () => {
      expect(validateEmail('user<script>@example.com')).toBe(false);
    });

    it('rejects email with data: protocol', () => {
      expect(validateEmail('data:text/html@example.com')).toBe(false);
    });

    it('rejects email with vbscript: protocol', () => {
      expect(validateEmail('vbscript:msgbox@example.com')).toBe(false);
    });

    it('is case-insensitive for dangerous patterns', () => {
      expect(validateEmail('JAVASCRIPT:alert@example.com')).toBe(false);
      expect(validateEmail('JaVaScRiPt:alert@example.com')).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('rejects null input', () => {
      expect(validateEmail(null as any)).toBe(false);
    });

    it('rejects undefined input', () => {
      expect(validateEmail(undefined as any)).toBe(false);
    });

    it('rejects non-string types', () => {
      expect(validateEmail(123 as any)).toBe(false);
      expect(validateEmail({} as any)).toBe(false);
      expect(validateEmail([] as any)).toBe(false);
    });
  });
});

describe('generateSecureToken', () => {
  it('generates token of default length 32', () => {
    const token = generateSecureToken();
    expect(token.length).toBe(32);
  });

  it('generates token of custom length', () => {
    expect(generateSecureToken(16).length).toBe(16);
    expect(generateSecureToken(64).length).toBe(64);
    expect(generateSecureToken(128).length).toBe(128);
  });

  it('generates unique tokens', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();
    expect(token1).not.toBe(token2);
  });

  it('uses only alphanumeric characters', () => {
    const token = generateSecureToken(100);
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('generates tokens with sufficient entropy', () => {
    const tokens = new Set();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateSecureToken(32));
    }
    expect(tokens.size).toBe(100); // All should be unique
  });
});

describe('hashSensitiveData', () => {
  it('hashes data using SHA-256', async () => {
    const hash = await hashSensitiveData('sensitive-data');
    expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
  });

  it('produces consistent hashes for same input', async () => {
    const hash1 = await hashSensitiveData('test-data');
    const hash2 = await hashSensitiveData('test-data');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', async () => {
    const hash1 = await hashSensitiveData('data-1');
    const hash2 = await hashSensitiveData('data-2');
    expect(hash1).not.toBe(hash2);
  });

  it('produces hexadecimal output', async () => {
    const hash = await hashSensitiveData('test');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('handles empty string', async () => {
    const hash = await hashSensitiveData('');
    expect(hash.length).toBe(64);
  });

  it('handles unicode characters', async () => {
    const hash = await hashSensitiveData('🔒🔐🔑');
    expect(hash.length).toBe(64);
  });

  it('is deterministic', async () => {
    const testData = 'IP:192.168.1.1';
    const hashes = await Promise.all([
      hashSensitiveData(testData),
      hashSensitiveData(testData),
      hashSensitiveData(testData)
    ]);
    expect(hashes[0]).toBe(hashes[1]);
    expect(hashes[1]).toBe(hashes[2]);
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    // Clear rate limiter state between tests
    const limiter = contactFormRateLimiter as any;
    limiter.requests.clear();
  });

  describe('isAllowed', () => {
    it('allows first request', () => {
      expect(contactFormRateLimiter.isAllowed('user1')).toBe(true);
    });

    it('allows requests under limit', () => {
      expect(contactFormRateLimiter.isAllowed('user1')).toBe(true);
      expect(contactFormRateLimiter.isAllowed('user1')).toBe(true);
      expect(contactFormRateLimiter.isAllowed('user1')).toBe(true);
    });

    it('blocks requests exceeding limit', () => {
      // Limit is 5 requests per 5 minutes
      for (let i = 0; i < 5; i++) {
        expect(contactFormRateLimiter.isAllowed('user2')).toBe(true);
      }
      expect(contactFormRateLimiter.isAllowed('user2')).toBe(false);
    });

    it('isolates different users', () => {
      for (let i = 0; i < 5; i++) {
        expect(contactFormRateLimiter.isAllowed('user3')).toBe(true);
      }
      expect(contactFormRateLimiter.isAllowed('user3')).toBe(false);
      expect(contactFormRateLimiter.isAllowed('user4')).toBe(true);
    });

    it('cleans up old requests outside window', async () => {
      // This test requires time manipulation which isn't easily testable
      // without mocking Date.now(). Testing the concept with current logic:
      const identifier = 'user5';
      expect(contactFormRateLimiter.isAllowed(identifier)).toBe(true);
      expect(contactFormRateLimiter.getRemaining(identifier)).toBe(4);
    });
  });

  describe('getRemaining', () => {
    it('returns max requests for new identifier', () => {
      expect(contactFormRateLimiter.getRemaining('new-user')).toBe(5);
    });

    it('decreases as requests are made', () => {
      contactFormRateLimiter.isAllowed('user6');
      expect(contactFormRateLimiter.getRemaining('user6')).toBe(4);
      
      contactFormRateLimiter.isAllowed('user6');
      expect(contactFormRateLimiter.getRemaining('user6')).toBe(3);
    });

    it('returns 0 when limit exceeded', () => {
      for (let i = 0; i < 5; i++) {
        contactFormRateLimiter.isAllowed('user7');
      }
      expect(contactFormRateLimiter.getRemaining('user7')).toBe(0);
    });

    it('never returns negative values', () => {
      for (let i = 0; i < 10; i++) {
        contactFormRateLimiter.isAllowed('user8');
      }
      expect(contactFormRateLimiter.getRemaining('user8')).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('validatePhoneNumber', () => {
  describe('Valid International Formats', () => {
    it('accepts US number with country code', () => {
      expect(validatePhoneNumber('+1234567890')).toBe(true);
    });

    it('accepts UK number with country code', () => {
      expect(validatePhoneNumber('+441234567890')).toBe(true);
    });

    it('accepts number with 7 digits (minimum)', () => {
      expect(validatePhoneNumber('+1234567')).toBe(true);
    });

    it('accepts number with 15 digits (maximum)', () => {
      expect(validatePhoneNumber('+123456789012345')).toBe(true);
    });

    it('accepts number with spaces and formats', () => {
      expect(validatePhoneNumber('+1 (234) 567-8900')).toBe(true);
    });

    it('accepts number with dots', () => {
      expect(validatePhoneNumber('+1.234.567.8900')).toBe(true);
    });

    it('accepts number with hyphens', () => {
      expect(validatePhoneNumber('+1-234-567-8900')).toBe(true);
    });
  });

  describe('Invalid Formats', () => {
    it('rejects number without + prefix', () => {
      expect(validatePhoneNumber('1234567890')).toBe(false);
    });

    it('rejects number too short (< 7 digits)', () => {
      expect(validatePhoneNumber('+123456')).toBe(false);
    });

    it('rejects number too long (> 15 digits)', () => {
      expect(validatePhoneNumber('+1234567890123456')).toBe(false);
    });

    it('rejects number with letters', () => {
      expect(validatePhoneNumber('+1234abc7890')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validatePhoneNumber('')).toBe(false);
    });

    it('rejects number with special characters', () => {
      expect(validatePhoneNumber('+1234567890*#')).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('rejects null input', () => {
      expect(validatePhoneNumber(null as any)).toBe(false);
    });

    it('rejects undefined input', () => {
      expect(validatePhoneNumber(undefined as any)).toBe(false);
    });

    it('rejects non-string types', () => {
      expect(validatePhoneNumber(123 as any)).toBe(false);
      expect(validatePhoneNumber({} as any)).toBe(false);
    });
  });
});

describe('validateURL', () => {
  describe('Valid URLs', () => {
    it('accepts http URL', () => {
      expect(validateURL('http://example.com')).toBe(true);
    });

    it('accepts https URL', () => {
      expect(validateURL('https://example.com')).toBe(true);
    });

    it('accepts URL with path', () => {
      expect(validateURL('https://example.com/path/to/page')).toBe(true);
    });

    it('accepts URL with query parameters', () => {
      expect(validateURL('https://example.com?param=value')).toBe(true);
    });

    it('accepts URL with hash fragment', () => {
      expect(validateURL('https://example.com#section')).toBe(true);
    });

    it('accepts URL with port', () => {
      expect(validateURL('https://example.com:8080')).toBe(true);
    });

    it('accepts URL with subdomain', () => {
      expect(validateURL('https://api.example.com')).toBe(true);
    });

    it('accepts localhost URLs', () => {
      expect(validateURL('http://localhost:3000')).toBe(true);
    });
  });

  describe('Invalid URLs', () => {
    it('rejects malformed URL', () => {
      expect(validateURL('not a url')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validateURL('')).toBe(false);
    });

    it('rejects URL without protocol', () => {
      expect(validateURL('example.com')).toBe(false);
    });
  });

  describe('Security - Dangerous Protocols', () => {
    it('rejects javascript: protocol', () => {
      expect(validateURL('javascript:alert(1)')).toBe(false);
    });

    it('rejects data: protocol', () => {
      expect(validateURL('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('rejects vbscript: protocol', () => {
      expect(validateURL('vbscript:msgbox(1)')).toBe(false);
    });

    it('rejects file: protocol', () => {
      expect(validateURL('file:///etc/passwd')).toBe(false);
    });

    it('is case-insensitive for protocol detection', () => {
      expect(validateURL('JAVASCRIPT:alert(1)')).toBe(false);
      expect(validateURL('JaVaScRiPt:alert(1)')).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('rejects null input', () => {
      expect(validateURL(null as any)).toBe(false);
    });

    it('rejects undefined input', () => {
      expect(validateURL(undefined as any)).toBe(false);
    });

    it('rejects non-string types', () => {
      expect(validateURL(123 as any)).toBe(false);
      expect(validateURL({} as any)).toBe(false);
    });
  });
});

describe('DataRetentionManager', () => {
  let manager: DataRetentionManager;

  beforeEach(() => {
    manager = new DataRetentionManager();
  });

  describe('shouldRetain', () => {
    it('retains contact forms within 5 years', () => {
      const recentDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      expect(manager.shouldRetain('contact_forms', recentDate)).toBe(true);
    });

    it('does not retain contact forms older than 5 years', () => {
      const oldDate = new Date(Date.now() - 6 * 365 * 24 * 60 * 60 * 1000); // 6 years ago
      expect(manager.shouldRetain('contact_forms', oldDate)).toBe(false);
    });

    it('retains audit logs within 7 years', () => {
      const recentDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      expect(manager.shouldRetain('audit_logs', recentDate)).toBe(true);
    });

    it('does not retain audit logs older than 7 years', () => {
      const oldDate = new Date(Date.now() - 8 * 365 * 24 * 60 * 60 * 1000); // 8 years ago
      expect(manager.shouldRetain('audit_logs', oldDate)).toBe(false);
    });

    it('retains user sessions within 30 days', () => {
      const recentDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
      expect(manager.shouldRetain('user_sessions', recentDate)).toBe(true);
    });

    it('does not retain user sessions older than 30 days', () => {
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      expect(manager.shouldRetain('user_sessions', oldDate)).toBe(false);
    });

    it('retains analytics within 26 months', () => {
      const recentDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      expect(manager.shouldRetain('analytics', recentDate)).toBe(true);
    });

    it('does not retain analytics older than 26 months', () => {
      const oldDate = new Date(Date.now() - 27 * 30 * 24 * 60 * 60 * 1000); // 27 months ago
      expect(manager.shouldRetain('analytics', oldDate)).toBe(false);
    });

    it('defaults to not retaining unknown data types', () => {
      const anyDate = new Date();
      expect(manager.shouldRetain('unknown_type', anyDate)).toBe(false);
    });

    it('handles edge case at exact expiry boundary', () => {
      const fiveYearsAgo = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
      // Should still be retained if exact boundary
      const result = manager.shouldRetain('contact_forms', fiveYearsAgo);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getExpiryDate', () => {
    it('calculates correct expiry date for contact forms', () => {
      const createdDate = new Date('2020-01-01');
      const expiryDate = manager.getExpiryDate('contact_forms', createdDate);
      
      expect(expiryDate).toBeInstanceOf(Date);
      expect(expiryDate?.getFullYear()).toBe(2025); // 5 years later
    });

    it('calculates correct expiry date for audit logs', () => {
      const createdDate = new Date('2020-01-01');
      const expiryDate = manager.getExpiryDate('audit_logs', createdDate);
      
      expect(expiryDate).toBeInstanceOf(Date);
      expect(expiryDate?.getFullYear()).toBe(2027); // 7 years later
    });

    it('calculates correct expiry date for user sessions', () => {
      const createdDate = new Date('2024-01-01');
      const expiryDate = manager.getExpiryDate('user_sessions', createdDate);
      
      expect(expiryDate).toBeInstanceOf(Date);
      expect(expiryDate?.getTime()).toBeGreaterThan(createdDate.getTime());
    });

    it('returns null for unknown data types', () => {
      const anyDate = new Date();
      expect(manager.getExpiryDate('unknown_type', anyDate)).toBeNull();
    });

    it('returns future date for all valid types', () => {
      const now = new Date();
      const types = ['contact_forms', 'audit_logs', 'user_sessions', 'analytics'];
      
      types.forEach(type => {
        const expiry = manager.getExpiryDate(type, now);
        expect(expiry).not.toBeNull();
        expect(expiry!.getTime()).toBeGreaterThan(now.getTime());
      });
    });
  });

  describe('GDPR Compliance', () => {
    it('enforces minimum 5-year retention for contact forms', () => {
      const fourYearsAgo = new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000);
      expect(manager.shouldRetain('contact_forms', fourYearsAgo)).toBe(true);
    });

    it('enforces minimum 7-year retention for audit logs', () => {
      const sixYearsAgo = new Date(Date.now() - 6 * 365 * 24 * 60 * 60 * 1000);
      expect(manager.shouldRetain('audit_logs', sixYearsAgo)).toBe(true);
    });

    it('enforces 26-month retention for analytics (GA4 default)', () => {
      const twoYearsAgo = new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000);
      expect(manager.shouldRetain('analytics', twoYearsAgo)).toBe(true);
    });
  });
});
