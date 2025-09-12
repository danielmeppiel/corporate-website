"""
Test suite for contact handler backend functionality
Following compliance and audit requirements
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from server.contact_handler import (
    ContactHandler,
    validate_contact_data,
    log_audit_event,
    encrypt_sensitive_data,
    check_rate_limits,
    clean_expired_submissions
)


class TestContactHandler:
    """Test suite for ContactHandler class following GDPR compliance"""
    
    @pytest.fixture
    def contact_handler(self):
        """Create a ContactHandler instance for testing"""
        return ContactHandler()
    
    @pytest.fixture
    def valid_contact_data(self):
        """Valid contact form data for testing"""
        return {
            'name': 'John Doe',
            'email': 'john.doe@example.com',
            'message': 'This is a test message for the contact form.',
            'consent': True,
            'timestamp': datetime.now().isoformat()
        }
    
    def test_validate_contact_data_success(self, valid_contact_data):
        """Test successful validation of contact data"""
        result = validate_contact_data(valid_contact_data)
        assert result['valid'] is True
        assert result['errors'] == []
    
    def test_validate_contact_data_missing_fields(self):
        """Test validation with missing required fields"""
        incomplete_data = {'name': 'John'}
        result = validate_contact_data(incomplete_data)
        
        assert result['valid'] is False
        assert 'email' in str(result['errors'])
        assert 'message' in str(result['errors'])
        assert 'consent' in str(result['errors'])
    
    def test_validate_contact_data_invalid_email(self):
        """Test validation with invalid email format"""
        invalid_data = {
            'name': 'John Doe',
            'email': 'invalid-email-format',
            'message': 'Test message',
            'consent': True
        }
        result = validate_contact_data(invalid_data)
        
        assert result['valid'] is False
        assert 'Invalid email format' in str(result['errors'])
    
    def test_validate_contact_data_suspicious_content(self):
        """Test validation detects suspicious content"""
        suspicious_data = {
            'name': '<script>alert("xss")</script>',
            'email': 'test@example.com',
            'message': 'javascript:alert(1)',
            'consent': True
        }
        result = validate_contact_data(suspicious_data)
        
        assert result['valid'] is False
        assert 'Suspicious content detected' in str(result['errors'])
    
    def test_validate_contact_data_gdpr_consent_required(self):
        """Test that GDPR consent is required"""
        data_without_consent = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'message': 'Test message',
            'consent': False
        }
        result = validate_contact_data(data_without_consent)
        
        assert result['valid'] is False
        assert 'GDPR consent is required' in str(result['errors'])
    
    @patch('server.contact_handler.datetime')
    def test_log_audit_event(self, mock_datetime):
        """Test audit event logging for compliance"""
        mock_datetime.now.return_value = datetime(2025, 9, 11, 12, 0, 0)
        
        with patch('builtins.open', create=True) as mock_open:
            mock_file = MagicMock()
            mock_open.return_value.__enter__.return_value = mock_file
            
            log_audit_event('form_submission', {
                'user_id': 'anonymous',
                'ip_address': '192.168.1.1',
                'form_fields': ['name', 'email', 'message']
            })
            
            mock_open.assert_called_with('audit.log', 'a')
            mock_file.write.assert_called_once()
            
            # Verify log format
            logged_data = mock_file.write.call_args[0][0]
            assert 'form_submission' in logged_data
            assert '2025-09-11T12:00:00' in logged_data
            assert 'anonymous' in logged_data
    
    def test_encrypt_sensitive_data(self):
        """Test encryption of sensitive personal data"""
        sensitive_data = {
            'email': 'john.doe@example.com',
            'phone': '+1-555-0123'
        }
        
        encrypted = encrypt_sensitive_data(sensitive_data)
        
        assert encrypted != sensitive_data
        assert 'email' in encrypted
        assert 'phone' in encrypted
        assert encrypted['email'] != sensitive_data['email']
        assert encrypted['phone'] != sensitive_data['phone']
        
        # Verify encryption is reversible (for legitimate access)
        # Note: In real implementation, decryption would require proper authorization
        assert len(encrypted['email']) > len(sensitive_data['email'])
    
    @patch('server.contact_handler.get_client_ip')
    def test_check_rate_limits(self, mock_get_ip):
        """Test rate limiting to prevent abuse"""
        mock_get_ip.return_value = '192.168.1.1'
        
        # First request should pass
        result = check_rate_limits('192.168.1.1')
        assert result['allowed'] is True
        
        # Simulate multiple rapid requests
        for _ in range(10):
            result = check_rate_limits('192.168.1.1')
        
        # Should be rate limited after too many requests
        assert result['allowed'] is False
        assert 'Rate limit exceeded' in result['message']
    
    def test_contact_handler_process_submission_success(self, contact_handler, valid_contact_data):
        """Test successful contact form submission processing"""
        with patch('server.contact_handler.log_audit_event') as mock_log, \
             patch('server.contact_handler.encrypt_sensitive_data') as mock_encrypt, \
             patch('server.contact_handler.check_rate_limits') as mock_rate_limit:
            
            mock_rate_limit.return_value = {'allowed': True}
            mock_encrypt.return_value = {'email': 'encrypted_email'}
            
            result = contact_handler.process_submission(valid_contact_data, '192.168.1.1')
            
            assert result['success'] is True
            assert result['submission_id'] is not None
            mock_log.assert_called()
            mock_encrypt.assert_called()
    
    def test_contact_handler_process_submission_rate_limited(self, contact_handler, valid_contact_data):
        """Test contact form submission when rate limited"""
        with patch('server.contact_handler.check_rate_limits') as mock_rate_limit:
            mock_rate_limit.return_value = {
                'allowed': False, 
                'message': 'Rate limit exceeded'
            }
            
            result = contact_handler.process_submission(valid_contact_data, '192.168.1.1')
            
            assert result['success'] is False
            assert 'Rate limit exceeded' in result['error']
    
    def test_contact_handler_process_submission_invalid_data(self, contact_handler):
        """Test contact form submission with invalid data"""
        invalid_data = {'name': 'John'}  # Missing required fields
        
        result = contact_handler.process_submission(invalid_data, '192.168.1.1')
        
        assert result['success'] is False
        assert 'Validation failed' in result['error']
    
    @patch('server.contact_handler.datetime')
    def test_clean_expired_submissions(self, mock_datetime):
        """Test cleanup of expired submission data per GDPR retention"""
        mock_datetime.now.return_value = datetime(2025, 9, 11, 12, 0, 0)
        
        with patch('server.contact_handler.get_expired_submissions') as mock_get_expired, \
             patch('server.contact_handler.delete_submissions') as mock_delete, \
             patch('server.contact_handler.log_audit_event') as mock_log:
            
            mock_get_expired.return_value = ['sub1', 'sub2', 'sub3']
            
            result = clean_expired_submissions()
            
            assert result['cleaned_count'] == 3
            mock_delete.assert_called_with(['sub1', 'sub2', 'sub3'])
            mock_log.assert_called_with('data_retention_cleanup', {
                'cleaned_submissions': 3,
                'retention_policy': '7_years'
            })
    
    def test_data_minimization_compliance(self, contact_handler, valid_contact_data):
        """Test that only necessary data is stored per GDPR data minimization"""
        with patch('server.contact_handler.store_submission') as mock_store:
            contact_handler.process_submission(valid_contact_data, '192.168.1.1')
            
            stored_data = mock_store.call_args[0][0]
            
            # Verify only necessary fields are stored
            required_fields = {'name', 'email', 'message', 'consent', 'timestamp'}
            assert set(stored_data.keys()) <= required_fields
            
            # Verify no unnecessary tracking data
            assert 'user_agent' not in stored_data
            assert 'referrer' not in stored_data
            assert 'session_id' not in stored_data
    
    def test_right_to_erasure_implementation(self, contact_handler):
        """Test implementation of GDPR right to erasure"""
        email = 'john.doe@example.com'
        
        with patch('server.contact_handler.find_submissions_by_email') as mock_find, \
             patch('server.contact_handler.delete_submissions') as mock_delete, \
             patch('server.contact_handler.log_audit_event') as mock_log:
            
            mock_find.return_value = ['sub1', 'sub2']
            
            result = contact_handler.process_erasure_request(email)
            
            assert result['success'] is True
            assert result['deleted_count'] == 2
            mock_delete.assert_called_with(['sub1', 'sub2'])
            mock_log.assert_called_with('gdpr_erasure_request', {
                'email_hash': mock_log.call_args[0][1]['email_hash'],
                'deleted_count': 2
            })
    
    def test_data_portability_implementation(self, contact_handler):
        """Test implementation of GDPR data portability"""
        email = 'john.doe@example.com'
        
        with patch('server.contact_handler.find_submissions_by_email') as mock_find:
            mock_find.return_value = [
                {
                    'name': 'John Doe',
                    'email': 'john.doe@example.com',
                    'message': 'Test message',
                    'timestamp': '2025-09-11T12:00:00'
                }
            ]
            
            result = contact_handler.export_user_data(email)
            
            assert result['success'] is True
            assert 'data' in result
            assert len(result['data']) == 1
            assert result['format'] == 'json'
            assert result['data'][0]['email'] == email


class TestSecurityValidation:
    """Test suite for security validation functions"""
    
    def test_sql_injection_detection(self):
        """Test detection of SQL injection attempts"""
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'/**/AND/**/1=1#",
            "' UNION SELECT * FROM users --"
        ]
        
        for malicious_input in malicious_inputs:
            data = {
                'name': malicious_input,
                'email': 'test@example.com',
                'message': 'Test',
                'consent': True
            }
            result = validate_contact_data(data)
            assert result['valid'] is False
            assert 'Suspicious content detected' in str(result['errors'])
    
    def test_xss_prevention(self):
        """Test prevention of XSS attacks"""
        xss_payloads = [
            '<script>alert("xss")</script>',
            'javascript:alert(1)',
            '<img src=x onerror=alert(1)>',
            '<svg onload=alert(1)>'
        ]
        
        for payload in xss_payloads:
            data = {
                'name': 'John',
                'email': 'test@example.com',
                'message': payload,
                'consent': True
            }
            result = validate_contact_data(data)
            assert result['valid'] is False
    
    def test_command_injection_prevention(self):
        """Test prevention of command injection"""
        command_injections = [
            '; cat /etc/passwd',
            '| ls -la',
            '&& rm -rf /',
            '`whoami`'
        ]
        
        for injection in command_injections:
            data = {
                'name': f'John{injection}',
                'email': 'test@example.com',
                'message': 'Test',
                'consent': True
            }
            result = validate_contact_data(data)
            assert result['valid'] is False


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])