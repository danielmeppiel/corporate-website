---
applyTo: "**/*.py"
description: "Corporate website Python styling standards and server-side best practices"
---

# Corporate Website Python Standards

## Server-Side Styling Guidelines

### Import Organization
```python
# 1. Standard library imports (alphabetical)
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# 2. Third-party imports (alphabetical) 
import flask
import requests
from dataclasses import dataclass

# 3. Local application imports
from .models import User
from .utils import hash_ip_address
```

### Corporate Code Style

#### Function Naming
- Use descriptive verb-noun combinations
- Prefix handler functions with `handle_`
- Prefix validation functions with `validate_`
- Prefix utility functions with their domain (e.g., `hash_ip_address`)

#### Class Design
```python
class ContactFormHandler:
    """Business logic handlers should be stateful classes with clear responsibilities"""
    
    def __init__(self):
        self.rate_limiter = {}  # Document data structures
    
    def process_submission(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process methods should return standardized response dictionaries
        
        Returns:
            Dict with 'success' boolean and either 'message' or 'error' keys
        """
        pass
```

#### Error Handling Patterns
```python
try:
    # Business logic here
    result = self.process_data(data)
    
    # Log successful operations for audit
    AuditLogger.log_event('operation_success', {
        'operation_id': result['id']
    })
    
    return {'success': True, 'data': result}
    
except ValidationError as e:
    # Log validation errors (sanitized)
    AuditLogger.log_event('validation_error', {
        'error_type': type(e).__name__
    })
    
    return {'success': False, 'error': 'Invalid input data'}
    
except Exception as e:
    # Log unexpected errors (no sensitive data)
    AuditLogger.log_event('system_error', {
        'error_type': type(e).__name__
    })
    
    return {'success': False, 'error': 'System error occurred'}
```

### Server-Side Security Patterns

#### Input Sanitization
```python
def sanitize_input(data: str, max_length: int = 1000) -> str:
    """Corporate standard for input sanitization"""
    if not isinstance(data, str):
        raise ValueError("Input must be string")
    
    # Truncate to prevent DoS
    data = data[:max_length]
    
    # Remove dangerous patterns
    dangerous_patterns = [
        r'<script', r'javascript:', r'on\w+\s*=', r'data:'
    ]
    
    for pattern in dangerous_patterns:
        data = re.sub(pattern, '', data, flags=re.IGNORECASE)
    
    return data.strip()
```

#### Rate Limiting Implementation
```python
def check_rate_limit(self, identifier: str, max_requests: int = 5, 
                    window_minutes: int = 5) -> bool:
    """Corporate standard rate limiting pattern"""
    now = datetime.utcnow()
    window_start = now - timedelta(minutes=window_minutes)
    
    # Implementation details...
    return within_limit
```

### Documentation Standards

#### Docstring Format
```python
def process_user_request(user_id: str, request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process user request with corporate compliance measures.
    
    This function handles user requests while ensuring GDPR compliance,
    security validation, and proper audit logging.
    
    Args:
        user_id (str): Unique user identifier for audit trail
        request_data (Dict[str, Any]): Validated request payload
    
    Returns:
        Dict[str, Any]: Response with 'success' boolean and either
                       'data' (on success) or 'error' (on failure)
    
    Raises:
        ValidationError: When input data fails validation
        AuthorizationError: When user lacks required permissions
    
    Example:
        >>> handler = RequestHandler()
        >>> result = handler.process_user_request("user123", {"action": "update"})
        >>> print(result['success'])
        True
    """
```

### Performance Guidelines

#### Database Operations
- Use connection pooling for all database connections
- Implement proper indexing on lookup fields
- Use parameterized queries to prevent SQL injection
- Log slow queries for optimization

#### Caching Strategy
- Cache static configuration data
- Use Redis for session storage
- Implement cache invalidation patterns
- Monitor cache hit rates

**Remember**: All server-side code must follow corporate security policies and maintain comprehensive audit trails for compliance.
```