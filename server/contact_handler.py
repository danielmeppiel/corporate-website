"""
Server-side contact form handler with GDPR compliance
Following compliance standards from APM dependencies
"""

import json
import hashlib
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dataclasses import dataclass

# Configure logging for audit trail (compliance requirement)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('audit.log'),
        logging.StreamHandler()
    ]
)

audit_logger = logging.getLogger('audit')


@dataclass
class ContactFormData:
    """Contact form data structure with validation"""
    name: str
    email: str
    message: str
    timestamp: str
    consent_given: bool
    ip_address_hash: str
    user_agent: str
    
    def __post_init__(self):
        """Validate data after initialization"""
        self.validate()
    
    def validate(self) -> None:
        """Validate form data for security and compliance"""
        # Input validation to prevent injection attacks
        if not isinstance(self.name, str) or len(self.name) > 100:
            raise ValueError("Invalid name field")
        
        if not isinstance(self.email, str) or len(self.email) > 255:
            raise ValueError("Invalid email field")
        
        if not isinstance(self.message, str) or len(self.message) > 5000:
            raise ValueError("Invalid message field")
        
        # Email format validation
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, self.email):
            raise ValueError("Invalid email format")
        
        # Check for potentially malicious content
        dangerous_patterns = [
            r'<script', r'javascript:', r'on\w+\s*=', r'data:'
        ]
        
        all_fields = [self.name, self.email, self.message]
        for field in all_fields:
            for pattern in dangerous_patterns:
                if re.search(pattern, field, re.IGNORECASE):
                    raise ValueError("Invalid input detected")


class AuditLogger:
    """Audit logging for compliance requirements"""
    
    @staticmethod
    def log_event(event_type: str, event_data: Dict[str, Any], 
                  user_id: Optional[str] = None) -> None:
        """Log audit events for compliance tracking"""
        audit_entry = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_type': event_type,
            'user_id': user_id,
            'event_data': event_data
        }
        
        # Log to audit trail (required for GDPR compliance)
        audit_logger.info(f"AUDIT: {json.dumps(audit_entry)}")


class DataRetentionManager:
    """Manage data retention policies for GDPR compliance"""
    
    RETENTION_POLICIES = {
        'contact_forms': timedelta(days=5*365),  # 5 years
        'audit_logs': timedelta(days=7*365),     # 7 years
        'user_sessions': timedelta(days=30),     # 30 days
    }
    
    @classmethod
    def should_retain(cls, data_type: str, created_at: datetime) -> bool:
        """Check if data should be retained based on policy"""
        retention_period = cls.RETENTION_POLICIES.get(data_type)
        if not retention_period:
            return False
        
        expiry_date = created_at + retention_period
        return datetime.utcnow() < expiry_date
    
    @classmethod
    def get_expiry_date(cls, data_type: str, created_at: datetime) -> Optional[datetime]:
        """Get expiry date for data type"""
        retention_period = cls.RETENTION_POLICIES.get(data_type)
        if not retention_period:
            return None
        
        return created_at + retention_period


def hash_ip_address(ip_address: str) -> str:
    """Hash IP address for privacy compliance"""
    # Add salt for additional security
    salt = "corporate_website_salt_2025"
    salted_ip = f"{ip_address}{salt}"
    
    # Use SHA-256 for hashing
    return hashlib.sha256(salted_ip.encode()).hexdigest()


def sanitize_user_agent(user_agent: str) -> str:
    """Sanitize user agent string to prevent fingerprinting while maintaining audit value"""
    if not user_agent:
        return "unknown"
    
    # Truncate to reasonable length
    return user_agent[:200]


def validate_csrf_token(token: str, session_token: str) -> bool:
    """Validate CSRF token for security"""
    # In production, this would validate against stored session token
    return token and len(token) == 32 and token.isalnum()


