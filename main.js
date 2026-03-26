// Corporate Website JavaScript - Demonstrating APM Compliance Standards

/**
 * Main application entry point
 * Follows compliance guidelines for data handling and accessibility
 */

const COOKIE_CONSENT_KEY = 'gdpr_cookie_consent';
const RECAPTCHA_SITE_KEY = window.RECAPTCHA_SITE_KEY || '';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Corporate Website initialized with APM standards');
  initializeAccessibility();
  initializeGDPRCompliance();
});

/**
 * Show welcome message - demonstrates user interaction logging for audit trails
 */
function showMessage() {
  // Log user interaction (compliance requirement for audit trails)
  logUserInteraction('cta_button_click', {
    timestamp: new Date().toISOString(),
    action: 'hero_cta_clicked',
    user_agent: navigator.userAgent.substring(0, 100) // Truncated for privacy
  });

  alert('🎉 Welcome! This site is built with APM dependencies for compliance and design standards.');
}

/**
 * Handle contact form submission with GDPR compliance
 * @param {Event} event - Form submission event
 */
async function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const privacyConsent = formData.get('privacyConsent') === 'on';

  // Validate privacy consent (GDPR requirement)
  if (!privacyConsent) {
    showError('You must agree to the privacy policy to submit this form.');
    return;
  }

  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    timestamp: new Date().toISOString(),
    consent_given: privacyConsent
  };

  // Validate required fields
  if (!data.name || !data.email || !data.message) {
    showError('All fields are required. Please complete the form.');
    return;
  }

  // Email validation (basic)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    showError('Please enter a valid email address.');
    return;
  }

  // Obtain reCAPTCHA v3 token for bot protection
  let recaptchaToken = '';
  if (window.grecaptcha && RECAPTCHA_SITE_KEY) {
    try {
      await new Promise((resolve) => window.grecaptcha.ready(resolve));
      recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'contact_form' });
    } catch (err) {
      console.warn('reCAPTCHA token could not be obtained:', err);
    }
  }

  data.recaptchaToken = recaptchaToken;

  // Log form submission for compliance audit trail
  logUserInteraction('form_submission', {
    timestamp: data.timestamp,
    fields_submitted: ['name', 'email', 'message'],
    data_processing_consent: data.consent_given
  });

  // Simulate form submission
  showSuccess('Thank you for your message! We\'ll get back to you soon.');
  event.target.reset();
}

/**
 * Initialize accessibility features
 * Following design-guidelines package standards
 */
function initializeAccessibility() {
  // Add skip link for keyboard navigation
  const skipLink = document.createElement('a');
  skipLink.href = '#main';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #2563eb;
    color: white;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    transition: top 0.3s;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);

  // Enhance form accessibility
  const formInputs = document.querySelectorAll('input, textarea');
  formInputs.forEach(input => {
    // Add aria-invalid for validation states
    input.addEventListener('invalid', () => {
      input.setAttribute('aria-invalid', 'true');
    });
    
    input.addEventListener('input', () => {
      if (input.validity.valid) {
        input.removeAttribute('aria-invalid');
      }
    });
  });

  console.log('♿ Accessibility features initialized');
}

/**
 * Initialize GDPR compliance features
 * Following compliance-rules package standards
 */
function initializeGDPRCompliance() {
  // Check for existing cookie consent
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);

  if (!consent) {
    // Show cookie consent banner on first visit
    showCookieConsent();
  }

  // Set up data retention policy (7 years for audit logs)
  const retentionPolicy = {
    audit_logs: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years in milliseconds
    user_interactions: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year
    performance_logs: 30 * 24 * 60 * 60 * 1000 // 30 days
  };

  // Clean up old data based on retention policy
  cleanupExpiredData(retentionPolicy);

  console.log('🔒 GDPR compliance features initialized');
}

/**
 * Show the cookie consent banner
 */
function showCookieConsent() {
  const banner = document.getElementById('cookie-consent-banner');
  if (!banner) return;

  banner.innerHTML = `
    <div class="cookie-consent__content">
      <h2 id="cookie-consent-title" class="cookie-consent__title">Cookie Preferences</h2>
      <p id="cookie-consent-description" class="cookie-consent__description">
        We use cookies to improve your experience. Please choose which cookies you allow.
        For more information, see our <a href="/privacy-policy" rel="noopener noreferrer">privacy policy</a>.
      </p>
      <div class="cookie-consent__actions">
        <button type="button" class="submit-button" onclick="acceptAllCookies()">Accept All</button>
        <button type="button" class="btn-secondary" onclick="acceptNecessaryCookiesOnly()">Necessary Only</button>
      </div>
    </div>
  `;
  banner.style.display = 'block';
  banner.removeAttribute('aria-hidden');
}

