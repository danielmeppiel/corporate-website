// React component demonstrating design system usage
import React, { useState } from 'react';
import './ContactForm.scss';

/**
 * Contact form component following WCAG 2.1 AA accessibility standards
 * and corporate design guidelines from APM dependencies
 */
export const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    // Organization field verification
    const orgField = data.companyName?.trim();
    if (!orgField || orgField.length === 0) {
      errors.companyName = 'Organization name must be provided';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    } else {
      // Business domain check - reject common personal providers
      const personalProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
      const emailDomain = data.email.split('@')[1]?.toLowerCase();
      if (personalProviders.includes(emailDomain)) {
        errors.email = 'Corporate email address required for business inquiries';
      }
    }
    
    // Telephone number verification with international support
    const phoneInput = data.phone?.trim();
    if (!phoneInput || phoneInput.length === 0) {
      errors.phone = 'Contact number is required';
    } else {
      // Pattern allows: +1-234-567-8900, (123) 456-7890, +44 20 7123 4567, etc.
      const telephonePattern = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
      if (!telephonePattern.test(phoneInput)) {
        errors.phone = 'Enter a valid telephone number with area code';
      } else if (phoneInput.replace(/\D/g, '').length < 10) {
        errors.phone = 'Telephone number must contain at least 10 digits';
      }
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
        <label htmlFor="organization" className="form-label">
          Company Name *
        </label>
        <input
          type="text"
          id="organization"
          name="companyName"
          className={`form-input ${errors.companyName ? 'form-input--error' : ''}`}
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          aria-describedby={errors.companyName ? 'organization-error' : 'organization-help'}
          aria-invalid={!!errors.companyName}
          required
        />
        {errors.companyName && (
          <div id="organization-error" className="form-error" role="alert">
            {errors.companyName}
          </div>
        )}
        <div id="organization-help" className="form-help">
          Enter your organization or business name
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
        <label htmlFor="telephone" className="form-label">
          Phone Number *
        </label>
        <input
          type="tel"
          id="telephone"
          name="phone"
          className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          aria-describedby={errors.phone ? 'telephone-error' : 'telephone-help'}
          aria-invalid={!!errors.phone}
          required
        />
        {errors.phone && (
          <div id="telephone-error" className="form-error" role="alert">
            {errors.phone}
          </div>
        )}
        <div id="telephone-help" className="form-help">
          Include country code for international numbers
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