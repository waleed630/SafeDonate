import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Log for debugging
if (!publicKey) {
  console.error('❌ VITE_STRIPE_PUBLIC_KEY is not set. Please check your .env.local file.');
} else {
  console.log('✅ Stripe public key detected (first 20 chars):', publicKey.substring(0, 20));
}

const stripePromise = publicKey ? loadStripe(publicKey) : null;

interface AddPaymentMethodModalProps {
  clientSecret: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentForm({ onClose, onSuccess }: Pick<AddPaymentMethodModalProps, 'onClose' | 'onSuccess'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('[PaymentForm] Stripe loaded:', !!stripe);
    console.log('[PaymentForm] Elements loaded:', !!elements);
  }, [stripe, elements]);

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 text-sm">Initializing payment form...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Payment processing unavailable. Please refresh and try again.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Confirm the setup intent with the payment information
      const { error: setupError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}`,
        },
      });

      if (setupError) {
        setError(setupError.message || 'Failed to add payment method. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (setupIntent?.status === 'succeeded') {
        console.log('✅ Payment method added successfully:', setupIntent.id);
        alert('Payment method added successfully!');
        onSuccess(); // Trigger refresh and close
        onClose();
      } else {
        setError('Unexpected status. Please contact support.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Error confirming setup intent:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !stripe || !elements}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Add Payment Method'}
        </button>
      </div>
    </form>
  );
}

export function AddPaymentMethodModal({
  clientSecret,
  isOpen,
  onClose,
  onSuccess,
}: AddPaymentMethodModalProps) {
  if (!isOpen) return null;

  if (!stripePromise) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Configuration Error</h2>
          </div>
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-700 font-medium">Stripe is not configured</p>
              <p className="text-xs text-red-600 mt-2">
                The VITE_STRIPE_PUBLIC_KEY environment variable is missing from your <code className="bg-red-100 px-1 rounded">.env.local</code> file.
              </p>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              <strong>To fix:</strong>
            </p>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside mb-4">
              <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Stripe Dashboard</a></li>
              <li>Copy your Publishable Key (starts with <code className="bg-slate-100 px-1">pk_test_</code>)</li>
              <li>Add it to <code className="bg-slate-100 px-1">Frontend/.env.local</code>:
                <pre className="mt-1 bg-slate-100 p-2 rounded text-xs overflow-auto">VITE_STRIPE_PUBLIC_KEY=pk_test_...</pre>
              </li>
              <li>Restart the frontend with <code className="bg-slate-100 px-1">npm run dev</code></li>
            </ol>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">No client secret provided. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Add Payment Method</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter your card details securely via Stripe
          </p>
        </div>

        <div className="p-6 min-h-96 flex flex-col">
          {stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#059669',
                    colorDanger: '#dc2626',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    borderRadius: '0.5rem',
                    spacingUnit: '4px',
                  },
                },
              }}
            >
              <PaymentForm onClose={onClose} onSuccess={onSuccess} />
            </Elements>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 text-sm">Loading payment form...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
