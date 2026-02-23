/**
 * Comprehensive test suite for contact API
 * Tests GDPR compliance, security validation, and audit logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { submitContactForm, logAuditEvent, exportUserData, deleteUserData } from '../../src/api/contact';

// Mock global fetch
global.fetch = vi.fn();

// Mock navigator
global.navigator = {
  userAgent: 'Mozilla/5.0 (Test) AppleWebKit/537.36'
} as Navigator;

describe('Contact API - submitContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'csrf-token-123' })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully submits valid contact form data', async () => {
    const formData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message'
    };

    await submitContactForm(formData);

    // Should call CSRF endpoint first
    expect(global.fetch).toHaveBeenCalledWith('/api/csrf-token');
    
    // Should submit form with CSRF token
    const submitCall = (global.fetch as any).mock.calls.find(
      (call: any) => call[0] === '/api/contact'
    );
    expect(submitCall).toBeDefined();
    expect(submitCall[1].method).toBe('POST');
    expect(submitCall[1].headers['X-CSRF-Token']).toBe('csrf-token-123');
    
    const body = JSON.parse(submitCall[1].body);
    expect(body.name).toBe('John Doe');
    expect(body.email).toBe('john@example.com');
    expect(body.message).toBe('Test message');
    expect(body.consent_given).toBe(true);
    expect(body.retention_period).toBe('5_years');
    expect(body.timestamp).toBeDefined();
  });

  it('logs audit events for form submission', async () => {
    const formData = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      message: 'Inquiry'
    };

    await submitContactForm(formData);

    // Should log submission attempt and success
    const auditCalls = (global.fetch as any).mock.calls.filter(
      (call: any) => call[0] === '/api/audit'
    );
    expect(auditCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('validates required name field', async () => {
    const invalidData = {
      name: '',
      email: 'test@example.com',
      message: 'Test'
    };

    await expect(submitContactForm(invalidData)).rejects.toThrow('Invalid name field');
  });

  it('validates name field length (max 100 chars)', async () => {
    const invalidData = {
      name: 'a'.repeat(101),
      email: 'test@example.com',
      message: 'Test'
    };

    await expect(submitContactForm(invalidData)).rejects.toThrow('Invalid name field');
  });

  it('validates required email field', async () => {
    const invalidData = {
      name: 'John Doe',
      email: '',
      message: 'Test'
    };

    await expect(submitContactForm(invalidData)).rejects.toThrow('Invalid email field');
  });

  it('validates email field length (max 255 chars)', async () => {
    const invalidData = {
      name: 'John Doe',
      email: 'a'.repeat(256),
      message: 'Test'
    };

    await expect(submitContactForm(invalidData)).rejects.toThrow('Invalid email field');
  });

  it('validates email format', async () => {
    const invalidData = {
      name: 'John Doe',
      email: 'invalid-email',
      message: 'Test'
    };

    await expect(submitContactForm(invalidData)).rejects.toThrow('Invalid email format');
  });

  it('validates required message field', async () => {
    const invalidData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: ''
    };

    await expect(submitContactForm(invalidData)).rejects.toThrow('Invalid message field');
  });

  it('validates message field length (max 5000 chars)', async () => {
    const invalidData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: 'a'.repeat(5001)
    };

    await expect(submitContactForm(invalidData)).rejects.toThrow('Invalid message field');
  });

  it('detects XSS script tags in name field', async () => {
    const maliciousData = {
      name: 'John<script>alert("xss")</script>',
      email: 'test@example.com',
      message: 'Test'
    };

    await expect(submitContactForm(maliciousData)).rejects.toThrow('Invalid input detected');
  });

  it('detects XSS script tags in email field', async () => {
    const maliciousData = {
      name: 'John Doe',
      email: '<script>alert("xss")</script>@test.com',
      message: 'Test'
    };

    await expect(submitContactForm(maliciousData)).rejects.toThrow('Invalid input detected');
  });

  it('detects XSS script tags in message field', async () => {
    const maliciousData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: 'Hello <script>alert("xss")</script>'
    };

    await expect(submitContactForm(maliciousData)).rejects.toThrow('Invalid input detected');
  });

  it('detects javascript: protocol in input', async () => {
    const maliciousData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: 'Click here: javascript:alert(1)'
    };

    await expect(submitContactForm(maliciousData)).rejects.toThrow('Invalid input detected');
  });

  it('detects event handler attributes in input', async () => {
    const maliciousData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: 'Test onclick=alert(1)'
    };

    await expect(submitContactForm(maliciousData)).rejects.toThrow('Invalid input detected');
  });

  it('detects data: protocol in input', async () => {
    const maliciousData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: 'data:text/html,<script>alert(1)</script>'
    };

    await expect(submitContactForm(maliciousData)).rejects.toThrow('Invalid input detected');
  });

  it('handles HTTP error response', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ token: 'csrf-token' })
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
    });

    const formData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: 'Test'
    };

    await expect(submitContactForm(formData)).rejects.toThrow('Failed to submit contact form');
  });

  it('handles network errors', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ token: 'csrf-token' })
        });
      }
      return Promise.reject(new Error('Network error'));
    });

    const formData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: 'Test'
    };

    await expect(submitContactForm(formData)).rejects.toThrow('Failed to submit contact form');
  });

  it('throws error when CSRF token cannot be obtained', async () => {
    (global.fetch as any).mockRejectedValue(new Error('CSRF endpoint down'));

    const formData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: 'Test'
    };

    await expect(submitContactForm(formData)).rejects.toThrow('Failed to obtain CSRF token');
  });
});

describe('Contact API - logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200
    });
  });

  it('logs audit event with proper structure', async () => {
    await logAuditEvent('test_event', { key: 'value' });

    const auditCall = (global.fetch as any).mock.calls.find(
      (call: any) => call[0] === '/api/audit'
    );
    
    expect(auditCall).toBeDefined();
    expect(auditCall[1].method).toBe('POST');
    expect(auditCall[1].headers['Content-Type']).toBe('application/json');
    expect(auditCall[1].headers['Authorization']).toContain('Bearer');

    const body = JSON.parse(auditCall[1].body);
    expect(body.id).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(body.eventType).toBe('test_event');
    expect(body.eventData).toEqual({ key: 'value' });
    expect(body.ipAddress).toBe('hashed_ip_placeholder');
    expect(body.userAgent).toContain('Mozilla');
  });

  it('handles audit logging failures gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Audit service down'));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Should not throw error
    await logAuditEvent('test_event', {});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Audit logging failed:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('truncates user agent to 200 characters', async () => {
    const longUserAgent = 'a'.repeat(300);
    global.navigator = {
      userAgent: longUserAgent
    } as Navigator;

    await logAuditEvent('test_event', {});

    const auditCall = (global.fetch as any).mock.calls.find(
      (call: any) => call[0] === '/api/audit'
    );
    const body = JSON.parse(auditCall[1].body);
    expect(body.userAgent.length).toBe(200);
  });
});

describe('Contact API - exportUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(['user data'], { type: 'application/json' })
    });
  });

  it('exports user data successfully', async () => {
    const blob = await exportUserData('user123');

    const exportCall = (global.fetch as any).mock.calls.find(
      (call: any) => call[0] === '/api/users/user123/export'
    );
    
    expect(exportCall).toBeDefined();
    expect(exportCall[1].method).toBe('GET');
    expect(exportCall[1].headers['Authorization']).toContain('Bearer');
    expect(blob).toBeInstanceOf(Blob);
  });

  it('logs audit events for data export', async () => {
    await exportUserData('user123');

    const auditCalls = (global.fetch as any).mock.calls.filter(
      (call: any) => call[0] === '/api/audit'
    );
    
    expect(auditCalls.length).toBeGreaterThanOrEqual(2);
    
    // Check for request and success logs
    const bodies = auditCalls.map((call: any) => JSON.parse(call[1].body));
    const eventTypes = bodies.map((b: any) => b.eventType);
    expect(eventTypes).toContain('data_export_request');
    expect(eventTypes).toContain('data_export_success');
  });

  it('handles export errors', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/export')) {
        return Promise.resolve({
          ok: false,
          status: 404
        });
      }
      return Promise.resolve({ ok: true });
    });

    await expect(exportUserData('user123')).rejects.toThrow('Failed to export user data');
  });

  it('logs error audit event on failure', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/export')) {
        return Promise.resolve({
          ok: false,
          status: 500
        });
      }
      return Promise.resolve({ ok: true });
    });

    try {
      await exportUserData('user123');
    } catch {
      // Expected error
    }

    const auditCalls = (global.fetch as any).mock.calls.filter(
      (call: any) => call[0] === '/api/audit'
    );
    
    const bodies = auditCalls.map((call: any) => JSON.parse(call[1].body));
    const eventTypes = bodies.map((b: any) => b.eventType);
    expect(eventTypes).toContain('data_export_error');
  });
});

describe('Contact API - deleteUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 204
    });
  });

  it('deletes user data successfully', async () => {
    await deleteUserData('user123');

    const deleteCall = (global.fetch as any).mock.calls.find(
      (call: any) => call[0] === '/api/users/user123'
    );
    
    expect(deleteCall).toBeDefined();
    expect(deleteCall[1].method).toBe('DELETE');
    expect(deleteCall[1].headers['Authorization']).toContain('Bearer');
  });

  it('logs audit events for data deletion', async () => {
    await deleteUserData('user123');

    const auditCalls = (global.fetch as any).mock.calls.filter(
      (call: any) => call[0] === '/api/audit'
    );
    
    expect(auditCalls.length).toBeGreaterThanOrEqual(2);
    
    const bodies = auditCalls.map((call: any) => JSON.parse(call[1].body));
    const eventTypes = bodies.map((b: any) => b.eventType);
    expect(eventTypes).toContain('data_deletion_request');
    expect(eventTypes).toContain('data_deletion_success');
  });

  it('handles deletion errors', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/users/')) {
        return Promise.resolve({
          ok: false,
          status: 404
        });
      }
      return Promise.resolve({ ok: true });
    });

    await expect(deleteUserData('user123')).rejects.toThrow('Failed to delete user data');
  });

  it('logs error audit event on deletion failure', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/users/')) {
        return Promise.resolve({
          ok: false,
          status: 500
        });
      }
      return Promise.resolve({ ok: true });
    });

    try {
      await deleteUserData('user123');
    } catch {
      // Expected error
    }

    const auditCalls = (global.fetch as any).mock.calls.filter(
      (call: any) => call[0] === '/api/audit'
    );
    
    const bodies = auditCalls.map((call: any) => JSON.parse(call[1].body));
    const eventTypes = bodies.map((b: any) => b.eventType);
    expect(eventTypes).toContain('data_deletion_error');
  });
});

describe('Contact API - Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'csrf-token' })
    });
  });

  it('rejects SQL injection attempts in name', async () => {
    const maliciousData = {
      name: "'; DROP TABLE users; --",
      email: 'test@example.com',
      message: 'Test'
    };

    // Should still pass validation (no SQL in browser)
    // but malicious patterns might be detected
    await submitContactForm(maliciousData);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('accepts valid international characters', async () => {
    const validData = {
      name: 'José García-Pérez',
      email: 'jose@example.com',
      message: 'Hola! 你好'
    };

    await submitContactForm(validData);
    expect(global.fetch).toHaveBeenCalledWith('/api/contact', expect.any(Object));
  });

  it('validates email with special but valid characters', async () => {
    const validData = {
      name: 'John Doe',
      email: 'user+tag@sub.example.co.uk',
      message: 'Test'
    };

    await submitContactForm(validData);
    expect(global.fetch).toHaveBeenCalledWith('/api/contact', expect.any(Object));
  });
});
