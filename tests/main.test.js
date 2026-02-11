/**
 * Test suite for main.js core application functionality
 * Tests form validation, accessibility, GDPR compliance, and user interaction logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('main.js Core Application', () => {
  let dom;
  let window;
  let document;
  let localStorage;
  let sessionStorage;
  let corporateWebsite;

  beforeEach(() => {
    // Read the main.js file
    const mainJsPath = path.join(process.cwd(), 'main.js');
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf-8');

    // Create a minimal HTML document
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <main id="main">
            <form id="contact-form">
              <input type="text" name="name" id="name" />
              <input type="email" name="email" id="email" />
              <textarea name="message" id="message"></textarea>
              <button type="submit">Submit</button>
            </form>
          </main>
        </body>
      </html>
    `;

    // Set up JSDOM environment
    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'http://localhost'
    });
    
    window = dom.window;
    document = window.document;
    localStorage = window.localStorage;
    sessionStorage = window.sessionStorage;

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock alert
    window.alert = vi.fn();

    // Execute main.js in the JSDOM context
    const scriptEl = document.createElement('script');
    scriptEl.textContent = mainJsContent;
    document.body.appendChild(scriptEl);

    // Manually trigger DOMContentLoaded since we're adding script after page load
    const event = new window.Event('DOMContentLoaded');
    document.dispatchEvent(event);

    corporateWebsite = window.corporateWebsite;
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize application on DOMContentLoaded', () => {
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Corporate Website initialized')
      );
    });

    it('should initialize accessibility features', () => {
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Accessibility features initialized')
      );
    });

    it('should initialize GDPR compliance features', () => {
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('GDPR compliance features initialized')
      );
    });
  });

  describe('showMessage()', () => {
    it('should display welcome alert when called', () => {
      corporateWebsite.showMessage();
      
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Welcome!')
      );
    });

    it('should log user interaction when CTA button is clicked', () => {
      corporateWebsite.showMessage();
      
      const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      expect(auditLogs.length).toBeGreaterThan(0);
      
      const lastLog = auditLogs[auditLogs.length - 1];
      expect(lastLog.type).toBe('cta_button_click');
      expect(lastLog.data.action).toBe('hero_cta_clicked');
    });

    it('should include timestamp in logged interaction', () => {
      corporateWebsite.showMessage();
      
      const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      const lastLog = auditLogs[auditLogs.length - 1];
      
      expect(lastLog.data.timestamp).toBeDefined();
      expect(lastLog.timestamp).toBeDefined();
    });
  });

  describe('handleSubmit() - Form Validation', () => {
    let form;
    let event;

    beforeEach(() => {
      form = document.getElementById('contact-form');
      event = new window.Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: form, writable: false });
    });

    it('should prevent default form submission', () => {
      event.preventDefault = vi.fn();
      corporateWebsite.handleSubmit(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should show error when name is missing', () => {
      document.getElementById('email').value = 'test@example.com';
      document.getElementById('message').value = 'Test message';
      
      corporateWebsite.handleSubmit(event);
      
      // Check that error notification was created
      const notifications = document.querySelectorAll('div');
      const errorNotification = Array.from(notifications).find(div => 
        div.textContent.includes('required')
      );
      
      expect(errorNotification).toBeDefined();
    });

    it('should show error when email is missing', () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('message').value = 'Test message';
      
      corporateWebsite.handleSubmit(event);
      
      const notifications = document.querySelectorAll('div');
      const errorNotification = Array.from(notifications).find(div => 
        div.textContent.includes('required')
      );
      
      expect(errorNotification).toBeDefined();
    });

    it('should show error when message is missing', () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'test@example.com';
      
      corporateWebsite.handleSubmit(event);
      
      const notifications = document.querySelectorAll('div');
      const errorNotification = Array.from(notifications).find(div => 
        div.textContent.includes('required')
      );
      
      expect(errorNotification).toBeDefined();
    });

    it('should validate email format', () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'invalid-email';
      document.getElementById('message').value = 'Test message';
      
      corporateWebsite.handleSubmit(event);
      
      const notifications = document.querySelectorAll('div');
      const errorNotification = Array.from(notifications).find(div => 
        div.textContent.includes('valid email')
      );
      
      expect(errorNotification).toBeDefined();
    });

    it('should accept valid form submission', () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'john@example.com';
      document.getElementById('message').value = 'Test message';
      
      corporateWebsite.handleSubmit(event);
      
      const notifications = document.querySelectorAll('div');
      const successNotification = Array.from(notifications).find(div => 
        div.textContent.includes('Thank you')
      );
      
      expect(successNotification).toBeDefined();
    });

    it('should reset form after successful submission', () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'john@example.com';
      document.getElementById('message').value = 'Test message';
      
      form.reset = vi.fn();
      corporateWebsite.handleSubmit(event);
      
      expect(form.reset).toHaveBeenCalled();
    });

    it('should log form submission to audit trail', () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'john@example.com';
      document.getElementById('message').value = 'Test message';
      
      corporateWebsite.handleSubmit(event);
      
      const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      const submissionLog = auditLogs.find(log => log.type === 'form_submission');
      
      expect(submissionLog).toBeDefined();
      expect(submissionLog.data.fields_submitted).toEqual(['name', 'email', 'message']);
      expect(submissionLog.data.data_processing_consent).toBe(true);
    });
  });

  describe('Accessibility Features', () => {
    it('should create skip link for keyboard navigation', () => {
      const skipLink = document.querySelector('a.skip-link');
      
      expect(skipLink).toBeDefined();
      expect(skipLink.textContent).toBe('Skip to main content');
      expect(skipLink.href).toContain('#main');
    });

    it('should show skip link on focus', () => {
      const skipLink = document.querySelector('a.skip-link');
      
      const focusEvent = new window.Event('focus');
      skipLink.dispatchEvent(focusEvent);
      
      expect(skipLink.style.top).toBe('6px');
    });

    it('should hide skip link on blur', () => {
      const skipLink = document.querySelector('a.skip-link');
      
      const blurEvent = new window.Event('blur');
      skipLink.dispatchEvent(blurEvent);
      
      expect(skipLink.style.top).toBe('-40px');
    });

    it('should add aria-invalid on invalid input', () => {
      const input = document.getElementById('name');
      
      const invalidEvent = new window.Event('invalid');
      input.dispatchEvent(invalidEvent);
      
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('should remove aria-invalid on valid input', () => {
      const input = document.getElementById('name');
      input.setAttribute('aria-invalid', 'true');
      
      Object.defineProperty(input, 'validity', {
        value: { valid: true },
        writable: true
      });
      
      const inputEvent = new window.Event('input');
      input.dispatchEvent(inputEvent);
      
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('GDPR Compliance', () => {
    it('should check for existing consent on initialization', () => {
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('GDPR compliance')
      );
    });

    it('should log when no existing consent is found', () => {
      localStorage.removeItem('gdpr_consent');
      
      // Re-trigger initialization
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('No existing consent')
      );
    });

    it('should clean up expired audit logs', () => {
      // Add old and new logs
      const oldLog = {
        id: 'old-log',
        timestamp: new Date(Date.now() - (8 * 365 * 24 * 60 * 60 * 1000)).toISOString() // 8 years old
      };
      const newLog = {
        id: 'new-log',
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('audit_logs', JSON.stringify([oldLog, newLog]));
      
      // Re-trigger initialization to run cleanup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      expect(logs.length).toBe(1);
      expect(logs[0].id).toBe('new-log');
    });
  });

  describe('User Interaction Logging', () => {
    it('should generate unique ID for each log entry', () => {
      corporateWebsite.logUserInteraction('test_event', { data: 'test' });
      corporateWebsite.logUserInteraction('test_event', { data: 'test' });
      
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      expect(logs[0].id).not.toBe(logs[1].id);
    });

    it('should include session ID in log entries', () => {
      corporateWebsite.logUserInteraction('test_event', { data: 'test' });
      
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      const lastLog = logs[logs.length - 1];
      
      expect(lastLog.session_id).toBeDefined();
      expect(lastLog.session_id).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('should maintain consistent session ID across interactions', () => {
      corporateWebsite.logUserInteraction('event1', { data: 'test1' });
      corporateWebsite.logUserInteraction('event2', { data: 'test2' });
      
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      expect(logs[logs.length - 1].session_id).toBe(logs[logs.length - 2].session_id);
    });

    it('should limit audit logs to 100 entries', () => {
      // Add 105 logs
      for (let i = 0; i < 105; i++) {
        corporateWebsite.logUserInteraction(`event_${i}`, { index: i });
      }
      
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      expect(logs.length).toBe(100);
      
      // Verify oldest logs were removed
      expect(logs[0].type).toBe('event_5');
    });

    it('should store complete log entry structure', () => {
      const testData = { action: 'test_action', value: 123 };
      corporateWebsite.logUserInteraction('test_type', testData);
      
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      const lastLog = logs[logs.length - 1];
      
      expect(lastLog).toHaveProperty('id');
      expect(lastLog).toHaveProperty('type', 'test_type');
      expect(lastLog).toHaveProperty('data', testData);
      expect(lastLog).toHaveProperty('ip_hash', 'hashed_ip');
      expect(lastLog).toHaveProperty('session_id');
      expect(lastLog).toHaveProperty('timestamp');
    });
  });

  describe('Notification System', () => {
    it('should create success notification with correct styling', () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'john@example.com';
      document.getElementById('message').value = 'Test message';
      
      const form = document.getElementById('contact-form');
      const event = new window.Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: form, writable: false });
      
      corporateWebsite.handleSubmit(event);
      
      const notifications = Array.from(document.querySelectorAll('div'));
      const successNotification = notifications.find(div => 
        div.textContent.includes('Thank you')
      );
      
      expect(successNotification).toBeDefined();
      expect(successNotification.style.backgroundColor).toContain('059669'); // Green
    });

    it('should create error notification with correct styling', () => {
      document.getElementById('email').value = 'invalid-email';
      
      const form = document.getElementById('contact-form');
      const event = new window.Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: form, writable: false });
      
      corporateWebsite.handleSubmit(event);
      
      const notifications = Array.from(document.querySelectorAll('div'));
      const errorNotification = notifications.find(div => 
        div.textContent.includes('required') || div.textContent.includes('valid email')
      );
      
      expect(errorNotification).toBeDefined();
      expect(errorNotification.style.backgroundColor).toContain('dc2626'); // Red
    });

    it('should include close button in notifications', () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'john@example.com';
      document.getElementById('message').value = 'Test message';
      
      const form = document.getElementById('contact-form');
      const event = new window.Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: form, writable: false });
      
      corporateWebsite.handleSubmit(event);
      
      const notifications = Array.from(document.querySelectorAll('div'));
      const successNotification = notifications.find(div => 
        div.textContent.includes('Thank you')
      );
      
      const closeButton = successNotification.querySelector('button');
      expect(closeButton).toBeDefined();
      expect(closeButton.textContent).toBe('×');
    });

    it('should remove notification when close button is clicked', () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'john@example.com';
      document.getElementById('message').value = 'Test message';
      
      const form = document.getElementById('contact-form');
      const event = new window.Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: form, writable: false });
      
      corporateWebsite.handleSubmit(event);
      
      const notifications = Array.from(document.querySelectorAll('div'));
      const successNotification = notifications.find(div => 
        div.textContent.includes('Thank you')
      );
      
      const closeButton = successNotification.querySelector('button');
      closeButton.click();
      
      expect(successNotification.parentNode).toBeNull();
    });

    it('should create screen reader announcement for messages', () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'john@example.com';
      document.getElementById('message').value = 'Test message';
      
      const form = document.getElementById('contact-form');
      const event = new window.Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: form, writable: false });
      
      corporateWebsite.handleSubmit(event);
      
      const announcements = Array.from(document.querySelectorAll('[aria-live]'));
      const announcement = announcements.find(el => 
        el.getAttribute('aria-live') === 'polite'
      );
      
      expect(announcement).toBeDefined();
      expect(announcement.textContent).toContain('Thank you');
    });

    it('should use assertive aria-live for error messages', () => {
      document.getElementById('email').value = 'invalid-email';
      
      const form = document.getElementById('contact-form');
      const event = new window.Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: form, writable: false });
      
      corporateWebsite.handleSubmit(event);
      
      const announcements = Array.from(document.querySelectorAll('[aria-live]'));
      const announcement = announcements.find(el => 
        el.getAttribute('aria-live') === 'assertive'
      );
      
      expect(announcement).toBeDefined();
    });
  });

  describe('UUID Generation', () => {
    it('should generate valid UUID v4 format', () => {
      corporateWebsite.logUserInteraction('test', {});
      
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      const uuid = logs[0].id;
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(uuid).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set();
      for (let i = 0; i < 100; i++) {
        corporateWebsite.logUserInteraction(`test_${i}`, {});
      }
      
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      logs.forEach(log => uuids.add(log.id));
      
      expect(uuids.size).toBe(100);
    });
  });

  describe('Session Management', () => {
    it('should create new session ID if none exists', () => {
      sessionStorage.clear();
      
      corporateWebsite.logUserInteraction('test', {});
      
      const sessionId = sessionStorage.getItem('session_id');
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('should reuse existing session ID', () => {
      const existingSessionId = 'existing-session-id';
      sessionStorage.setItem('session_id', existingSessionId);
      
      corporateWebsite.logUserInteraction('test', {});
      
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      expect(logs[0].session_id).toBe(existingSessionId);
    });
  });

  describe('Email Validation', () => {
    const testValidation = (email, shouldBeValid) => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = email;
      document.getElementById('message').value = 'Test message';
      
      const form = document.getElementById('contact-form');
      const event = new window.Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: form, writable: false });
      
      corporateWebsite.handleSubmit(event);
      
      const notifications = Array.from(document.querySelectorAll('div'));
      const hasError = notifications.some(div => 
        div.textContent.includes('valid email')
      );
      
      if (shouldBeValid) {
        expect(hasError).toBe(false);
      } else {
        expect(hasError).toBe(true);
      }
    };

    it('should accept valid email addresses', () => {
      testValidation('user@example.com', true);
      testValidation('test.user@example.co.uk', true);
      testValidation('user+tag@example.com', true);
    });

    it('should reject emails without @ symbol', () => {
      testValidation('userexample.com', false);
    });

    it('should reject emails without domain', () => {
      testValidation('user@', false);
    });

    it('should reject emails without local part', () => {
      testValidation('@example.com', false);
    });

    it('should reject emails with spaces', () => {
      testValidation('user name@example.com', false);
    });
  });

  describe('Window Exports', () => {
    it('should export corporateWebsite object to window', () => {
      expect(window.corporateWebsite).toBeDefined();
      expect(window.corporateWebsite.showMessage).toBeDefined();
      expect(window.corporateWebsite.handleSubmit).toBeDefined();
      expect(window.corporateWebsite.logUserInteraction).toBeDefined();
    });

    it('should export showMessage globally', () => {
      expect(window.showMessage).toBeDefined();
      expect(typeof window.showMessage).toBe('function');
    });
  });
});
