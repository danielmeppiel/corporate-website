---
applyTo: "**/*.tsx,**/*.ts"
description: Form state management patterns for loading states, errors, and multi-step forms
---

# Form State Management

## Form State Overview

React Hook Form provides these key state properties:

```tsx
const {
  formState: {
    isDirty,        // Form has been modified
    isValid,        // All validations pass
    isSubmitting,   // Submission in progress
    isSubmitted,    // Form was submitted at least once
    isSubmitSuccessful, // Last submission succeeded
    errors,         // Validation errors object
    dirtyFields,    // Which fields have been modified
    touchedFields,  // Which fields have been touched
    submitCount,    // Number of submit attempts
  },
} = useForm();
```

## Loading States

### During Submission

```tsx
function ContactForm() {
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    await submitToAPI(data); // isSubmitting is true during this
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Spinner aria-hidden="true" />
            <span>Sending...</span>
          </>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}
```

### With Loading Overlay

```tsx
function FormWithOverlay() {
  const { formState: { isSubmitting } } = useForm();

  return (
    <div className="form-container">
      {isSubmitting && (
        <div className="loading-overlay" aria-busy="true" aria-label="Submitting form">
          <Spinner />
        </div>
      )}
      
      <form aria-disabled={isSubmitting}>
        {/* Disable pointer events during submit */}
        <fieldset disabled={isSubmitting}>
          {/* Form fields */}
        </fieldset>
      </form>
    </div>
  );
}
```

## Server Error Handling

### Basic Server Error State

```tsx
function FormWithServerErrors() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { handleSubmit, setError } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        
        // Field-specific errors from server
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, message]) => {
            setError(field as keyof FormData, {
              type: 'server',
              message: message as string,
            });
          });
        } else {
          // General server error
          setServerError(error.message || 'Something went wrong');
        }
        return;
      }
      
      // Success handling
    } catch (error) {
      setServerError('Network error. Please check your connection.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {serverError && (
        <div role="alert" className="error-banner">
          {serverError}
        </div>
      )}
      
      {/* Form fields */}
    </form>
  );
}
```

### Error Banner Component

```tsx
interface ErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
}

function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;
  
  return (
    <div role="alert" className="error-banner">
      <span>{error}</span>
      {onDismiss && (
        <button 
          type="button" 
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}
```

## Success States

### Show Success Message

```tsx
function FormWithSuccess() {
  const [isSuccess, setIsSuccess] = useState(false);
  const { handleSubmit, reset } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    await submitToAPI(data);
    setIsSuccess(true);
    reset(); // Clear form after success
  };

  if (isSuccess) {
    return (
      <div role="status" aria-live="polite" className="success-message">
        <h2>Thank you!</h2>
        <p>Your message has been sent successfully.</p>
        <button type="button" onClick={() => setIsSuccess(false)}>
          Send another message
        </button>
      </div>
    );
  }

  return <form onSubmit={handleSubmit(onSubmit)}>{/* ... */}</form>;
}
```

## Multi-Step Forms

### Step State Management

```tsx
interface FormSteps {
  personal: { name: string; email: string };
  address: { street: string; city: string };
  payment: { cardNumber: string };
}

type StepName = keyof FormSteps;

function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState<StepName>('personal');
  const [formData, setFormData] = useState<Partial<FormSteps>>({});
  
  const steps: StepName[] = ['personal', 'address', 'payment'];
  const currentIndex = steps.indexOf(currentStep);
  
  const goNext = (stepData: FormSteps[typeof currentStep]) => {
    setFormData((prev) => ({ ...prev, [currentStep]: stepData }));
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };
  
  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleFinalSubmit = async () => {
    await submitToAPI(formData as FormSteps);
  };

  return (
    <div>
      {/* Progress indicator */}
      <nav aria-label="Form progress">
        <ol>
          {steps.map((step, index) => (
            <li 
              key={step}
              aria-current={step === currentStep ? 'step' : undefined}
            >
              {step}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step content */}
      {currentStep === 'personal' && (
        <PersonalStep 
          defaultValues={formData.personal} 
          onNext={goNext} 
        />
      )}
      {currentStep === 'address' && (
        <AddressStep 
          defaultValues={formData.address} 
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {currentStep === 'payment' && (
        <PaymentStep 
          defaultValues={formData.payment} 
          onSubmit={handleFinalSubmit}
          onBack={goBack}
        />
      )}
    </div>
  );
}
```

