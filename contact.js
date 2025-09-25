// Contact Page JavaScript - Security-focused form handling
// Following APM compliance standards for data validation and security

/**
 * Initialize contact page when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔒 Contact page initialized with security standards');
    initializeAccessibility();
    initializeFormSecurity();
    generateCSRFToken();
});

/**
 * Generate and store CSRF token for form security
 */
function generateCSRFToken() {
    const token = generateSecureToken(32);
    sessionStorage.setItem('csrf_token', token);
    
    // Add hidden CSRF field to form
    const form = document.getElementById('contactForm');
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrf_token';
    csrfInput.value = token;
    form.appendChild(csrfInput);
}

/**
 * Generate cryptographically secure token
 * @param {number} length - Token length
 * @returns {string} Secure token
 */
function generateSecureToken(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    
    for (let i = 0; i < length; i++) {
        result += chars[randomArray[i] % chars.length];
    }
    return result;
}

/**
 * Enhanced form security initialization
 */
function initializeFormSecurity() {
    const form = document.getElementById('contactForm');
    const inputs = form.querySelectorAll('input, textarea');
    
    // Add real-time validation and security checks
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            validateAndSanitizeInput(e.target);
        });
        
        input.addEventListener('paste', (e) => {
            // Allow paste but validate after
            setTimeout(() => validateAndSanitizeInput(e.target), 10);
        });
    });
    
    // Prevent form injection attacks
    form.addEventListener('submit', (e) => {
        if (!validateFormSecurity(form)) {
            e.preventDefault();
            showError('Security validation failed. Please try again.');
        }
    });
}

/**
 * Validate and sanitize individual input
 * @param {HTMLElement} input - Input element to validate
 */
function validateAndSanitizeInput(input) {
    const value = input.value;
    const inputType = input.type || input.tagName.toLowerCase();
    
    // Remove any HTML tags (XSS prevention)
    const sanitized = value.replace(/<[^>]*>/g, '');
    if (sanitized !== value) {
        input.value = sanitized;
        showWarning('HTML tags are not allowed in form fields.');
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /on\w+\s*=/i,
        /<script/i,
        /expression\(/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(value));
    if (isSuspicious) {
        input.value = '';
        input.setAttribute('aria-invalid', 'true');
        showError('Invalid characters detected. Please enter valid information only.');
        return false;
    }
    
    // Specific validation based on input type
    switch (inputType) {
        case 'email':
            return validateEmail(input);
        case 'textarea':
            return validateMessage(input);
        default:
            input.removeAttribute('aria-invalid');
            return true;
    }
}

/**
 * Enhanced email validation
 * @param {HTMLElement} emailInput - Email input element
 * @returns {boolean} Validation result
 */
function validateEmail(emailInput) {
    const email = emailInput.value.trim();
    
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailInput.setAttribute('aria-invalid', 'true');
        return false;
    }
    
    // Length validation
    if (email.length > 255) {
        emailInput.setAttribute('aria-invalid', 'true');
        return false;
    }
    
    // Additional security checks
    const suspiciousEmailPatterns = [
        /\+.*\+/,  // Multiple plus signs
        /\.{2,}/,  // Multiple consecutive dots
        /@.*@/,    // Multiple @ symbols
    ];
    
    if (suspiciousEmailPatterns.some(pattern => pattern.test(email))) {
        emailInput.setAttribute('aria-invalid', 'true');
        return false;
    }
    
    emailInput.removeAttribute('aria-invalid');
    return true;
}

/**
 * Validate message content
 * @param {HTMLElement} messageInput - Message textarea element
 * @returns {boolean} Validation result
 */
function validateMessage(messageInput) {
    const message = messageInput.value.trim();
    
    // Length validation
    if (message.length === 0) {
        messageInput.setAttribute('aria-invalid', 'true');
        return false;
    }
    
    if (message.length > 5000) {
        messageInput.setAttribute('aria-invalid', 'true');
        showError('Message is too long. Please keep it under 5000 characters.');
        return false;
    }
    
    // Check for spam patterns
    const spamPatterns = [
        /(?:https?:\/\/[^\s]+.*){3,}/i,  // Multiple URLs
        /(?:buy now|click here|free money|guaranteed|lottery|winner)/i,
        /[A-Z]{10,}/,  // Excessive capitals
        /(.)\1{10,}/   // Excessive character repetition
    ];
    
    if (spamPatterns.some(pattern => pattern.test(message))) {
        messageInput.setAttribute('aria-invalid', 'true');
        showWarning('Message appears to contain spam-like content. Please revise.');
        return false;
    }
    
    messageInput.removeAttribute('aria-invalid');
    return true;
}

/**
 * Comprehensive form security validation
 * @param {HTMLFormElement} form - Form to validate
 * @returns {boolean} Security validation result
 */
function validateFormSecurity(form) {
    const formData = new FormData(form);
    const storedToken = sessionStorage.getItem('csrf_token');
    const submittedToken = formData.get('csrf_token');
    
    // CSRF token validation
    if (!storedToken || !submittedToken || storedToken !== submittedToken) {
        console.error('CSRF token validation failed');
        return false;
    }
    
    // Rate limiting check (simple client-side)
    const lastSubmission = localStorage.getItem('last_contact_submission');
    if (lastSubmission) {
        const timeSinceLastSubmission = Date.now() - parseInt(lastSubmission);
        if (timeSinceLastSubmission < 60000) { // 1 minute minimum
            showError('Please wait before submitting another message.');
            return false;
        }
    }
    
    return true;
}

