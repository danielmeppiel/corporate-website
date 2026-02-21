"""
Test suite for contact handler backend functionality
Following compliance and audit requirements
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from server.contact_handler import (
    ContactFormHandler,
    ContactFormData,
    AuditLogger,
    DataRetentionManager,
    hash_ip_address,
    sanitize_user_agent,
    validate_csrf_token,
    handle_data_export_request,
    handle_data_deletion_request
)


class TestContactFormData:
    """Test suite for ContactFormData validation"""
    
    def test_valid_contact_form_data(self):
        """Test creating valid contact form data"""
        data = ContactFormData(
            name="John Doe",
            email="john@example.com",
            message="This is a test message",
            timestamp=datetime.utcnow().isoformat() + 'Z',
            consent_given=True,
            ip_address_hash="hashed_ip",
            user_agent="Mozilla/5.0"
        )
        
        assert data.name == "John Doe"
        assert data.email == "john@example.com"
        assert data.consent_given is True
    
    def test_invalid_name_too_long(self):
        """Test validation rejects name that is too long"""
        with pytest.raises(ValueError, match="Invalid name field"):
            ContactFormData(
                name="x" * 101,  # Exceeds 100 character limit
                email="john@example.com",
                message="Test message",
                timestamp=datetime.utcnow().isoformat() + 'Z',
                consent_given=True,
                ip_address_hash="hashed_ip",
                user_agent="Mozilla/5.0"
            )
    
    def test_invalid_email_format(self):
        """Test validation rejects invalid email format"""
        with pytest.raises(ValueError, match="Invalid email format"):
            ContactFormData(
                name="John Doe",
                email="not-an-email",
                message="Test message",
                timestamp=datetime.utcnow().isoformat() + 'Z',
                consent_given=True,
                ip_address_hash="hashed_ip",
                user_agent="Mozilla/5.0"
            )
    
    def test_xss_detection_in_name(self):
        """Test validation detects XSS attempts"""
        with pytest.raises(ValueError, match="Invalid input detected"):
            ContactFormData(
                name='<script>alert("xss")</script>',
                email="john@example.com",
                message="Test message",
                timestamp=datetime.utcnow().isoformat() + 'Z',
                consent_given=True,
                ip_address_hash="hashed_ip",
                user_agent="Mozilla/5.0"
            )
    
    def test_message_too_long(self):
        """Test validation rejects message that is too long"""
        with pytest.raises(ValueError, match="Invalid message field"):
            ContactFormData(
                name="John Doe",
                email="john@example.com",
                message="x" * 5001,  # Exceeds 5000 character limit
                timestamp=datetime.utcnow().isoformat() + 'Z',
                consent_given=True,
                ip_address_hash="hashed_ip",
                user_agent="Mozilla/5.0"
            )


class TestAuditLogger:
    """Test suite for AuditLogger"""
    
    @patch('server.contact_handler.audit_logger')
    def test_log_event(self, mock_logger):
        """Test audit event logging"""
        AuditLogger.log_event('test_event', {'key': 'value'}, user_id='user123')
        
        # Verify logger was called
        assert mock_logger.info.called
        
        # Get the logged message
        log_message = mock_logger.info.call_args[0][0]
        
        # Verify log contains event data
        assert 'test_event' in log_message
        assert 'user123' in log_message
        assert 'key' in log_message


class TestDataRetentionManager:
    """Test suite for DataRetentionManager"""
    
    def test_should_retain_contact_forms_within_period(self):
        """Test data retention for contact forms within 5 year period"""
        created_at = datetime.utcnow() - timedelta(days=365 * 4)  # 4 years ago
        
        result = DataRetentionManager.should_retain('contact_forms', created_at)
        
        assert result is True
    
    def test_should_not_retain_contact_forms_expired(self):
        """Test data retention rejects expired contact forms"""
        created_at = datetime.utcnow() - timedelta(days=365 * 6)  # 6 years ago
        
        result = DataRetentionManager.should_retain('contact_forms', created_at)
        
        assert result is False
    
    def test_should_retain_audit_logs_within_period(self):
        """Test data retention for audit logs within 7 year period"""
        created_at = datetime.utcnow() - timedelta(days=365 * 6)  # 6 years ago
        
        result = DataRetentionManager.should_retain('audit_logs', created_at)
        
        assert result is True
    
    def test_get_expiry_date_contact_forms(self):
        """Test getting expiry date for contact forms"""
        created_at = datetime.utcnow()
        
        expiry = DataRetentionManager.get_expiry_date('contact_forms', created_at)
        
        expected_expiry = created_at + timedelta(days=5*365)
        assert expiry == expected_expiry
    
    def test_unknown_data_type_returns_false(self):
        """Test unknown data type returns False"""
        created_at = datetime.utcnow()
        
        result = DataRetentionManager.should_retain('unknown_type', created_at)
        
        assert result is False


class TestUtilityFunctions:
    """Test suite for utility functions"""
    
    def test_hash_ip_address(self):
        """Test IP address hashing for privacy"""
        ip = "192.168.1.1"
        
        hashed = hash_ip_address(ip)
        
        # Should be a hex string (SHA-256 produces 64 hex chars)
        assert len(hashed) == 64
        assert hashed.isalnum()
        
        # Same IP should produce same hash
        assert hash_ip_address(ip) == hashed
        
        # Different IP should produce different hash
        assert hash_ip_address("192.168.1.2") != hashed
    
    def test_sanitize_user_agent(self):
        """Test user agent sanitization"""
        long_ua = "Mozilla/5.0 " * 50  # Very long user agent
        
        sanitized = sanitize_user_agent(long_ua)
        
        # Should be truncated to 200 characters
        assert len(sanitized) == 200
    
    def test_sanitize_empty_user_agent(self):
        """Test sanitizing empty user agent"""
        result = sanitize_user_agent("")
        
        assert result == "unknown"
    
    def test_validate_csrf_token_valid(self):
        """Test CSRF token validation with valid token"""
        token = "a" * 32  # 32 alphanumeric characters
        
        result = validate_csrf_token(token, "session_token")
        
        assert result is True
    
    def test_validate_csrf_token_invalid_length(self):
        """Test CSRF token validation rejects wrong length"""
        token = "abc123"  # Too short
        
        result = validate_csrf_token(token, "session_token")
        
        assert result is False
    
    def test_validate_csrf_token_invalid_characters(self):
        """Test CSRF token validation rejects non-alphanumeric"""
        token = "a" * 31 + "!"  # Contains non-alphanumeric
        
        result = validate_csrf_token(token, "session_token")
        
        assert result is False


class TestContactFormHandler:
    """Test suite for ContactFormHandler"""
    
    @pytest.fixture
    def handler(self):
        """Create a ContactFormHandler instance"""
        return ContactFormHandler()
    
    def test_check_rate_limit_allows_first_request(self, handler):
        """Test rate limiting allows first request"""
        ip_hash = "test_hash"
        
        result = handler.check_rate_limit(ip_hash)
        
        assert result is True
    
    def test_check_rate_limit_blocks_after_limit(self, handler):
        """Test rate limiting blocks after exceeding limit"""
        ip_hash = "test_hash"
        
        # Make 5 requests (default limit)
        for _ in range(5):
            handler.check_rate_limit(ip_hash)
        
        # 6th request should be blocked
        result = handler.check_rate_limit(ip_hash)
        
        assert result is False
    
    def test_check_rate_limit_allows_after_window(self, handler):
        """Test rate limiting allows requests after time window"""
        ip_hash = "test_hash"
        
        with patch('server.contact_handler.datetime') as mock_datetime:
            # Initial time
            initial_time = datetime(2026, 1, 1, 12, 0, 0)
            mock_datetime.utcnow.return_value = initial_time
            
            # Make 5 requests
            for _ in range(5):
                handler.check_rate_limit(ip_hash)
            
            # Move time forward 6 minutes (beyond 5 minute window)
            mock_datetime.utcnow.return_value = initial_time + timedelta(minutes=6)
            
            # Should allow new request
            result = handler.check_rate_limit(ip_hash)
            assert result is True
    
    @patch('server.contact_handler.AuditLogger.log_event')
    def test_process_submission_success(self, mock_log, handler):
        """Test successful contact form submission"""
        form_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'message': 'Test message',
            'consent_given': True
        }
        
        result = handler.process_submission(
            form_data,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0',
            csrf_token='a' * 32,
            session_token='session123'
        )
        
        assert result['success'] is True
        assert 'submission_id' in result
        assert mock_log.called
    
    @patch('server.contact_handler.AuditLogger.log_event')
    def test_process_submission_no_consent(self, mock_log, handler):
        """Test submission fails without consent"""
        form_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'message': 'Test message',
            'consent_given': False  # No consent
        }
        
        result = handler.process_submission(
            form_data,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0',
            csrf_token='a' * 32,
            session_token='session123'
        )
        
        assert result['success'] is False
        assert 'error' in result
    
    @patch('server.contact_handler.AuditLogger.log_event')
    def test_process_submission_invalid_csrf(self, mock_log, handler):
        """Test submission fails with invalid CSRF token"""
        form_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'message': 'Test message',
            'consent_given': True
        }
        
        result = handler.process_submission(
            form_data,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0',
            csrf_token='invalid',  # Invalid token
            session_token='session123'
        )
        
        assert result['success'] is False
    
    @patch('server.contact_handler.AuditLogger.log_event')
    def test_process_submission_rate_limited(self, mock_log, handler):
        """Test submission fails when rate limited"""
        form_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'message': 'Test message',
            'consent_given': True
        }
        
        # Exhaust rate limit
        for _ in range(5):
            handler.process_submission(
                form_data,
                ip_address='192.168.1.1',
                user_agent='Mozilla/5.0',
                csrf_token='a' * 32,
                session_token='session123'
            )
        
        # Next request should fail
        result = handler.process_submission(
            form_data,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0',
            csrf_token='a' * 32,
            session_token='session123'
        )
        
        assert result['success'] is False


class TestGDPRFunctions:
    """Test suite for GDPR compliance functions"""
    
    @patch('server.contact_handler.AuditLogger.log_event')
    def test_handle_data_export_request(self, mock_log):
        """Test GDPR data export request"""
        result = handle_data_export_request('user@example.com')
        
        assert result['success'] is True
        assert 'export_id' in result
        assert mock_log.called
    
    @patch('server.contact_handler.AuditLogger.log_event')
    def test_handle_data_deletion_request(self, mock_log):
        """Test GDPR data deletion request"""
        result = handle_data_deletion_request('user@example.com')
        
        assert result['success'] is True
        assert 'deletion_id' in result
        assert mock_log.called


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])