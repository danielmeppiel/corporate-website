import pytest
from src.utils.validation import validate_email, validate_phone

class TestValidation:
    def test_validate_email_valid(self):
        assert validate_email("test@example.com") == True
    
    def test_validate_email_invalid(self):
        assert validate_email("invalid-email") == False
    
    def test_validate_phone_valid(self):
        assert validate_phone("+1-555-123-4567") == True
    
    def test_validate_phone_invalid(self):
        assert validate_phone("abc-def-ghij") == False
