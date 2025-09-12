---
applyTo: "tests/**/*.{py,ts,tsx,js}"
description: "Comprehensive testing strategy for all test files"
---

# Testing Strategy

## Test Organization
- Separate unit, integration, and end-to-end tests
- Use descriptive test names that explain behavior
- Group related tests in test classes
- Follow AAA pattern: Arrange, Act, Assert

## Python Testing (pytest)
- Use fixtures for test data setup
- Implement parameterized tests for multiple scenarios
- Mock external dependencies
- Use pytest markers for test categorization

## TypeScript/React Testing
- Use React Testing Library for component tests
- Test user interactions, not implementation details
- Mock API calls and external dependencies
- Use MSW for API mocking in integration tests

## Coverage and Quality
- Maintain minimum 80% code coverage
- Test both happy path and edge cases
- Write tests before fixing bugs (TDD)
- Review test failures in CI/CD pipeline

## Performance Testing
- Test API response times
- Validate memory usage in long-running tests
- Test concurrent user scenarios
- Monitor test execution time