/**
 * Accept all cookie categories
 */
function acceptAllCookies() {
  saveCookieConsent({ necessary: true, analytics: true, marketing: true });
}

/**
 * Accept only strictly necessary cookies
 */
function acceptNecessaryCookiesOnly() {
  saveCookieConsent({ necessary: true, analytics: false, marketing: false });
}

/**
 * Save cookie consent preferences
 * @param {Object} preferences - Cookie preference categories
 */
function saveCookieConsent(preferences) {
  const consentRecord = {
    ...preferences,
    necessary: true, // Always required
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentRecord));

  logUserInteraction('cookie_consent_given', {
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    timestamp: consentRecord.timestamp
  });

  const banner = document.getElementById('cookie-consent-banner');
  if (banner) {
    banner.style.display = 'none';
    banner.setAttribute('aria-hidden', 'true');
  }
  console.log('🍪 Cookie preferences saved');
}

/**
 * Log user interactions for compliance audit trail
 * @param {string} eventType - Type of interaction
 * @param {Object} eventData - Event details
 */
function logUserInteraction(eventType, eventData) {
  const logEntry = {
    id: generateUUID(),
    type: eventType,
    data: eventData,
    ip_hash: 'hashed_ip', // In real app, hash the IP for privacy
    session_id: getSessionId(),
    timestamp: new Date().toISOString()
  };

  // Store in localStorage for demo (in production, would send to secure backend)
  const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
  logs.push(logEntry);
  
  // Keep only last 100 entries for demo
  if (logs.length > 100) {
    logs.shift();
  }
  
  localStorage.setItem('audit_logs', JSON.stringify(logs));
  console.log('📊 User interaction logged:', eventType);
}

/**
 * Clean up expired data based on retention policy
 * @param {Object} retentionPolicy - Retention periods for different data types
 */
function cleanupExpiredData(retentionPolicy) {
  const now = Date.now();
  
  // Clean up audit logs
  const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
  const validLogs = auditLogs.filter(log => {
    const logAge = now - new Date(log.timestamp).getTime();
    return logAge < retentionPolicy.audit_logs;
  });
  
  if (validLogs.length !== auditLogs.length) {
    localStorage.setItem('audit_logs', JSON.stringify(validLogs));
    console.log(`🗑️ Cleaned up ${auditLogs.length - validLogs.length} expired audit logs`);
  }
}

/**
 * Generate UUID for log entries
 * @returns {string} UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get or create session ID
 * @returns {string} Session ID
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

/**
 * Show success message with accessibility support
 * @param {string} message - Success message
 */
function showSuccess(message) {
  const notification = createNotification(message, 'success');
  document.body.appendChild(notification);
  
  // Announce to screen readers
  announceToScreenReader(message);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

/**
 * Show error message with accessibility support
 * @param {string} message - Error message
 */
function showError(message) {
  const notification = createNotification(message, 'error');
  document.body.appendChild(notification);
  
  // Announce to screen readers
  announceToScreenReader(message, 'assertive');
  
  // Auto-remove after 7 seconds (longer for errors)
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 7000);
}

/**
 * Create notification element
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error)
 * @returns {HTMLElement} Notification element
 */
function createNotification(message, type) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 1000;
    max-width: 400px;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    background-color: ${type === 'success' ? '#059669' : '#dc2626'};
  `;
  
  // Add close button for accessibility
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    float: right;
    margin-left: 16px;
    cursor: pointer;
    line-height: 1;
  `;
  
  closeButton.addEventListener('click', () => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });
  
  notification.appendChild(closeButton);
  return notification;
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Announcement priority (polite, assertive)
 */
function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  // Remove after announcement
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, 1000);
}

// Export functions for potential testing or external use
window.corporateWebsite = {
  showMessage,
  handleSubmit,
  logUserInteraction,
  showCookieConsent,
  acceptAllCookies,
  acceptNecessaryCookiesOnly
};

// Make functions globally available (for inline event handlers)
window.showMessage = showMessage;
window.handleSubmit = handleSubmit;
window.showCookieConsent = showCookieConsent;
window.acceptAllCookies = acceptAllCookies;
window.acceptNecessaryCookiesOnly = acceptNecessaryCookiesOnly;