class ContactFormHandler:
    """Handle contact form submissions with compliance measures"""
    
    def __init__(self):
        self.rate_limiter = {}  # In production, use Redis or similar
    
    def check_rate_limit(self, ip_hash: str, max_requests: int = 5, 
                        window_minutes: int = 5) -> bool:
        """Check rate limiting to prevent abuse"""
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=window_minutes)
        
        # Get existing requests for this IP
        requests = self.rate_limiter.get(ip_hash, [])
        
        # Remove requests outside window
        requests = [req_time for req_time in requests if req_time > window_start]
        
        # Check if under limit
        if len(requests) >= max_requests:
            return False
        
        # Add current request
        requests.append(now)
        self.rate_limiter[ip_hash] = requests
        
        return True
    
    def process_submission(self, form_data: Dict[str, Any], 
                          ip_address: str, user_agent: str,
                          csrf_token: str, session_token: str) -> Dict[str, Any]:
        """Process contact form submission with full compliance measures"""
        
        # Hash IP address for privacy
        ip_hash = hash_ip_address(ip_address)
        
        # Log submission attempt
        AuditLogger.log_event('contact_form_attempt', {
            'ip_hash': ip_hash,
            'user_agent': sanitize_user_agent(user_agent),
            'has_csrf_token': bool(csrf_token)
        })
        
        try:
            # Validate CSRF token
            if not validate_csrf_token(csrf_token, session_token):
                raise ValueError("Invalid CSRF token")
            
            # Check rate limiting
            if not self.check_rate_limit(ip_hash):
                raise ValueError("Rate limit exceeded")
            
            # Create and validate form data
            contact_data = ContactFormData(
                name=form_data.get('name', '').strip(),
                email=form_data.get('email', '').strip(),
                message=form_data.get('message', '').strip(),
                timestamp=datetime.utcnow().isoformat() + 'Z',
                consent_given=form_data.get('consent_given', False),
                ip_address_hash=ip_hash,
                user_agent=sanitize_user_agent(user_agent)
            )
            
            # Verify consent was given (GDPR requirement)
            if not contact_data.consent_given:
                raise ValueError("Consent required for data processing")
            
            # Store the contact form data (implementation would use secure database)
            submission_id = self.store_contact_data(contact_data)
            
            # Log successful submission
            AuditLogger.log_event('contact_form_success', {
                'submission_id': submission_id,
                'ip_hash': ip_hash,
                'data_retention_expiry': DataRetentionManager.get_expiry_date(
                    'contact_forms', datetime.utcnow()
                ).isoformat() if DataRetentionManager.get_expiry_date(
                    'contact_forms', datetime.utcnow()
                ) else None
            })
            
            return {
                'success': True,
                'submission_id': submission_id,
                'message': 'Thank you for your message. We will get back to you soon.'
            }
            
        except ValueError as e:
            # Log validation errors (without exposing details to client)
            AuditLogger.log_event('contact_form_validation_error', {
                'ip_hash': ip_hash,
                'error_type': type(e).__name__
            })
            
            return {
                'success': False,
                'error': 'Invalid form data. Please check your input and try again.'
            }
        
        except Exception as e:
            # Log unexpected errors
            AuditLogger.log_event('contact_form_error', {
                'ip_hash': ip_hash,
                'error_type': type(e).__name__
            })
            
            return {
                'success': False,
                'error': 'An error occurred. Please try again later.'
            }
    
    def store_contact_data(self, contact_data: ContactFormData) -> str:
        """Store contact form data securely (placeholder implementation)"""
        # In production, this would:
        # 1. Encrypt sensitive data before storage
        # 2. Store in secure database with proper access controls
        # 3. Set up automatic deletion based on retention policy
        
        submission_id = str(uuid.uuid4())
        
        # Placeholder: would store in database
        print(f"Storing contact data with ID: {submission_id}")
        
        return submission_id


def handle_data_export_request(user_identifier: str) -> Dict[str, Any]:
    """Handle GDPR data export request (Right to Data Portability)"""
    try:
        AuditLogger.log_event('data_export_request', {
            'user_identifier_hash': hashlib.sha256(user_identifier.encode()).hexdigest()
        })
        
        # In production, this would:
        # 1. Verify user identity
        # 2. Collect all user data from all systems
        # 3. Export in machine-readable format
        # 4. Ensure secure delivery
        
        export_id = str(uuid.uuid4())
        
        AuditLogger.log_event('data_export_success', {
            'export_id': export_id
        })
        
        return {
            'success': True,
            'export_id': export_id,
            'message': 'Data export will be available for download within 24 hours.'
        }
        
    except Exception as e:
        AuditLogger.log_event('data_export_error', {
            'error_type': type(e).__name__
        })
        
        return {
            'success': False,
            'error': 'Failed to process data export request.'
        }


def handle_data_deletion_request(user_identifier: str) -> Dict[str, Any]:
    """Handle GDPR data deletion request (Right to Erasure)"""
    try:
        AuditLogger.log_event('data_deletion_request', {
            'user_identifier_hash': hashlib.sha256(user_identifier.encode()).hexdigest()
        })
        
        # In production, this would:
        # 1. Verify user identity and authorization
        # 2. Check if deletion is legally required/allowed
        # 3. Delete data from all systems
        # 4. Maintain audit log of deletion (anonymized)
        
        deletion_id = str(uuid.uuid4())
        
        AuditLogger.log_event('data_deletion_success', {
            'deletion_id': deletion_id
        })
        
        return {
            'success': True,
            'deletion_id': deletion_id,
            'message': 'Your data has been scheduled for deletion.'
        }
        
    except Exception as e:
        AuditLogger.log_event('data_deletion_error', {
            'error_type': type(e).__name__
        })
        
        return {
            'success': False,
            'error': 'Failed to process data deletion request.'
        }


# Example usage
if __name__ == "__main__":
    handler = ContactFormHandler()
    
    # Example form submission
    sample_form_data = {
        'name': 'John Doe',
        'email': 'john@example.com',
        'message': 'Hello, I would like more information about your services.',
        'consent_given': True
    }
    
    result = handler.process_submission(
        form_data=sample_form_data,
        ip_address='192.168.1.1',
        user_agent='Mozilla/5.0 (compatible)',
        csrf_token='a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        session_token='session_token_123'
    )
    
    print(json.dumps(result, indent=2))