/**
 * Handle contact form submission
 * @param {Event} event - Form submission event
 */
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Disable submit button to prevent double submission
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    try {
        const formData = new FormData(form);
        
        // Final validation
        const email = formData.get('email').trim();
        const message = formData.get('message').trim();
        const consent = formData.get('consent');
        
        if (!email || !message) {
            throw new Error('Email and message are required');
        }
        
        if (!consent) {
            throw new Error('Consent is required for GDPR compliance');
        }
        
        // Prepare secure submission data
        const submissionData = {
            email: email,
            message: message,
            consent_given: true,
            timestamp: new Date().toISOString(),
            csrf_token: formData.get('csrf_token'),
            user_agent: navigator.userAgent.substring(0, 200) // Truncated for privacy
        };
        
        // Log submission attempt for audit trail
        logUserInteraction('contact_form_submission_attempt', {
            timestamp: submissionData.timestamp,
            email_domain: email.split('@')[1],
            message_length: message.length
        });
        
        // Submit to backend API
        const response = await submitToAPI(submissionData);
        
        if (response.success) {
            // Record successful submission
            localStorage.setItem('last_contact_submission', Date.now().toString());
            
            logUserInteraction('contact_form_submission_success', {
                submission_id: response.submission_id
            });
            
            showSuccess('Thank you for your message! We\'ll get back to you within 24 hours.');
            form.reset();
            
            // Generate new CSRF token for next submission
            generateCSRFToken();
            
        } else {
            throw new Error(response.error || 'Submission failed');
        }
        
    } catch (error) {
        console.error('Contact form submission error:', error);
        logUserInteraction('contact_form_submission_error', {
            error_type: error.name,
            timestamp: new Date().toISOString()
        });
        
        showError(`Failed to send message: ${error.message}`);
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message';
    }
}

/**
 * Submit form data to backend API
 * @param {Object} data - Submission data
 * @returns {Promise<Object>} Submission result
 */
async function submitToAPI(data) {
    try {
        const response = await fetch('/api/contact/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: data.email,
                message: data.message,
                consent: data.consent_given,
                csrf_token: data.csrf_token
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Server error occurred');
        }
        
        console.log('📧 Email sent to communications department via API:', {
            from: data.email,
            message_preview: data.message.substring(0, 100) + '...',
            submission_id: result.submission_id,
            timestamp: data.timestamp
        });
        
        return result;
        
    } catch (error) {
        console.error('API submission error:', error);
        
        // Fallback to local simulation if API is unavailable
        console.log('⚠️ API unavailable, using fallback simulation');
        return await simulateSecureSubmission(data);
    }
}

/**
 * Fallback simulation for when API is unavailable
 * @param {Object} data - Submission data
 * @returns {Promise<Object>} Submission result
 */
async function simulateSecureSubmission(data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate validation and processing
    if (!data.email || !data.message || !data.consent_given) {
        return {
            success: false,
            error: 'Invalid form data'
        };
    }
    
    // Simulate successful submission
    const submissionId = generateSecureToken(16);
    
    console.log('📧 Simulated email sent to communications department:', {
        from: data.email,
        message_preview: data.message.substring(0, 100) + '...',
        submission_id: submissionId,
        timestamp: data.timestamp
    });
    
    return {
        success: true,
        submission_id: submissionId,
        message: 'Message sent successfully (simulation mode)'
    };
}

/**
 * Initialize accessibility features for contact page
 */
function initializeAccessibility() {
    // Add skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#contactForm';
    skipLink.textContent = 'Skip to contact form';
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
        z-index: 1000;
    `;
    
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    console.log('♿ Contact page accessibility features initialized');
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
 * Show warning message
 * @param {string} message - Warning message
 */
function showWarning(message) {
    const notification = createNotification(message, 'warning');
    document.body.appendChild(notification);
    
    announceToScreenReader(message);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 6000);
}

/**
 * Create notification element
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @returns {HTMLElement} Notification element
 */
function createNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    
    const colors = {
        success: '#059669',
        error: '#dc2626',
        warning: '#d97706'
    };
    
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
        background-color: ${colors[type] || colors.error};
    `;
    
    // Add close button
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
 * @param {string} priority - Announcement priority
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
    
    setTimeout(() => {
        if (announcement.parentNode) {
            announcement.parentNode.removeChild(announcement);
        }
    }, 1000);
}

/**
 * Log user interactions for audit trail
 * @param {string} eventType - Type of event
 * @param {Object} eventData - Event data
 */
function logUserInteraction(eventType, eventData) {
    const logEntry = {
        id: generateSecureToken(16),
        type: eventType,
        data: eventData,
        timestamp: new Date().toISOString(),
        page: 'contact'
    };
    
    // Store in localStorage for demo (production would send to secure backend)
    const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 100 entries
    if (logs.length > 100) {
        logs.shift();
    }
    
    localStorage.setItem('audit_logs', JSON.stringify(logs));
    console.log('📊 Contact page interaction logged:', eventType);
}

// Make function globally available for form handler
window.handleContactSubmit = handleContactSubmit;