---
applyTo: "**/*.tsx,**/*.ts"
description: React Hook Form patterns for form component structure and registration
---

# React Hook Form Patterns

## Form Component Structure

### Standard Form Layout

```tsx
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema defines the form shape
const formSchema = z.object({
  fieldName: z.string().min(1, 'Required'),
});

type FormValues = z.infer<typeof formSchema>;

export function FormComponent() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    setError,
    clearErrors,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      fieldName: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // Handle submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Form fields */}
    </form>
  );
}
```

### Why `noValidate`?

Use `noValidate` on the form to disable browser validation. We handle all validation through React Hook Form + Zod for:
- Consistent error styling
- Better error messages
- Cross-browser consistency

## Field Registration

### Basic Input

```tsx
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    {...register('email')}
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <span id="email-error" role="alert">
      {errors.email.message}
    </span>
  )}
</div>
```

### Textarea

```tsx
<div>
  <label htmlFor="message">Message</label>
  <textarea
    id="message"
    rows={4}
    {...register('message')}
    aria-invalid={!!errors.message}
    aria-describedby={errors.message ? 'message-error' : undefined}
  />
  {errors.message && (
    <span id="message-error" role="alert">
      {errors.message.message}
    </span>
  )}
</div>
```

### Select

```tsx
<div>
  <label htmlFor="country">Country</label>
  <select
    id="country"
    {...register('country')}
    aria-invalid={!!errors.country}
  >
    <option value="">Select a country</option>
    <option value="us">United States</option>
    <option value="uk">United Kingdom</option>
  </select>
  {errors.country && (
    <span role="alert">{errors.country.message}</span>
  )}
</div>
```

### Checkbox

```tsx
<div>
  <label>
    <input
      type="checkbox"
      {...register('agreeToTerms')}
    />
    I agree to the terms and conditions
  </label>
  {errors.agreeToTerms && (
    <span role="alert">{errors.agreeToTerms.message}</span>
  )}
</div>
```

### Radio Group

```tsx
<fieldset>
  <legend>Preferred Contact Method</legend>
  <label>
    <input type="radio" value="email" {...register('contactMethod')} />
    Email
  </label>
  <label>
    <input type="radio" value="phone" {...register('contactMethod')} />
    Phone
  </label>
  {errors.contactMethod && (
    <span role="alert">{errors.contactMethod.message}</span>
  )}
</fieldset>
```

## Controlled Components

Use `Controller` for third-party components that don't expose a `ref`:

```tsx
import { Controller } from 'react-hook-form';

<Controller
  name="date"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <DatePicker
      selected={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      aria-invalid={!!error}
    />
  )}
/>
```

## Reusable Field Component

Extract a reusable pattern for consistent styling:

```tsx
interface FormFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  type?: string;
  placeholder?: string;
}

function FormField({ 
  label, 
  name, 
  register, 
  error, 
  type = 'text',
  placeholder 
}: FormFieldProps) {
  const errorId = `${name}-error`;
  
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <span id={errorId} role="alert" className="error">
          {error.message}
        </span>
      )}
    </div>
  );
}
```

## Form Reset

Reset after successful submission:

```tsx
const onSubmit = async (data: FormValues) => {
  await submitToAPI(data);
  reset(); // Clear form
};
```

Reset to specific values:

```tsx
reset({
  email: '',
  name: 'Default Name',
});
```

## Watch Field Values

React to field changes without re-rendering entire form:

```tsx
const watchedEmail = watch('email');

// Or watch all fields
const allValues = watch();

// Watch with callback (useful for side effects)
useEffect(() => {
  const subscription = watch((value, { name }) => {
    console.log(`${name} changed to ${value[name]}`);
  });
  return () => subscription.unsubscribe();
}, [watch]);
```

## Dynamic Fields

Add/remove fields dynamically:

```tsx
import { useFieldArray } from 'react-hook-form';

const { fields, append, remove } = useFieldArray({
  control,
  name: 'items',
});

return (
  <>
    {fields.map((field, index) => (
      <div key={field.id}>
        <input {...register(`items.${index}.name`)} />
        <button type="button" onClick={() => remove(index)}>
          Remove
        </button>
      </div>
    ))}
    <button type="button" onClick={() => append({ name: '' })}>
      Add Item
    </button>
  </>
);
```

## Form Context

Share form methods across nested components:

```tsx
import { FormProvider, useFormContext } from 'react-hook-form';

// Parent component
function Form() {
  const methods = useForm();
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <NestedInput />
      </form>
    </FormProvider>
  );
}

// Child component
function NestedInput() {
  const { register, formState: { errors } } = useFormContext();
  
  return <input {...register('nestedField')} />;
}
```

## Performance Tips

1. **Use `useForm` options wisely**:
   ```tsx
   useForm({
     mode: 'onBlur', // Don't validate on every keystroke
     shouldUnregister: false, // Keep values when fields unmount
   });
   ```

2. **Isolate re-renders** with `useWatch`:
   ```tsx
   function WatchedValue({ control }: { control: Control }) {
     const value = useWatch({ control, name: 'email' });
     return <span>{value}</span>; // Only this component re-renders
   }
   ```

3. **Memoize static options**:
   ```tsx
   const formOptions = useMemo(() => ({
     resolver: zodResolver(schema),
     defaultValues: { email: '' },
   }), []);
   
   const form = useForm(formOptions);
   ```
