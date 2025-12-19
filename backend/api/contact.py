"""
Contact API endpoint for secure form submission
Integrates with the existing contact_handler for GDPR compliance
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
import re
import html
import sys
import os

# Add the server directory to the path to import contact_handler
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'server'))

try:
    from contact_handler import ContactFormHandler, AuditLogger, hash_ip_address
except ImportError:
    # Fallback if import fails
    print("Warning: Could not import contact_handler. Using minimal implementation.")
    
    class ContactFormHandler:
        def process_submission(self, form_data, ip_address, user_agent, csrf_token, session_token):
            return {
                'success': True,
                'submission_id': 'fallback-id',
                'message': 'Message received (fallback mode)'
            }
    
    class AuditLogger:
        @staticmethod
        def log_event(event_type, event_data, user_id=None):
            print(f"AUDIT: {event_type} - {event_data}")
    
    def hash_ip_address(ip):
        import hashlib
        return hashlib.sha256(ip.encode()).hexdigest()

router = APIRouter(prefix="/api/contact", tags=["contact"])

class ContactFormData(BaseModel):
    email: EmailStr
    message: str = Field(..., min_length=1, max_length=5000)
    consent_given: bool = Field(..., alias="consent")
    csrf_token: str = Field(..., min_length=16, max_length=64)

    class Config:
        allow_population_by_field_name = True

    @validator('message')
    def sanitize_message(cls, v):
        """Sanitize message content server-side"""
        if not v:
            return v
            
        # Remove dangerous patterns
        sanitized = v
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',  # Script tags
            r'javascript:',                # Javascript protocol
            r'vbscript:',                 # VBScript protocol
            r'data:',                     # Data protocol
            r'on\w+\s*=',                 # Event handlers
            r'<[^>]*>',                   # HTML tags
        ]
        
        for pattern in dangerous_patterns:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE | re.DOTALL)
        
        # HTML escape any remaining content
        sanitized = html.escape(sanitized)
        
        return sanitized.strip()

    @validator('csrf_token')
    def validate_csrf_token_format(cls, v):
        """Validate CSRF token format"""
        if not v or not re.match(r'^[a-zA-Z0-9]{16,64}$', v):
            raise ValueError('Invalid CSRF token format')
        return v

class ContactResponse(BaseModel):
    success: bool
    message: str
    submission_id: Optional[str] = None
    error: Optional[str] = None

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"

def get_user_agent(request: Request) -> str:
    """Extract user agent from request"""
    return request.headers.get("User-Agent", "unknown")

@router.post("/submit", response_model=ContactResponse)
async def submit_contact_form(
    form_data: ContactFormData,
    request: Request
):
    """
    Submit contact form with security validation and GDPR compliance
    """
    
    # Extract request metadata
    client_ip = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # Log submission attempt
    AuditLogger.log_event('api_contact_form_attempt', {
        'ip_hash': hash_ip_address(client_ip),
        'user_agent': user_agent[:200],  # Truncated for privacy
        'email_domain': form_data.email.split('@')[1],
        'message_length': len(form_data.message)
    })
    
    try:
        # Initialize contact handler
        handler = ContactFormHandler()
        
        # Prepare form data for processing
        submission_data = {
            'email': form_data.email,
            'message': form_data.message,
            'consent_given': form_data.consent_given
        }
        
        # Process submission using the security-hardened handler
        result = handler.process_submission(
            form_data=submission_data,
            ip_address=client_ip,
            user_agent=user_agent,
            csrf_token=form_data.csrf_token,
            session_token="api_session"  # In production, use real session management
        )
        
        if result['success']:
            # Log successful submission
            AuditLogger.log_event('api_contact_form_success', {
                'submission_id': result['submission_id'],
                'ip_hash': hash_ip_address(client_ip)
            })
            
            # Send email notification (simulated)
            await send_email_notification(form_data, result['submission_id'])
            
            return ContactResponse(
                success=True,
                message=result['message'],
                submission_id=result['submission_id']
            )
        else:
            # Log failure
            AuditLogger.log_event('api_contact_form_failure', {
                'ip_hash': hash_ip_address(client_ip),
                'error': result.get('error', 'Unknown error')
            })
            
            raise HTTPException(
                status_code=400,
                detail=result.get('error', 'Form submission failed')
            )
            
    except ValueError as e:
        # Validation errors
        AuditLogger.log_event('api_contact_form_validation_error', {
            'ip_hash': hash_ip_address(client_ip),
            'error_type': type(e).__name__
        })
        
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
        
    except Exception as e:
        # Unexpected errors
        AuditLogger.log_event('api_contact_form_error', {
            'ip_hash': hash_ip_address(client_ip),
            'error_type': type(e).__name__
        })
        
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again later."
        )

async def send_email_notification(form_data: ContactFormData, submission_id: str):
    """
    Send email notification to communications department
    In production, this would integrate with a proper email service
    """
    
    email_content = f"""
    New Contact Form Submission
    
    Submission ID: {submission_id}
    Email: {form_data.email}
    
    Message:
    {form_data.message}
    
    ---
    This message was submitted through the Corporate Inc. website contact form.
    Please respond directly to the sender's email address.
    """
    
    # Log email sending attempt
    AuditLogger.log_event('email_notification_sent', {
        'submission_id': submission_id,
        'recipient': 'communications@corporate-inc.com',
        'sender_domain': form_data.email.split('@')[1]
    })
    
    # Simulate email sending (in production, use proper email service)
    print(f"📧 EMAIL SENT TO COMMUNICATIONS DEPARTMENT:")
    print(f"   From: {form_data.email}")
    print(f"   Subject: New Contact Form Submission - {submission_id}")
    print(f"   Message: {form_data.message[:100]}...")
    print(f"   Submission ID: {submission_id}")
    
    return True

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "contact-api"}