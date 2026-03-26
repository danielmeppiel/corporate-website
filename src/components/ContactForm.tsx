// React component demonstrating design system usage
import React, { useState } from 'react';
import { submitContactForm, logAuditEvent } from '../api/contact';
import { useRecaptcha } from '../hooks/useRecaptcha';
import './ContactForm.scss';

/**
 * Contact form component following WCAG 2.1 AA accessibility standards,
 * GDPR compliance (privacy consent, reCAPTCHA), and corporate design guidelines
 */
export const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    privacyConsent: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { executeRecaptcha } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Obtain reCAPTCHA v3 token for bot protection
      const recaptchaToken = await executeRecaptcha('contact_form');

      // Log user interaction for audit trail (compliance requirement)
      await logAuditEvent('form_submission', {
        fields: ['name', 'email', 'message'],
        timestamp: new Date().toISOString(),
        consent_given: formData.privacyConsent
      });

      // Submit form data with consent and reCAPTCHA token
      await submitContactForm({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        consent_given: formData.privacyConsent,
        recaptchaToken
      });

      // Reset form and show success
      setFormData({ name: '', email: '', message: '', privacyConsent: false });
      setErrors({});
      setIsSuccess(true);

    } catch (error) {
      setErrors({ submit: 'Failed to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (data: typeof formData) => {
    const errs: Record<string, string> = {};

    if (!data.name.trim()) {
      errs.name = 'Name is required';
    }

    if (!data.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!data.message.trim()) {
      errs.message = 'Message is required';
    }

    if (!data.privacyConsent) {
      errs.privacyConsent = 'You must agree to the privacy policy to continue';
    }

    return errs;
  };

  if (isSuccess) {
    return (
      <div className="contact-form-success" role="status" aria-live="polite">
        <p>Thank you for your message! We'll get back to you soon.</p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setIsSuccess(false)}
        >
          Send another message
        </button>
      </div>
    );
  }

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

      <div className="form-group">
        <div className="form-checkbox">
          <input
            type="checkbox"
            id="privacyConsent"
            name="privacyConsent"
            checked={formData.privacyConsent}
            onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
            aria-describedby={errors.privacyConsent ? 'privacyConsent-error' : 'privacyConsent-help'}
            aria-invalid={!!errors.privacyConsent}
            aria-required="true"
          />
          <label htmlFor="privacyConsent" className="form-label form-label--inline">
            I agree to the{' '}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
              privacy policy
            </a>{' '}
            and consent to the processing of my personal data *
          </label>
        </div>
        {errors.privacyConsent && (
          <div id="privacyConsent-error" className="form-error" role="alert">
            {errors.privacyConsent}
          </div>
        )}
        <div id="privacyConsent-help" className="form-help">
          Required for GDPR compliance. Your data will be handled per our privacy policy.
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
        This form is protected by reCAPTCHA. By submitting, you confirm agreement to our privacy policy.
      </div>
    </form>
  );
};
