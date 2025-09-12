---
applyTo: "backend/**/*.py"
description: "Backend API development standards using FastAPI"
---

# Backend API Development

## FastAPI Standards
- Use type hints for all function parameters
- Implement proper response models
- Add comprehensive docstrings
- Use dependency injection for shared resources

## Security
- Validate all input data
- Implement proper authentication
- Use HTTPS in production
- Sanitize error messages

## Database
- Use async database operations
- Implement proper connection pooling
- Add database migrations
- Follow SQL injection prevention

## Error Handling
- Use FastAPI exception handlers
- Return consistent error formats
- Log errors with proper context
- Implement retry mechanisms for external calls

## Testing
- Write unit tests for all endpoints
- Use TestClient for API testing
- Mock external dependencies
- Test error scenarios
