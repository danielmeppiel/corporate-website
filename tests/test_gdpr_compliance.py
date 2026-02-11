"""
Test GDPR compliance features in contact handler
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'server'))

from contact_handler import (
    ContactFormHandler,
    verify_recaptcha_token,
    AuditLogger
)


def test_recaptcha_verification_without_key():
    """Test reCAPTCHA verification without secret key"""
    # Should return success in development mode
    result = verify_recaptcha_token('test_token', '127.0.0.1')
    assert result['success'] is True
    assert result['score'] == 1.0
    print('✓ reCAPTCHA verification works in development mode')


def test_handler_has_recaptcha_threshold():
    """Test handler has reCAPTCHA threshold"""
    handler = ContactFormHandler()
    assert hasattr(handler, 'recaptcha_threshold')
    assert handler.recaptcha_threshold == 0.5
    print('✓ ContactFormHandler has reCAPTCHA threshold configured')


def test_process_submission_with_recaptcha():
    """Test form submission with reCAPTCHA token"""
    handler = ContactFormHandler()
    
    form_data = {
        'name': 'Test User',
        'email': 'test@example.com',
        'message': 'Test message',
        'consent_given': True
    }
    
    result = handler.process_submission(
        form_data=form_data,
        ip_address='127.0.0.1',
        user_agent='Test Agent',
        csrf_token='a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        session_token='session_token_123',
        recaptcha_token='test_recaptcha_token'
    )
    
    assert result['success'] is True
    print('✓ Form submission with reCAPTCHA token succeeds')


def test_process_submission_without_recaptcha():
    """Test form submission without reCAPTCHA token"""
    handler = ContactFormHandler()
    
    form_data = {
        'name': 'Test User',
        'email': 'test@example.com',
        'message': 'Test message',
        'consent_given': True
    }
    
    result = handler.process_submission(
        form_data=form_data,
        ip_address='127.0.0.1',
        user_agent='Test Agent',
        csrf_token='a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        session_token='session_token_123',
        recaptcha_token=None  # No reCAPTCHA token
    )
    
    assert result['success'] is True
    print('✓ Form submission without reCAPTCHA token still works (optional)')


if __name__ == '__main__':
    print('\nRunning GDPR compliance tests...\n')
    
    test_recaptcha_verification_without_key()
    test_handler_has_recaptcha_threshold()
    test_process_submission_with_recaptcha()
    test_process_submission_without_recaptcha()
    
    print('\n✓ All GDPR compliance tests passed!\n')