### Individual Step Component

```tsx
interface PersonalStepProps {
  defaultValues?: { name: string; email: string };
  onNext: (data: { name: string; email: string }) => void;
}

function PersonalStep({ defaultValues, onNext }: PersonalStepProps) {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <h2>Personal Information</h2>
      
      <input {...register('name')} placeholder="Name" />
      {errors.name && <span role="alert">{errors.name.message}</span>}
      
      <input {...register('email')} placeholder="Email" />
      {errors.email && <span role="alert">{errors.email.message}</span>}
      
      <button type="submit">Next</button>
    </form>
  );
}
```

## Form Dirty State

### Warn Before Leaving

```tsx
function FormWithUnsavedWarning() {
  const { formState: { isDirty } } = useForm();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return <form>{/* ... */}</form>;
}
```

### With React Router

```tsx
import { useBlocker } from 'react-router-dom';

function FormWithRouteGuard() {
  const { formState: { isDirty } } = useForm();
  
  const blocker = useBlocker(isDirty);

  return (
    <>
      {blocker.state === 'blocked' && (
        <dialog open>
          <p>You have unsaved changes. Are you sure you want to leave?</p>
          <button onClick={() => blocker.proceed()}>Leave</button>
          <button onClick={() => blocker.reset()}>Stay</button>
        </dialog>
      )}
      
      <form>{/* ... */}</form>
    </>
  );
}
```

## Optimistic Updates

### Show Pending State

```tsx
function FormWithOptimistic() {
  const [items, setItems] = useState<Item[]>([]);
  const [pendingItem, setPendingItem] = useState<Item | null>(null);
  
  const onSubmit = async (data: ItemFormData) => {
    const optimisticItem = { ...data, id: 'temp-id', isPending: true };
    
    // Show immediately
    setPendingItem(optimisticItem);
    
    try {
      const savedItem = await saveItem(data);
      setItems((prev) => [...prev, savedItem]);
    } catch (error) {
      // Handle error, item will disappear
    } finally {
      setPendingItem(null);
    }
  };

  return (
    <>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
        {pendingItem && (
          <li className="pending" aria-busy="true">
            {pendingItem.name} (saving...)
          </li>
        )}
      </ul>
      
      <form onSubmit={handleSubmit(onSubmit)}>{/* ... */}</form>
    </>
  );
}
```

## Form Reset Strategies

### Reset After Submit

```tsx
const onSubmit = async (data: FormData) => {
  await submitToAPI(data);
  reset(); // Clear all fields
};
```

### Reset to Default Values

```tsx
const defaultValues = { email: '', name: '' };

const { reset } = useForm({ defaultValues });

// Reset to original defaults
reset();

// Reset to new values
reset({ email: 'new@example.com', name: 'New Name' });
```

### Partial Reset

```tsx
const { resetField } = useForm();

// Reset single field to default
resetField('email');

// Reset with options
resetField('email', {
  keepError: true,      // Keep validation error
  keepDirty: true,      // Keep dirty state
  keepTouched: true,    // Keep touched state
  defaultValue: 'new@example.com', // New default
});
```

## Combining with External State

### With URL Search Params

```tsx
function FormWithURLState() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { register, watch } = useForm({
    defaultValues: {
      query: searchParams.get('q') || '',
      category: searchParams.get('cat') || 'all',
    },
  });

  // Sync form to URL
  useEffect(() => {
    const subscription = watch((data) => {
      const params = new URLSearchParams();
      if (data.query) params.set('q', data.query);
      if (data.category !== 'all') params.set('cat', data.category);
      setSearchParams(params, { replace: true });
    });
    
    return () => subscription.unsubscribe();
  }, [watch, setSearchParams]);

  return <form>{/* ... */}</form>;
}
```

### With Local Storage (Draft Saving)

```tsx
function FormWithDraft() {
  const STORAGE_KEY = 'contact-form-draft';
  
  const savedDraft = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : undefined;
  }, []);

  const { register, watch, reset, formState: { isSubmitSuccessful } } = useForm({
    defaultValues: savedDraft || { email: '', message: '' },
  });

  // Save draft on change
  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });
    
    return () => subscription.unsubscribe();
  }, [watch]);

  // Clear draft on successful submit
  useEffect(() => {
    if (isSubmitSuccessful) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isSubmitSuccessful]);

  return <form>{/* ... */}</form>;
}
```
