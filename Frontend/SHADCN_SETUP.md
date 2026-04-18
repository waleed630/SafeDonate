# shadcn/UI Setup Complete ✨

Your SafeDonate project now includes shadcn/UI with beautiful, accessible components!

## What's Installed

### Core Components
- **Button** - Versatile button component with multiple variants
- **Dialog** - Modal dialogs for custom interactions  
- **AlertDialog** - Alert dialogs for confirmations and errors
- **Toast** - Toast notifications with auto-dismiss
- **Toast Hook** - `useToast()` for programmatic toast management

### Dependencies
- `@radix-ui/react-dialog` - Dialog primitives
- `@radix-ui/react-alert-dialog` - Alert dialog primitives
- `@radix-ui/react-toast` - Toast primitives
- `@radix-ui/react-slot` - Slot utility
- `class-variance-authority` - Variant management
- `clsx` & `tailwind-merge` - CSS utilities
- `lucide-react` - Icon library

## Quick Start

### 1. Using Toast Notifications

```typescript
import { useToast } from '@/hooks/use-toast';

export function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: '✨ Success!',
      description: 'Your action completed successfully.',
      variant: 'success', // 'default' | 'destructive' | 'success'
    });
  };

  const handleError = () => {
    toast({
      title: '❌ Error',
      description: 'Something went wrong. Please try again.',
      variant: 'destructive',
    });
  };

  return (
    <>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </>
  );
}
```

### 2. Using AlertDialog for Confirmations

```typescript
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog';
import { useState } from 'react';

export function ConfirmAction() {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    console.log('Action confirmed!');
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}>Delete Account</button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

### 3. Using Dialog for Custom Modals

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export function CustomModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Modal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new fundraising campaign.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <input 
            type="text" 
            placeholder="Campaign title"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <textarea 
            placeholder="Campaign description"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <DialogFooter>
          <Button type="submit">Create Campaign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4. Using Button Component

```typescript
import { Button } from '@/components/ui/Button';

export function ButtonExamples() {
  return (
    <div className="space-y-4">
      {/* Variants */}
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>

      {/* Sizes */}
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>

      {/* Disabled */}
      <Button disabled>Disabled</Button>
    </div>
  );
}
```

## RegisterPage Integration

The RegisterPage has been updated with:

✅ **AlertDialog** - Shows elegant error messages for validation errors
✅ **Toast** - Success notification when registration completes
✅ **Form Validation** - Comprehensive client-side validation
✅ **Loading State** - Visual feedback while processing
✅ **Better UX** - Professional error handling

Example error cases now shown:
- Missing first/last name
- Invalid email format
- Weak password
- Terms not accepted
- Server errors (User already exists, etc.)

## Component Files Location

```
src/
├── components/ui/
│   ├── Button.tsx           # Base button component
│   ├── Dialog.tsx           # Modal dialog
│   ├── AlertDialog.tsx      # Alert dialog
│   ├── Toast.tsx            # Toast notifications
│   └── Toaster.tsx          # Toast renderer
├── hooks/
│   └── use-toast.ts         # Toast hook
└── lib/
    └── utils.ts             # Utility functions
```

## Adding More Components

To add more shadcn/ui components in the future, you can:

1. Install the required Radix UI primitive:
   ```bash
   npm install @radix-ui/react-COMPONENT-NAME
   ```

2. Create the component file in `src/components/ui/`

3. Use TypeScript for type safety

## Customization

All components use Tailwind CSS for styling. To customize:

1. Edit the component files in `src/components/ui/`
2. Modify the Tailwind classes to match your design
3. Update color schemes in the `cn()` utility function

## Available Toast Variants

- `default` - Standard toast
- `destructive` - Error/warning (red)
- `success` - Success message (green)

## Notes

- The `Toaster` component is already rendered in `App.tsx`
- Always use `@/` path aliases for cleaner imports
- All components are fully accessible and follow WAI-ARIA guidelines
