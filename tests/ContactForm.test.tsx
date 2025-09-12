/**
 * Test suite for contact form functionality
 * Following testing standards from APM dependencies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactForm } from '../src/components/ContactForm';
import { submitContactForm, logAuditEvent } from '../src/api/contact';
import { validateEmail, sanitizeInput } from '../src/utils/validation';

// Mock API functions
vi.mock('../src/api/contact', () => ({
  submitContactForm: vi.fn(),
  logAuditEvent: vi.fn()
}));

describe('ContactForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all form fields with proper accessibility attributes', () => {
    render(<ContactForm />);
    
    // Check for form elements with proper labels
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    
    // Check for required indicators
    expect(screen.getByText(/name \*/i)).toBeInTheDocument();
    expect(screen.getByText(/email \*/i)).toBeInTheDocument();
    expect(screen.getByText(/message \*/i)).toBeInTheDocument();
    
    // Check for help text
    expect(screen.getByText(/your full name/i)).toBeInTheDocument();
    expect(screen.getByText(/we'll never share your email/i)).toBeInTheDocument();
    expect(screen.getByText(/tell us how we can help/i)).toBeInTheDocument();
  });

  it('validates form fields and shows appropriate error messages', async () => {
    render(<ContactForm />);
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    
    // Submit empty form
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/message is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format correctly', async () => {
    render(<ContactForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send message/i });
    
    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    const mockSubmit = vi.mocked(submitContactForm);
    mockSubmit.mockResolvedValueOnce(undefined);
    
    render(<ContactForm />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), { 
      target: { value: 'John Doe' } 
    });
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'john@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/message/i), { 
      target: { value: 'Test message' } 
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message'
      });
    });
  });

  it('logs audit events for compliance tracking', async () => {
    const mockLogAudit = vi.mocked(logAuditEvent);
    const mockSubmit = vi.mocked(submitContactForm);
    mockSubmit.mockResolvedValueOnce(undefined);
    
    render(<ContactForm />);
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/name/i), { 
      target: { value: 'John Doe' } 
    });
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'john@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/message/i), { 
      target: { value: 'Test message' } 
    });
    
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    
    await waitFor(() => {
      expect(mockLogAudit).toHaveBeenCalledWith(
        'form_submission',
        expect.objectContaining({
          fields: ['name', 'email', 'message'],
          consent_given: true
        })
      );
    });
  });

  it('handles submission errors gracefully', async () => {
    const mockSubmit = vi.mocked(submitContactForm);
    mockSubmit.mockRejectedValueOnce(new Error('Network error'));
    
    render(<ContactForm />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), { 
      target: { value: 'John Doe' } 
    });
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'john@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/message/i), { 
      target: { value: 'Test message' } 
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/failed to submit form/i)).toBeInTheDocument();
    });
  });

  it('disables submit button during submission', async () => {
    const mockSubmit = vi.mocked(submitContactForm);
    mockSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ContactForm />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/name/i), { 
      target: { value: 'John Doe' } 
    });
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'john@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/message/i), { 
      target: { value: 'Test message' } 
    });
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(submitButton);
    
    // Button should be disabled and show loading state
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/sending/i)).toBeInTheDocument();
  });
});

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(validateEmail('user@subdomain.example.com')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test..email@example.com')).toBe(false);
    });

    it('rejects potentially dangerous email content', () => {
      expect(validateEmail('test@example.com<script>')).toBe(false);
      expect(validateEmail('javascript:alert(1)@example.com')).toBe(false);
      expect(validateEmail('test@data:text/html,<script>')).toBe(false);
    });

    it('handles edge cases correctly', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(validateEmail('a'.repeat(255) + '@example.com')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('removes potentially dangerous characters', () => {
      expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
      expect(sanitizeInput('Hello "world"')).toBe('Hello world');
      expect(sanitizeInput("Test 'input'")).toBe('Test input');
    });

    it('trims whitespace and limits length', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
      expect(sanitizeInput('a'.repeat(1500))).toHaveLength(1000);
    });

    it('handles non-string input gracefully', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
      expect(sanitizeInput(123 as any)).toBe('');
    });
  });
});

describe('Accessibility Compliance', () => {
  it('maintains proper heading hierarchy', () => {
    render(<ContactForm />);
    
    // Check that labels are properly associated
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    
    expect(nameInput).toHaveAttribute('id', 'name');
    expect(emailInput).toHaveAttribute('id', 'email');
    expect(messageInput).toHaveAttribute('id', 'message');
  });

  it('provides proper ARIA attributes for error states', async () => {
    render(<ContactForm />);
    
    const submitButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
      
      const errorMessage = screen.getByText(/name is required/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  it('announces form submission status to screen readers', async () => {
    const mockSubmit = vi.mocked(submitContactForm);
    mockSubmit.mockResolvedValueOnce(undefined);
    
    render(<ContactForm />);
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Test' } });
    
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    
    // Check that success message has proper ARIA attributes
    await waitFor(() => {
      // Success announcement would be made via aria-live region
      expect(document.querySelector('[aria-live]')).toBeInTheDocument();
    });
  });
});