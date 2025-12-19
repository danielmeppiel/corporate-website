---
applyTo: "**/*.tsx,**/*.ts"
description: Zod validation patterns for form schemas and custom validators
---

# Zod Validation Patterns

## Schema Design Principles

1. **Define schemas outside components** - They don't need to re-create on each render
2. **Use `z.infer` for types** - Single source of truth
3. **Compose schemas** - Build complex from simple pieces

```tsx
// Define once at module level
const emailSchema = z.string().email('Invalid email address');

const userSchema = z.object({
  email: emailSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Type is derived automatically
type UserFormData = z.infer<typeof userSchema>;
```

## Common Field Schemas

### Required String
```tsx
z.string().min(1, 'This field is required')
```

### Optional String
```tsx
z.string().optional()
// or allow empty string
z.string().optional().or(z.literal(''))
```

### Email
```tsx
z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email')
```

### Password with Requirements
```tsx
z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
```

### Password Confirmation
```tsx
z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'], // Shows error on confirmPassword field
});
```

### Phone Number
```tsx
z.string()
  .regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number')
  .min(10, 'Phone number is too short')
  .optional()
  .or(z.literal(''))
```

### URL
```tsx
z.string()
  .url('Please enter a valid URL')
  .optional()
  .or(z.literal(''))
```

### Number in Range
```tsx
z.coerce.number() // Coerce string input to number
  .min(1, 'Must be at least 1')
  .max(100, 'Must be 100 or less')
```

### Date
```tsx
z.coerce.date()
  .min(new Date(), 'Date must be in the future')
```

### Checkbox Consent
```tsx
z.boolean().refine((val) => val === true, {
  message: 'You must accept the terms to continue',
})
```

### Select/Dropdown
```tsx
z.enum(['option1', 'option2', 'option3'], {
  errorMap: () => ({ message: 'Please select an option' }),
})
```

### File Upload
```tsx
z.instanceof(FileList)
  .refine((files) => files.length > 0, 'Please select a file')
  .refine(
    (files) => files[0]?.size <= 5 * 1024 * 1024,
    'File must be less than 5MB'
  )
  .refine(
    (files) => ['image/jpeg', 'image/png'].includes(files[0]?.type),
    'Only JPEG and PNG files are allowed'
  )
```

## Schema Composition

### Extending Schemas
```tsx
const baseUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

const fullUserSchema = baseUserSchema.extend({
  address: z.string().min(5),
  phone: z.string().optional(),
});
```

### Picking Fields
```tsx
const loginSchema = fullUserSchema.pick({
  email: true,
});
```

### Omitting Fields
```tsx
const publicUserSchema = fullUserSchema.omit({
  password: true,
});
```

### Partial (All Optional)
```tsx
const updateUserSchema = userSchema.partial();
// All fields become optional
```

### Merging Schemas
```tsx
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
});

const contactSchema = userSchema.merge(addressSchema);
```

## Conditional Validation

### Based on Another Field
```tsx
const schema = z.object({
  hasCompany: z.boolean(),
  companyName: z.string().optional(),
}).refine(
  (data) => !data.hasCompany || (data.companyName && data.companyName.length > 0),
  {
    message: 'Company name is required when you have a company',
    path: ['companyName'],
  }
);
```

### Using Discriminated Unions
```tsx
const schema = z.discriminatedUnion('accountType', [
  z.object({
    accountType: z.literal('personal'),
    name: z.string(),
  }),
  z.object({
    accountType: z.literal('business'),
    name: z.string(),
    taxId: z.string().min(1, 'Tax ID is required for business accounts'),
  }),
]);
```

## Custom Validators

### Synchronous Custom Validation
```tsx
const usernameSchema = z.string().refine(
  (val) => !val.includes(' '),
  { message: 'Username cannot contain spaces' }
);
```

### Async Validation (e.g., Check Username Availability)
```tsx
const usernameSchema = z.string().refine(
  async (val) => {
    const response = await fetch(`/api/check-username?name=${val}`);
    const { available } = await response.json();
    return available;
  },
  { message: 'This username is already taken' }
);

// Use with useForm
useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur', // Async validation on blur is less disruptive
});
```

### Multiple Custom Validations
```tsx
z.string()
  .refine((val) => !val.startsWith('-'), {
    message: 'Cannot start with hyphen',
  })
  .refine((val) => !val.endsWith('-'), {
    message: 'Cannot end with hyphen',
  });
```

## Transform Input

### Trim Whitespace
```tsx
z.string().trim().min(1, 'Required')
```

### Normalize Email
```tsx
z.string()
  .email()
  .transform((val) => val.toLowerCase().trim())
```

### Parse Numbers from Strings
```tsx
z.string().transform((val) => parseInt(val, 10))
// or use coerce
z.coerce.number()
```

## Error Messages

### Custom Error Map
```tsx
const schema = z.object({
  age: z.number({
    required_error: 'Age is required',
    invalid_type_error: 'Age must be a number',
  }).min(18, 'Must be 18 or older'),
});
```

### Global Error Map
```tsx
z.setErrorMap((issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === 'string') {
      return { message: 'This field is required' };
    }
  }
  return { message: ctx.defaultError };
});
```

## Validation Timing Strategies

### Eager Validation (Immediate Feedback)
```tsx
useForm({
  mode: 'onChange', // Validate on every change
  resolver: zodResolver(schema),
});
```

### Lazy Validation (On Submit Only)
```tsx
useForm({
  mode: 'onSubmit', // Only validate on submit
  resolver: zodResolver(schema),
});
```

### Balanced Approach (Recommended)
```tsx
useForm({
  mode: 'onBlur',          // Validate when field loses focus
  reValidateMode: 'onChange', // Re-validate on change after error
  resolver: zodResolver(schema),
});
```

## Debugging Schemas

### Test Schema Independently
```tsx
const result = schema.safeParse({
  email: 'invalid',
  name: 'A',
});

if (!result.success) {
  console.log(result.error.format());
  // {
  //   email: { _errors: ['Invalid email address'] },
  //   name: { _errors: ['Name must be at least 2 characters'] }
  // }
}
```

### Check Type Inference
```tsx
type FormData = z.infer<typeof schema>;
// Hover over FormData in IDE to verify structure
```
