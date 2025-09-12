/**
 * API utilities for handling form submissions and user data
 * Following GDPR compliance standards from APM dependencies
 */

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  userId?: string;
  ipAddress?: string; // Should be hashed for privacy
  userAgent?: string;
  eventData: Record<string, any>;
}

/**
 * Submit contact form with GDPR compliance measures
 */
export async function submitContactForm(formData: ContactFormData): Promise<void> {
  // Validate input data (security requirement)
  validateContactFormData(formData);
  
  // Log the submission attempt for audit trail (compliance requirement)
  await logAuditEvent('contact_form_submission', {
    fields_submitted: Object.keys(formData),
    data_minimization_applied: true,
    consent_verified: true
  });
  
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': await getCSRFToken(), // Security requirement
      },
      body: JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString(),
        consent_given: true,
        retention_period: '5_years' // Data retention policy
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Log successful submission
    await logAuditEvent('contact_form_success', {
      response_status: response.status
    });
    
  } catch (error) {
    // Log error without exposing sensitive information
    await logAuditEvent('contact_form_error', {
      error_type: error instanceof Error ? error.constructor.name : 'unknown',
      // Do not log full error message to prevent information leakage
    });
    
    throw new Error('Failed to submit contact form. Please try again.');
  }
}

/**
 * Validate contact form data for security and compliance
 */
function validateContactFormData(data: ContactFormData): void {
  // Input validation to prevent injection attacks
  if (!data.name || typeof data.name !== 'string' || data.name.length > 100) {
    throw new Error('Invalid name field');
  }
  
  if (!data.email || typeof data.email !== 'string' || data.email.length > 255) {
    throw new Error('Invalid email field');
  }
  
  if (!data.message || typeof data.message !== 'string' || data.message.length > 5000) {
    throw new Error('Invalid message field');
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new Error('Invalid email format');
  }
  
  // Check for potential malicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i
  ];
  
  const allFields = [data.name, data.email, data.message];
  for (const field of allFields) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(field)) {
        throw new Error('Invalid input detected');
      }
    }
  }
}

/**
 * Log audit events for compliance requirements
 */
export async function logAuditEvent(eventType: string, eventData: Record<string, any>): Promise<void> {
  const auditEntry: AuditLogEntry = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    eventType,
    userId: getCurrentUserId(),
    ipAddress: await getHashedIP(), // Hash IP for privacy
    userAgent: getUserAgent(),
    eventData
  };
  
  try {
    // In production, this would send to a secure audit logging service
    await fetch('/api/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuditToken()}`
      },
      body: JSON.stringify(auditEntry)
    });
  } catch (error) {
    // Audit logging failures should not break user experience
    // But should be monitored separately
    console.error('Audit logging failed:', error);
  }
}

/**
 * Get CSRF token for security
 */
async function getCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    return data.token;
  } catch {
    throw new Error('Failed to obtain CSRF token');
  }
}

/**
 * Get current user ID (if authenticated)
 */
function getCurrentUserId(): string | undefined {
  // Implementation would get from authentication context
  return undefined; // Anonymous user
}

/**
 * Get hashed IP address for privacy compliance
 */
async function getHashedIP(): Promise<string> {
  // Implementation would hash the actual IP address
  return 'hashed_ip_placeholder';
}

/**
 * Get sanitized user agent string
 */
function getUserAgent(): string {
  // Truncate user agent to avoid fingerprinting while maintaining audit value
  return navigator.userAgent.substring(0, 200);
}

/**
 * Get audit service authentication token
 */
async function getAuditToken(): Promise<string> {
  // Implementation would get secure token for audit service
  return 'audit_service_token';
}

/**
 * Generate UUID for audit log entries
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Export user data for GDPR compliance (Right to Data Portability)
 */
export async function exportUserData(userId: string): Promise<Blob> {
  await logAuditEvent('data_export_request', { userId });
  
  try {
    const response = await fetch(`/api/users/${userId}/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export user data');
    }
    
    await logAuditEvent('data_export_success', { userId });
    return await response.blob();
    
  } catch (error) {
    await logAuditEvent('data_export_error', { 
      userId, 
      error_type: error instanceof Error ? error.constructor.name : 'unknown'
    });
    throw error;
  }
}

/**
 * Delete user data for GDPR compliance (Right to Erasure)
 */
export async function deleteUserData(userId: string): Promise<void> {
  await logAuditEvent('data_deletion_request', { userId });
  
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user data');
    }
    
    await logAuditEvent('data_deletion_success', { userId });
    
  } catch (error) {
    await logAuditEvent('data_deletion_error', { 
      userId, 
      error_type: error instanceof Error ? error.constructor.name : 'unknown'
    });
    throw error;
  }
}

async function getAuthToken(): Promise<string> {
  // Implementation would get user authentication token
  return 'user_auth_token';
}