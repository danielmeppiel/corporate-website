---
applyTo: "**/*.{tsx,jsx}"
description: "React component development standards and best practices"
---

# React Component Guidelines

## Component Structure
- Use functional components with TypeScript
- Implement proper prop interfaces
- Follow naming conventions: PascalCase for components
- Use React.FC type annotation

## State Management
- Use useState for local state
- Use useEffect for side effects
- Implement custom hooks for reusable logic
- Consider React Context for global state

## Performance
- Use React.memo for expensive components
- Implement useCallback for event handlers
- Use useMemo for expensive calculations
- Avoid inline object/function creation in render

## Testing
- Write unit tests for all components
- Test user interactions and edge cases
- Use React Testing Library best practices
- Mock external dependencies properly
