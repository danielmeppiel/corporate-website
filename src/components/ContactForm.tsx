// React component demonstrating design system usage
import React, { useState } from 'react';
import './ContactForm.scss';

/**
 * Contact form component following WCAG 2.1 AA accessibility standards
 * and corporate design guidelines from APM dependencies
 */

/**
 * Contact form for collecting a user's name, email, and message.
 *
 * @remarks
 * - Uses `<label htmlFor>` with matching `id` for each field.
 * - Uses `aria-invalid`, `aria-describedby`, and `role="alert"` so
 *   screen readers can announce errors and help text.
 * - Relies on native HTML form semantics for keyboard navigation
 *   (Tab to move, Enter to submit), meeting WCAG form basics.
 *
 * @example
 * ```
 * <ContactForm />
 * ```
 */

export const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles form submit: validates data, logs the event, and sends it.
   *
   * @remarks
   * - If validation fails, sets field errors and skips logging/submission.
   * - If validation passes, logs the event for compliance and then calls
   *   {@link submitContactForm}.
   */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form data (compliance requirement)
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Log user interaction for audit trail (compliance requirement)
      await logUserInteraction('form_submission', {
        fields: Object.keys(formData),
        timestamp: new Date().toISOString(),
        consent_given: true
      });

      // Submit form data
      await submitContactForm(formData);
      
      // Reset form and show success
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
      
    } catch (error) {
      setErrors({ submit: 'Failed to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (data) => {
    const errors = {};
    
    if (!data.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!data.message.trim()) {
      errors.message = 'Message is required';
    }
    
    return errors;
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className={`form-input ${errors.name ? 'form-input--error' : ''}`}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          aria-describedby={errors.name ? 'name-error' : 'name-help'}
          aria-invalid={!!errors.name}
          required
        />
        {errors.name && (
          <div id="name-error" className="form-error" role="alert">
            {errors.name}
          </div>
        )}
        <div id="name-help" className="form-help">
          Your full name
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form-input ${errors.email ? 'form-input--error' : ''}`}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          aria-describedby={errors.email ? 'email-error' : 'email-help'}
          aria-invalid={!!errors.email}
          required
        />
        {errors.email && (
          <div id="email-error" className="form-error" role="alert">
            {errors.email}
          </div>
        )}
        <div id="email-help" className="form-help">
          We'll never share your email with anyone else
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="message" className="form-label">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={`form-textarea ${errors.message ? 'form-textarea--error' : ''}`}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          aria-describedby={errors.message ? 'message-error' : 'message-help'}
          aria-invalid={!!errors.message}
          required
        />
        {errors.message && (
          <div id="message-error" className="form-error" role="alert">
            {errors.message}
          </div>
        )}
        <div id="message-help" className="form-help">
          Tell us how we can help you
        </div>
      </div>

      {errors.submit && (
        <div className="form-error form-error--global" role="alert">
          {errors.submit}
        </div>
      )}

      <button
        type="submit"
        className="btn btn--primary"
        disabled={isSubmitting}
        aria-describedby="submit-help"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
      <div id="submit-help" className="form-help">
        By submitting this form, you agree to our privacy policy
      </div>
    </form>
  );
};

// Helper functions for compliance

/**
 * Logs a user action for compliance / audit.
 *
 * @param eventType - Type of event, for example `"form_submission"`.
 * @param eventData - Extra data such as fields and timestamp.
 */

async function logUserInteraction(eventType, eventData) {
  // Implementation would send to secure backend
  console.log('Audit log:', { eventType, eventData });
}

async function submitContactForm(formData) {
  // Implementation would handle secure submission
  return fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
}