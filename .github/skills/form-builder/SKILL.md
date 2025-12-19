---
compatibility: Requires Node.js 18+, React 18+, TypeScript 5+
description: Build production-ready forms in React/TypeScript. Use when creating contact
  forms, signup forms, multi-step wizards, or any user input interfaces. Covers React
  Hook Form patterns, Zod validation, and form state management.
license: MIT
metadata:
  apm_commit: dda98651f55e8fb6a1166a3411c2ae0a5cda5f1e
  apm_installed_at: '2025-12-19T12:34:05.033066'
  apm_package: danielmeppiel/form-builder
  apm_version: 1.0.0
  author: danielmeppiel
  version: 1.0.0
name: form-builder
---

# Form Builder Skill

Build accessible, type-safe forms for React applications using industry-standard patterns.

## When to Use This Skill

Activate when the user asks to:
- Create a form (contact, signup, login, checkout, etc.)
- Add form validation
- Handle form submissions
- Build multi-step form wizards
- Manage form state and loading states

## Core Stack

| Library | Purpose |
|---------|---------|
| React Hook Form | Form state management, minimal re-renders |
| Zod | TypeScript-first schema validation |
| React | UI components |

## Quick Start Pattern

Every form follows this structure:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema
const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name too short'),
});

type FormData = z.infer<typeof schema>;

// 2. Create component
export function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // 3. Handle submission
  const onSubmit = async (data: FormData) => {
    await submitToAPI(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} aria-describedby="name-error" />
      {errors.name && <span id="name-error" role="alert">{errors.name.message}</span>}
      
      <input {...register('email')} aria-describedby="email-error" />
      {errors.email && <span id="email-error" role="alert">{errors.email.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Key Patterns

### Validation Timing

- **On blur**: Best for most fields. Validates when user leaves field.
- **On change**: Use for real-time feedback (password strength).
- **On submit**: Always validate on submit as final gate.

```tsx
useForm({
  mode: 'onBlur',        // Validate on blur
  reValidateMode: 'onChange', // Re-validate on change after first error
});
```

### Error Display

Always connect errors to inputs for screen readers:

```tsx
<input 
  {...register('email')} 
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email.message}
  </span>
)}
```

### Loading States

Disable form during submission, show visual feedback:

```tsx
const { formState: { isSubmitting } } = useForm();

<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Sending...' : 'Submit'}
</button>
```

### Server Errors

Handle API errors and display to user:

```tsx
const [serverError, setServerError] = useState<string | null>(null);

const onSubmit = async (data: FormData) => {
  setServerError(null);
  try {
    await submitToAPI(data);
  } catch (error) {
    setServerError('Failed to submit. Please try again.');
  }
};
```

## Detailed References

For in-depth patterns, see:
- [React Hook Form patterns](.apm/instructions/react-forms.instructions.md) - Component structure, registration, controlled inputs
- [Validation patterns](.apm/instructions/validation.instructions.md) - Zod schemas, custom validators, async validation
- [State management](.apm/instructions/state-management.instructions.md) - Loading, errors, multi-step forms

## Complete Examples

Working implementations:
- [Contact form](examples/contact-form.tsx) - Full-featured with all patterns
- [Newsletter signup](examples/newsletter-signup.tsx) - Minimal implementation

## Common Schemas

### Email Field
```tsx
z.string().email('Please enter a valid email')
```

### Password with Requirements
```tsx
z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain number')
```

### Phone (Optional)
```tsx
z.string()
  .regex(/^\+?[\d\s-()]+$/, 'Invalid phone format')
  .optional()
  .or(z.literal(''))
```

### Checkbox Consent
```tsx
z.boolean().refine(val => val === true, 'You must agree to continue')
```

## Dependencies

Install required packages:

```bash
npm install react-hook-form @hookform/resolvers zod
```