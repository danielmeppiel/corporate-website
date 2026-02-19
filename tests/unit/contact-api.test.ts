/**
 * Comprehensive test suite for src/api/contact.ts
 * Tests GDPR compliance, security measures, and API interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { submitContactForm, logAuditEvent, exportUserData, deleteUserData } from '../../src/api/contact';

// Mock global fetch
global.fetch = vi.fn();

// Mock navigator
global.navigator = {
  userAgent: 'Mozilla/5.0 (Test Browser) AppleWebKit/537.36'
} as any;

describe('submitContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Valid submissions', () => {
    it('should submit valid form data successfully', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf-token-123' }) }) // CSRF token
        .mockResolvedValueOnce({ ok: true, status: 200 }) // audit log (submission attempt)
        .mockResolvedValueOnce({ ok: true, status: 201 }) // form submission
        .mockResolvedValueOnce({ ok: true, status: 200 }); // audit log (success)
      
      global.fetch = mockFetch;

      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message'
      };

      await submitContactForm(formData);

      // Verify CSRF token was fetched
      expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token');

      // Verify form was submitted with correct data
      const submitCall = mockFetch.mock.calls.find(call => 
        call[0] === '/api/contact' && call[1]?.method === 'POST'
      );
      expect(submitCall).toBeDefined();
      
      const submitBody = JSON.parse(submitCall![1].body);
      expect(submitBody).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
        consent_given: true,
        retention_period: '5_years'
      });
      expect(submitBody.timestamp).toBeDefined();
    });

    it('should include CSRF token in headers', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'test-csrf' }) })
        .mockResolvedValue({ ok: true, status: 200 });
      
      global.fetch = mockFetch;

      await submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Test'
      });

      const submitCall = mockFetch.mock.calls.find(call => 
        call[0] === '/api/contact'
      );
      
      expect(submitCall![1].headers['X-CSRF-Token']).toBe('test-csrf');
    });

    it('should log submission attempt before sending', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf' }) })
        .mockResolvedValue({ ok: true, status: 200 });
      
      global.fetch = mockFetch;

      await submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Test'
      });

      // Find audit log for submission attempt
      const auditCalls = mockFetch.mock.calls.filter(call => 
        call[0] === '/api/audit'
      );
      
      expect(auditCalls.length).toBeGreaterThanOrEqual(1);
      const firstAudit = JSON.parse(auditCalls[0][1].body);
      expect(firstAudit.eventType).toBe('contact_form_submission');
      expect(firstAudit.eventData.fields_submitted).toEqual(['name', 'email', 'message']);
      expect(firstAudit.eventData.data_minimization_applied).toBe(true);
      expect(firstAudit.eventData.consent_verified).toBe(true);
    });

    it('should log success after successful submission', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf' }) })
        .mockResolvedValue({ ok: true, status: 201 });
      
      global.fetch = mockFetch;

      await submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Test'
      });

      // Find success audit log
      const auditCalls = mockFetch.mock.calls.filter(call => 
        call[0] === '/api/audit'
      );
      
      const successAudit = auditCalls.find(call => {
        const body = JSON.parse(call[1].body);
        return body.eventType === 'contact_form_success';
      });
      
      expect(successAudit).toBeDefined();
    });
  });

  describe('Input validation', () => {
    it('should reject empty name', async () => {
      await expect(submitContactForm({
        name: '',
        email: 'test@test.com',
        message: 'Test'
      })).rejects.toThrow('Invalid name field');
    });

    it('should reject name longer than 100 characters', async () => {
      await expect(submitContactForm({
        name: 'a'.repeat(101),
        email: 'test@test.com',
        message: 'Test'
      })).rejects.toThrow('Invalid name field');
    });

    it('should reject non-string name', async () => {
      await expect(submitContactForm({
        name: 123 as any,
        email: 'test@test.com',
        message: 'Test'
      })).rejects.toThrow('Invalid name field');
    });

    it('should reject empty email', async () => {
      await expect(submitContactForm({
        name: 'Test',
        email: '',
        message: 'Test'
      })).rejects.toThrow('Invalid email field');
    });

    it('should reject email longer than 255 characters', async () => {
      await expect(submitContactForm({
        name: 'Test',
        email: 'a'.repeat(256),
        message: 'Test'
      })).rejects.toThrow('Invalid email field');
    });

    it('should reject non-string email', async () => {
      await expect(submitContactForm({
        name: 'Test',
        email: null as any,
        message: 'Test'
      })).rejects.toThrow('Invalid email field');
    });

    it('should reject invalid email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ];

      for (const email of invalidEmails) {
        await expect(submitContactForm({
          name: 'Test',
          email,
          message: 'Test'
        })).rejects.toThrow('Invalid email format');
      }
    });

    it('should accept valid email formats', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf' }) })
        .mockResolvedValue({ ok: true, status: 200 });
      
      global.fetch = mockFetch;

      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@sub.example.com',
      ];

      for (const email of validEmails) {
        vi.clearAllMocks();
        await submitContactForm({
          name: 'Test',
          email,
          message: 'Test'
        });
        expect(mockFetch).toHaveBeenCalled();
      }
    });

    it('should reject empty message', async () => {
      await expect(submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: ''
      })).rejects.toThrow('Invalid message field');
    });

    it('should reject message longer than 5000 characters', async () => {
      await expect(submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'a'.repeat(5001)
      })).rejects.toThrow('Invalid message field');
    });

    it('should reject non-string message', async () => {
      await expect(submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: undefined as any
      })).rejects.toThrow('Invalid message field');
    });

    it('should accept message at maximum length', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf' }) })
        .mockResolvedValue({ ok: true, status: 200 });
      
      global.fetch = mockFetch;

      await submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'a'.repeat(5000)
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Security - malicious content detection', () => {
    it('should reject script tags in name', async () => {
      await expect(submitContactForm({
        name: 'Test <script>alert(1)</script>',
        email: 'test@test.com',
        message: 'Test'
      })).rejects.toThrow('Invalid input detected');
    });

    it('should reject script tags in email', async () => {
      await expect(submitContactForm({
        name: 'Test',
        email: '<script>@test.com',
        message: 'Test'
      })).rejects.toThrow('Invalid input detected');
    });

    it('should reject script tags in message', async () => {
      await expect(submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Hello <SCRIPT>alert("XSS")</SCRIPT>'
      })).rejects.toThrow('Invalid input detected');
    });

    it('should reject javascript: protocol', async () => {
      await expect(submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Click here: javascript:alert(1)'
      })).rejects.toThrow('Invalid input detected');
    });

    it('should reject event handlers in name', async () => {
      await expect(submitContactForm({
        name: 'Test onclick=alert(1)',
        email: 'test@test.com',
        message: 'Test'
      })).rejects.toThrow('Invalid input detected');
    });

    it('should reject data: protocol', async () => {
      await expect(submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'data:text/html,<script>alert(1)</script>'
      })).rejects.toThrow('Invalid input detected');
    });

    it('should reject multiple suspicious patterns', async () => {
      const suspiciousInputs = [
        '<script>',
        'javascript:void(0)',
        'onload=',
        'onerror=',
        'onclick=',
        'data:image/svg+xml',
      ];

      for (const input of suspiciousInputs) {
        await expect(submitContactForm({
          name: input,
          email: 'test@test.com',
          message: 'Test'
        })).rejects.toThrow('Invalid input detected');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors gracefully', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf' }) })
        .mockResolvedValueOnce({ ok: true }) // audit log
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' }); // form submission fails
      
      global.fetch = mockFetch;

      await expect(submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Test'
      })).rejects.toThrow('Failed to submit contact form');
    });

    it('should log errors without exposing details', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf' }) })
        .mockResolvedValueOnce({ ok: true }) // first audit log
        .mockResolvedValueOnce({ ok: false, status: 500 }) // submission fails
        .mockResolvedValueOnce({ ok: true }); // error audit log
      
      global.fetch = mockFetch;

      try {
        await submitContactForm({
          name: 'Test',
          email: 'test@test.com',
          message: 'Test'
        });
      } catch {
        // Expected
      }

      // Find error audit log
      const auditCalls = mockFetch.mock.calls.filter(call => 
        call[0] === '/api/audit'
      );
      
      const errorAudit = auditCalls.find(call => {
        const body = JSON.parse(call[1].body);
        return body.eventType === 'contact_form_error';
      });
      
      expect(errorAudit).toBeDefined();
      const errorBody = JSON.parse(errorAudit![1].body);
      expect(errorBody.eventData.error_type).toBe('Error');
      expect(errorBody.eventData.error_message).toBeUndefined(); // Should not expose error message
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf' }) })
        .mockResolvedValueOnce({ ok: true }) // audit log
        .mockRejectedValueOnce(new TypeError('Network error')); // network failure
      
      global.fetch = mockFetch;

      await expect(submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Test'
      })).rejects.toThrow('Failed to submit contact form');
    });

    it('should handle CSRF token fetch failure', async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('CSRF endpoint down'));
      
      global.fetch = mockFetch;

      await expect(submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Test'
      })).rejects.toThrow('Failed to obtain CSRF token');
    });
  });

  describe('GDPR compliance', () => {
    it('should include consent_given flag', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf' }) })
        .mockResolvedValue({ ok: true, status: 200 });
      
      global.fetch = mockFetch;

      await submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Test'
      });

      const submitCall = mockFetch.mock.calls.find(call => 
        call[0] === '/api/contact'
      );
      const body = JSON.parse(submitCall![1].body);
      
      expect(body.consent_given).toBe(true);
    });

    it('should include 5-year retention period', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf' }) })
        .mockResolvedValue({ ok: true, status: 200 });
      
      global.fetch = mockFetch;

      await submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Test'
      });

      const submitCall = mockFetch.mock.calls.find(call => 
        call[0] === '/api/contact'
      );
      const body = JSON.parse(submitCall![1].body);
      
      expect(body.retention_period).toBe('5_years');
    });

    it('should include timestamp for record keeping', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ json: async () => ({ token: 'csrf' }) })
        .mockResolvedValue({ ok: true, status: 200 });
      
      global.fetch = mockFetch;

      const beforeTime = new Date().toISOString();
      await submitContactForm({
        name: 'Test',
        email: 'test@test.com',
        message: 'Test'
      });
      const afterTime = new Date().toISOString();

      const submitCall = mockFetch.mock.calls.find(call => 
        call[0] === '/api/contact'
      );
      const body = JSON.parse(submitCall![1].body);
      
      expect(body.timestamp).toBeDefined();
      expect(body.timestamp >= beforeTime).toBe(true);
      expect(body.timestamp <= afterTime).toBe(true);
    });
  });
});

describe('logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create audit log with all required fields', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    await logAuditEvent('test_event', { action: 'test' });

    expect(mockFetch).toHaveBeenCalledWith('/api/audit', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      })
    }));

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body);

    expect(body.id).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(body.eventType).toBe('test_event');
    expect(body.eventData).toEqual({ action: 'test' });
  });

  it('should include hashed IP address for privacy', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    await logAuditEvent('test_event', {});

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body);

    expect(body.ipAddress).toBeDefined();
    // IP should be hashed, not actual IP
    expect(body.ipAddress).toBe('hashed_ip_placeholder');
  });

  it('should include user agent for audit trail', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    await logAuditEvent('test_event', {});

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body);

    expect(body.userAgent).toBeDefined();
    expect(body.userAgent).toContain('Mozilla');
    expect(body.userAgent.length).toBeLessThanOrEqual(200); // Truncated for privacy
  });

  it('should generate unique IDs for each event', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    await logAuditEvent('event1', {});
    await logAuditEvent('event2', {});

    const id1 = JSON.parse(mockFetch.mock.calls[0][1].body).id;
    const id2 = JSON.parse(mockFetch.mock.calls[1][1].body).id;

    expect(id1).not.toBe(id2);
    // UUID v4 format
    expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should include authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    await logAuditEvent('test_event', {});

    const call = mockFetch.mock.calls[0];
    expect(call[1].headers.Authorization).toContain('Bearer');
  });

  it('should not throw if audit logging fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    // Should not throw
    await expect(logAuditEvent('test_event', {})).resolves.not.toThrow();

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('should handle undefined userId for anonymous users', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    await logAuditEvent('test_event', {});

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body);

    expect(body.userId).toBeUndefined();
  });
});

describe('exportUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export user data successfully', async () => {
    const mockBlob = new Blob(['user data'], { type: 'application/json' });
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // first audit log
      .mockResolvedValueOnce({ ok: true, blob: async () => mockBlob }) // export request
      .mockResolvedValueOnce({ ok: true }); // success audit log
    
    global.fetch = mockFetch;

    const result = await exportUserData('user-123');

    expect(result).toBe(mockBlob);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/users/user-123/export',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer')
        })
      })
    );
  });

  it('should log export request before attempting', async () => {
    const mockBlob = new Blob(['data']);
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // audit log
      .mockResolvedValueOnce({ ok: true, blob: async () => mockBlob }); // export
    
    global.fetch = mockFetch;

    await exportUserData('user-123');

    const auditCalls = mockFetch.mock.calls.filter(call => call[0] === '/api/audit');
    expect(auditCalls.length).toBeGreaterThanOrEqual(1);
    
    const firstAudit = JSON.parse(auditCalls[0][1].body);
    expect(firstAudit.eventType).toBe('data_export_request');
    expect(firstAudit.eventData.userId).toBe('user-123');
  });

  it('should log success after export', async () => {
    const mockBlob = new Blob(['data']);
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // request audit
      .mockResolvedValueOnce({ ok: true, blob: async () => mockBlob }) // export
      .mockResolvedValueOnce({ ok: true }); // success audit
    
    global.fetch = mockFetch;

    await exportUserData('user-123');

    const auditCalls = mockFetch.mock.calls.filter(call => call[0] === '/api/audit');
    const successAudit = auditCalls.find(call => {
      const body = JSON.parse(call[1].body);
      return body.eventType === 'data_export_success';
    });
    
    expect(successAudit).toBeDefined();
  });

  it('should handle export failures', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // request audit
      .mockResolvedValueOnce({ ok: false, status: 404 }); // export fails
    
    global.fetch = mockFetch;

    await expect(exportUserData('user-123')).rejects.toThrow('Failed to export user data');
  });

  it('should log errors without exposing details', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // request audit
      .mockResolvedValueOnce({ ok: false, status: 500 }) // export fails
      .mockResolvedValueOnce({ ok: true }); // error audit
    
    global.fetch = mockFetch;

    try {
      await exportUserData('user-123');
    } catch {
      // Expected
    }

    const auditCalls = mockFetch.mock.calls.filter(call => call[0] === '/api/audit');
    const errorAudit = auditCalls.find(call => {
      const body = JSON.parse(call[1].body);
      return body.eventType === 'data_export_error';
    });
    
    expect(errorAudit).toBeDefined();
    const errorBody = JSON.parse(errorAudit![1].body);
    expect(errorBody.eventData.userId).toBe('user-123');
    expect(errorBody.eventData.error_type).toBe('Error');
  });
});

describe('deleteUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete user data successfully', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // request audit
      .mockResolvedValueOnce({ ok: true, status: 204 }) // deletion
      .mockResolvedValueOnce({ ok: true }); // success audit
    
    global.fetch = mockFetch;

    await deleteUserData('user-456');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/users/user-456',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer')
        })
      })
    );
  });

  it('should log deletion request before attempting', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // audit
      .mockResolvedValueOnce({ ok: true }); // deletion
    
    global.fetch = mockFetch;

    await deleteUserData('user-456');

    const auditCalls = mockFetch.mock.calls.filter(call => call[0] === '/api/audit');
    const requestAudit = JSON.parse(auditCalls[0][1].body);
    
    expect(requestAudit.eventType).toBe('data_deletion_request');
    expect(requestAudit.eventData.userId).toBe('user-456');
  });

  it('should log success after deletion', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // request audit
      .mockResolvedValueOnce({ ok: true }) // deletion
      .mockResolvedValueOnce({ ok: true }); // success audit
    
    global.fetch = mockFetch;

    await deleteUserData('user-456');

    const auditCalls = mockFetch.mock.calls.filter(call => call[0] === '/api/audit');
    const successAudit = auditCalls.find(call => {
      const body = JSON.parse(call[1].body);
      return body.eventType === 'data_deletion_success';
    });
    
    expect(successAudit).toBeDefined();
  });

  it('should handle deletion failures', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // audit
      .mockResolvedValueOnce({ ok: false, status: 403 }); // deletion fails
    
    global.fetch = mockFetch;

    await expect(deleteUserData('user-456')).rejects.toThrow('Failed to delete user data');
  });

  it('should log errors without exposing details', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // request audit
      .mockResolvedValueOnce({ ok: false, status: 500 }) // deletion fails
      .mockResolvedValueOnce({ ok: true }); // error audit
    
    global.fetch = mockFetch;

    try {
      await deleteUserData('user-456');
    } catch {
      // Expected
    }

    const auditCalls = mockFetch.mock.calls.filter(call => call[0] === '/api/audit');
    const errorAudit = auditCalls.find(call => {
      const body = JSON.parse(call[1].body);
      return body.eventType === 'data_deletion_error';
    });
    
    expect(errorAudit).toBeDefined();
    const errorBody = JSON.parse(errorAudit![1].body);
    expect(errorBody.eventData.userId).toBe('user-456');
    expect(errorBody.eventData.error_type).toBe('Error');
  });

  it('should require authentication token', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // audit
      .mockResolvedValueOnce({ ok: true }); // deletion
    
    global.fetch = mockFetch;

    await deleteUserData('user-456');

    const deleteCall = mockFetch.mock.calls.find(call => 
      call[0] === '/api/users/user-456' && call[1]?.method === 'DELETE'
    );
    
    expect(deleteCall![1].headers.Authorization).toBeDefined();
    expect(deleteCall![1].headers.Authorization).toContain('Bearer');
  });
});
