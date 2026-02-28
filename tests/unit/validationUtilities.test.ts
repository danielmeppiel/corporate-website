/**
 * Comprehensive test suite for validation utility functions
 * Tests security-critical validation, sanitization, and GDPR compliance utilities
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  sanitizeInput,
  generateSecureToken,
  hashSensitiveData,
  contactFormRateLimiter,
  validatePhoneNumber,
  validateURL,
  DataRetentionManager,
  dataRetentionManager
} from '../../src/utils/validation';

describe('sanitizeInput - XSS Prevention', () => {
  describe('HTML and script injection prevention', () => {
    it('removes angle brackets to prevent HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('removes both opening and closing angle brackets', () => {
      expect(sanitizeInput('Hello<div>World</div>')).toBe('HellodivWorld/div');
    });

    it('removes quotes that could break HTML attributes', () => {
      expect(sanitizeInput('test"value')).toBe('testvalue');
      expect(sanitizeInput("test'value")).toBe('testvalue');
    });

    it('removes both single and double quotes', () => {
      expect(sanitizeInput('test"double\'single')).toBe('testdoublesingle');
    });

    it('handles img tag with onerror XSS', () => {
      expect(sanitizeInput('<img src=x onerror="alert(1)">')).toBe('img src=x onerror=alert(1)');
    });

    it('handles multiple XSS vectors in single input', () => {
      const malicious = '<script>"onload="alert(1)">';
      expect(sanitizeInput(malicious)).not.toContain('<');
      expect(sanitizeInput(malicious)).not.toContain('>');
      expect(sanitizeInput(malicious)).not.toContain('"');
    });
  });

  describe('Input normalization', () => {
    it('trims leading and trailing whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    it('preserves internal whitespace', () => {
      expect(sanitizeInput('hello   world')).toBe('hello   world');
    });

    it('limits input length to 1000 characters', () => {
      const longInput = 'a'.repeat(1500);
      const result = sanitizeInput(longInput);
      expect(result.length).toBe(1000);
    });

    it('combines trimming and length limiting', () => {
      const longInput = '  ' + 'a'.repeat(1500) + '  ';
      const result = sanitizeInput(longInput);
      expect(result.length).toBe(1000);
      expect(result.startsWith('a')).toBe(true);
    });
  });

  describe('Type safety and edge cases', () => {
    it('returns empty string for non-string input', () => {
      expect(sanitizeInput(123 as any)).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
      expect(sanitizeInput({} as any)).toBe('');
      expect(sanitizeInput([] as any)).toBe('');
    });

    it('handles empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('handles whitespace-only string', () => {
      expect(sanitizeInput('   ')).toBe('');
    });

    it('handles unicode characters safely', () => {
      expect(sanitizeInput('Hello 世界')).toBe('Hello 世界');
      expect(sanitizeInput('Café ☕')).toBe('Café ☕');
    });

    it('preserves emoji characters', () => {
      expect(sanitizeInput('Hello 👋 World 🌍')).toBe('Hello 👋 World 🌍');
    });
  });

  describe('Real-world attack scenarios', () => {
    it('handles SVG script injection', () => {
      const svg = '<svg/onload=alert(document.cookie)>';
      const result = sanitizeInput(svg);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('handles event handler injection', () => {
      const payload = 'x" onmouseover="alert(1)"';
      const result = sanitizeInput(payload);
      expect(result).not.toContain('"');
    });

    it('handles data URL injection', () => {
      const dataUrl = '<iframe src="data:text/html,<script>alert(1)</script>">';
      const result = sanitizeInput(dataUrl);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });
});

describe('generateSecureToken - CSRF Protection', () => {
  describe('Token generation', () => {
    it('generates token of default length (32)', () => {
      const token = generateSecureToken();
      expect(token).toHaveLength(32);
    });

    it('generates token of custom length', () => {
      expect(generateSecureToken(16)).toHaveLength(16);
      expect(generateSecureToken(64)).toHaveLength(64);
      expect(generateSecureToken(128)).toHaveLength(128);
    });

    it('generates different tokens on each call', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      expect(tokens.size).toBe(100);
    });

    it('uses only alphanumeric characters', () => {
      const token = generateSecureToken(1000);
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('Character distribution', () => {
    it('includes uppercase letters', () => {
      const token = generateSecureToken(1000);
      expect(token).toMatch(/[A-Z]/);
    });

    it('includes lowercase letters', () => {
      const token = generateSecureToken(1000);
      expect(token).toMatch(/[a-z]/);
    });

    it('includes numbers', () => {
      const token = generateSecureToken(1000);
      expect(token).toMatch(/[0-9]/);
    });
  });

  describe('Edge cases', () => {
    it('handles length of 1', () => {
      const token = generateSecureToken(1);
      expect(token).toHaveLength(1);
      expect(token).toMatch(/^[A-Za-z0-9]$/);
    });

    it('handles large lengths', () => {
      const token = generateSecureToken(10000);
      expect(token).toHaveLength(10000);
    });
  });
});

describe('hashSensitiveData - Privacy Compliance', () => {
  describe('Basic hashing', () => {
    it('hashes data to hex string', async () => {
      const hash = await hashSensitiveData('test@example.com');
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('produces 64-character hash (SHA-256)', async () => {
      const hash = await hashSensitiveData('sensitive data');
      expect(hash).toHaveLength(64);
    });

    it('produces same hash for same input (deterministic)', async () => {
      const input = 'user@example.com';
      const hash1 = await hashSensitiveData(input);
      const hash2 = await hashSensitiveData(input);
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', async () => {
      const hash1 = await hashSensitiveData('data1');
      const hash2 = await hashSensitiveData('data2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Case sensitivity', () => {
    it('produces different hashes for different cases', async () => {
      const hash1 = await hashSensitiveData('Test');
      const hash2 = await hashSensitiveData('test');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Unicode and special characters', () => {
    it('handles unicode characters', async () => {
      const hash = await hashSensitiveData('Hello 世界');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('handles emoji', async () => {
      const hash = await hashSensitiveData('👋🌍');
      expect(hash).toHaveLength(64);
    });

    it('handles empty string', async () => {
      const hash = await hashSensitiveData('');
      expect(hash).toHaveLength(64);
    });

    it('handles special characters', async () => {
      const hash = await hashSensitiveData('!@#$%^&*()_+-=[]{}|;:",.<>?/');
      expect(hash).toHaveLength(64);
    });
  });

  describe('Known test vectors', () => {
    // Test with known SHA-256 hash for 'test'
    it('produces correct hash for known input', async () => {
      const hash = await hashSensitiveData('test');
      expect(hash).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    });
  });
});

describe('RateLimiter - Abuse Prevention', () => {
  beforeEach(() => {
    // Clear any existing rate limits
    contactFormRateLimiter['requests'].clear();
  });

  describe('Basic rate limiting', () => {
    it('allows requests under the limit', () => {
      const identifier = 'test-user-1';
      expect(contactFormRateLimiter.isAllowed(identifier)).toBe(true);
      expect(contactFormRateLimiter.isAllowed(identifier)).toBe(true);
      expect(contactFormRateLimiter.isAllowed(identifier)).toBe(true);
    });

    it('blocks requests over the limit', () => {
      const identifier = 'test-user-2';
      // Contact form limiter allows 5 requests per window
      for (let i = 0; i < 5; i++) {
        expect(contactFormRateLimiter.isAllowed(identifier)).toBe(true);
      }
      // 6th request should be blocked
      expect(contactFormRateLimiter.isAllowed(identifier)).toBe(false);
    });

    it('tracks different identifiers independently', () => {
      expect(contactFormRateLimiter.isAllowed('user1')).toBe(true);
      expect(contactFormRateLimiter.isAllowed('user2')).toBe(true);
      expect(contactFormRateLimiter.isAllowed('user1')).toBe(true);
      expect(contactFormRateLimiter.isAllowed('user2')).toBe(true);
    });
  });

  describe('Remaining requests', () => {
    it('returns correct remaining count', () => {
      const identifier = 'test-user-3';
      expect(contactFormRateLimiter.getRemaining(identifier)).toBe(5);
      
      contactFormRateLimiter.isAllowed(identifier);
      expect(contactFormRateLimiter.getRemaining(identifier)).toBe(4);
      
      contactFormRateLimiter.isAllowed(identifier);
      expect(contactFormRateLimiter.getRemaining(identifier)).toBe(3);
    });

    it('returns 0 when limit exceeded', () => {
      const identifier = 'test-user-4';
      for (let i = 0; i < 5; i++) {
        contactFormRateLimiter.isAllowed(identifier);
      }
      expect(contactFormRateLimiter.getRemaining(identifier)).toBe(0);
    });

    it('returns full limit for unknown identifier', () => {
      expect(contactFormRateLimiter.getRemaining('unknown-user')).toBe(5);
    });
  });

  describe('Time window behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resets after time window expires', () => {
      const identifier = 'test-user-5';
      
      // Use up all requests
      for (let i = 0; i < 5; i++) {
        expect(contactFormRateLimiter.isAllowed(identifier)).toBe(true);
      }
      expect(contactFormRateLimiter.isAllowed(identifier)).toBe(false);
      
      // Advance time past window (5 minutes + 1 second)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
      
      // Should be allowed again
      expect(contactFormRateLimiter.isAllowed(identifier)).toBe(true);
    });

    it('maintains sliding window correctly', () => {
      const identifier = 'test-user-6';
      
      // Make 3 requests
      contactFormRateLimiter.isAllowed(identifier);
      contactFormRateLimiter.isAllowed(identifier);
      contactFormRateLimiter.isAllowed(identifier);
      
      // Advance time by 2 minutes (still within window)
      vi.advanceTimersByTime(2 * 60 * 1000);
      
      // Should still have requests from earlier in the window
      expect(contactFormRateLimiter.getRemaining(identifier)).toBe(2);
      
      // Make 2 more requests
      contactFormRateLimiter.isAllowed(identifier);
      contactFormRateLimiter.isAllowed(identifier);
      
      // Should be at limit
      expect(contactFormRateLimiter.isAllowed(identifier)).toBe(false);
      
      // Advance past initial 3 requests (3 more minutes)
      vi.advanceTimersByTime(3 * 60 * 1000 + 1000);
      
      // First 3 requests should have expired
      expect(contactFormRateLimiter.getRemaining(identifier)).toBe(3);
    });
  });
});

describe('validatePhoneNumber - International Format', () => {
  describe('Valid phone numbers', () => {
    it('accepts phone with country code', () => {
      expect(validatePhoneNumber('+1234567890')).toBe(true);
    });

    it('accepts US phone number', () => {
      expect(validatePhoneNumber('+14155552671')).toBe(true);
    });

    it('accepts UK phone number', () => {
      expect(validatePhoneNumber('+442071234567')).toBe(true);
    });

    it('accepts German phone number', () => {
      expect(validatePhoneNumber('+4930123456')).toBe(true);
    });

    it('accepts phone with maximum digits (15)', () => {
      expect(validatePhoneNumber('+123456789012345')).toBe(true);
    });

    it('accepts phone with minimum digits (7)', () => {
      expect(validatePhoneNumber('+1234567')).toBe(true);
    });

    it('accepts phone with spaces (cleaned)', () => {
      expect(validatePhoneNumber('+1 415 555 2671')).toBe(true);
    });

    it('accepts phone with dashes (cleaned)', () => {
      expect(validatePhoneNumber('+1-415-555-2671')).toBe(true);
    });

    it('accepts phone with parentheses (cleaned)', () => {
      expect(validatePhoneNumber('+1 (415) 555-2671')).toBe(true);
    });

    it('accepts phone with dots (cleaned)', () => {
      expect(validatePhoneNumber('+1.415.555.2671')).toBe(true);
    });
  });

  describe('Invalid phone numbers', () => {
    it('rejects phone without plus prefix', () => {
      expect(validatePhoneNumber('14155552671')).toBe(false);
    });

    it('rejects phone too short (6 digits)', () => {
      expect(validatePhoneNumber('+123456')).toBe(false);
    });

    it('rejects phone too long (16 digits)', () => {
      expect(validatePhoneNumber('+1234567890123456')).toBe(false);
    });

    it('rejects phone with letters', () => {
      expect(validatePhoneNumber('+1415555CALL')).toBe(false);
    });

    it('rejects phone with multiple plus signs', () => {
      expect(validatePhoneNumber('++14155552671')).toBe(false);
    });

    it('rejects phone with plus in middle', () => {
      expect(validatePhoneNumber('+1415+5552671')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validatePhoneNumber('')).toBe(false);
    });

    it('rejects null', () => {
      expect(validatePhoneNumber(null as any)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(validatePhoneNumber(undefined as any)).toBe(false);
    });

    it('rejects non-string input', () => {
      expect(validatePhoneNumber(123 as any)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('handles phone with excessive formatting', () => {
      expect(validatePhoneNumber('+1 (415) 555-2671 ext.123')).toBe(false); // ext not in digits
    });

    it('rejects phone with only formatting characters', () => {
      expect(validatePhoneNumber('+ - ( ) .')).toBe(false);
    });
  });
});

describe('validateURL - Security Validation', () => {
  describe('Valid URLs', () => {
    it('accepts standard HTTP URL', () => {
      expect(validateURL('http://example.com')).toBe(true);
    });

    it('accepts standard HTTPS URL', () => {
      expect(validateURL('https://example.com')).toBe(true);
    });

    it('accepts URL with path', () => {
      expect(validateURL('https://example.com/path/to/page')).toBe(true);
    });

    it('accepts URL with query parameters', () => {
      expect(validateURL('https://example.com?param=value')).toBe(true);
    });

    it('accepts URL with fragment', () => {
      expect(validateURL('https://example.com#section')).toBe(true);
    });

    it('accepts URL with port', () => {
      expect(validateURL('https://example.com:8080')).toBe(true);
    });

    it('accepts URL with subdomain', () => {
      expect(validateURL('https://www.example.com')).toBe(true);
    });

    it('accepts URL with authentication', () => {
      expect(validateURL('https://user:pass@example.com')).toBe(true);
    });
  });

  describe('Invalid and dangerous URLs', () => {
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

    it('rejects FTP protocol', () => {
      expect(validateURL('ftp://example.com')).toBe(false);
    });

    it('rejects malformed URL', () => {
      expect(validateURL('not a url')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validateURL('')).toBe(false);
    });

    it('rejects null', () => {
      expect(validateURL(null as any)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(validateURL(undefined as any)).toBe(false);
    });

    it('rejects non-string input', () => {
      expect(validateURL(123 as any)).toBe(false);
    });
  });

  describe('XSS prevention', () => {
    it('rejects URL with embedded javascript in data protocol', () => {
      expect(validateURL('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);
    });

    it('case-insensitive protocol check for javascript', () => {
      expect(validateURL('JaVaScRiPt:alert(1)')).toBe(false);
    });

    it('case-insensitive protocol check for data', () => {
      expect(validateURL('DaTa:text/html,test')).toBe(false);
    });
  });

  describe('Protocol edge cases', () => {
    it('requires explicit protocol', () => {
      expect(validateURL('example.com')).toBe(false);
    });

    it('requires valid protocol format', () => {
      expect(validateURL('ht!tp://example.com')).toBe(false);
    });
  });
});

describe('DataRetentionManager - GDPR Compliance', () => {
  let manager: DataRetentionManager;

  beforeEach(() => {
    manager = new DataRetentionManager();
  });

  describe('Retention policy checking', () => {
    it('retains data within retention period', () => {
      const createdAt = new Date(Date.now() - 1000); // 1 second ago
      expect(manager.shouldRetain('contact_forms', createdAt)).toBe(true);
    });

    it('does not retain data past retention period', () => {
      const createdAt = new Date(Date.now() - (6 * 365 * 24 * 60 * 60 * 1000)); // 6 years ago
      expect(manager.shouldRetain('contact_forms', createdAt)).toBe(false);
    });

    it('returns false for unknown data type', () => {
      const createdAt = new Date();
      expect(manager.shouldRetain('unknown_type', createdAt)).toBe(false);
    });
  });

  describe('Different data type retention periods', () => {
    it('retains contact_forms for 5 years', () => {
      const justUnder5Years = new Date(Date.now() - (5 * 365 * 24 * 60 * 60 * 1000) + 1000);
      expect(manager.shouldRetain('contact_forms', justUnder5Years)).toBe(true);

      const justOver5Years = new Date(Date.now() - (5 * 365 * 24 * 60 * 60 * 1000) - 1000);
      expect(manager.shouldRetain('contact_forms', justOver5Years)).toBe(false);
    });

    it('retains audit_logs for 7 years', () => {
      const justUnder7Years = new Date(Date.now() - (7 * 365 * 24 * 60 * 60 * 1000) + 1000);
      expect(manager.shouldRetain('audit_logs', justUnder7Years)).toBe(true);

      const justOver7Years = new Date(Date.now() - (7 * 365 * 24 * 60 * 60 * 1000) - 1000);
      expect(manager.shouldRetain('audit_logs', justOver7Years)).toBe(false);
    });

    it('retains user_sessions for 30 days', () => {
      const justUnder30Days = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000) + 1000);
      expect(manager.shouldRetain('user_sessions', justUnder30Days)).toBe(true);

      const justOver30Days = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000) - 1000);
      expect(manager.shouldRetain('user_sessions', justOver30Days)).toBe(false);
    });

    it('retains analytics for 26 months', () => {
      const justUnder26Months = new Date(Date.now() - (26 * 30 * 24 * 60 * 60 * 1000) + 1000);
      expect(manager.shouldRetain('analytics', justUnder26Months)).toBe(true);

      const justOver26Months = new Date(Date.now() - (26 * 30 * 24 * 60 * 60 * 1000) - 1000);
      expect(manager.shouldRetain('analytics', justOver26Months)).toBe(false);
    });
  });

  describe('Expiry date calculation', () => {
    it('calculates correct expiry date for contact_forms', () => {
      const createdAt = new Date('2020-01-01T00:00:00Z');
      const expiryDate = manager.getExpiryDate('contact_forms', createdAt);
      
      expect(expiryDate).not.toBeNull();
      const expectedExpiry = new Date('2025-01-01T00:00:00Z');
      expect(expiryDate?.getTime()).toBe(expectedExpiry.getTime());
    });

    it('calculates correct expiry date for audit_logs', () => {
      const createdAt = new Date('2020-01-01T00:00:00Z');
      const expiryDate = manager.getExpiryDate('audit_logs', createdAt);
      
      expect(expiryDate).not.toBeNull();
      const expectedExpiry = new Date('2027-01-01T00:00:00Z');
      expect(expiryDate?.getTime()).toBe(expectedExpiry.getTime());
    });

    it('calculates correct expiry date for user_sessions', () => {
      const createdAt = new Date('2020-01-01T00:00:00Z');
      const expiryDate = manager.getExpiryDate('user_sessions', createdAt);
      
      expect(expiryDate).not.toBeNull();
      const expectedExpiry = new Date('2020-01-31T00:00:00Z');
      expect(expiryDate?.getTime()).toBe(expectedExpiry.getTime());
    });

    it('returns null for unknown data type', () => {
      const createdAt = new Date();
      const expiryDate = manager.getExpiryDate('unknown_type', createdAt);
      expect(expiryDate).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('handles data created in the future', () => {
      const futureDate = new Date(Date.now() + 1000000);
      expect(manager.shouldRetain('contact_forms', futureDate)).toBe(true);
    });

    it('handles very old data', () => {
      const veryOld = new Date('1990-01-01');
      expect(manager.shouldRetain('contact_forms', veryOld)).toBe(false);
    });
  });
});

describe('Global instances', () => {
  it('exports contactFormRateLimiter instance', () => {
    expect(contactFormRateLimiter).toBeDefined();
    expect(contactFormRateLimiter.isAllowed).toBeInstanceOf(Function);
    expect(contactFormRateLimiter.getRemaining).toBeInstanceOf(Function);
  });

  it('exports dataRetentionManager instance', () => {
    expect(dataRetentionManager).toBeDefined();
    expect(dataRetentionManager.shouldRetain).toBeInstanceOf(Function);
    expect(dataRetentionManager.getExpiryDate).toBeInstanceOf(Function);
  });
});
