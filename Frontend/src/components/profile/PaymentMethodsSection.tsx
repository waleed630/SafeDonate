import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { AddPaymentMethodModal } from './AddPaymentMethodModal';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export function PaymentMethodsSection() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [isCreatingSetupIntent, setIsCreatingSetupIntent] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/payment-methods');
      if (response.data.success) {
        setMethods(response.data.paymentMethods || []);
      }
    } catch (err: any) {
      console.error('Error fetching payment methods:', err);
      setError(err.response?.data?.message || 'Failed to fetch payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await api.put(`/payment-methods/${paymentMethodId}/set-default`);
      if (response.data.success) {
        // Refresh payment methods
        await fetchPaymentMethods();
      }
    } catch (err: any) {
      console.error('Error setting default payment method:', err);
      alert(err.response?.data?.message || 'Failed to set default payment method');
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      const response = await api.delete(`/payment-methods/${paymentMethodId}`);
      if (response.data.success) {
        // Refresh payment methods
        await fetchPaymentMethods();
      }
    } catch (err: any) {
      console.error('Error removing payment method:', err);
      alert(err.response?.data?.message || 'Failed to remove payment method');
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setIsCreatingSetupIntent(true);
      const response = await api.post('/payment-methods/setup-intent');
      if (response.data.success) {
        setClientSecret(response.data.clientSecret);
        setShowAddModal(true);
        console.log('✅ Setup intent created with clientSecret');
      }
    } catch (err: any) {
      console.error('Error creating setup intent:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create setup intent';
      alert(errorMsg);
    } finally {
      setIsCreatingSetupIntent(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Payment methods</h3>
        <p className="text-slate-500">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-4">Payment methods</h3>
      <p className="text-slate-500 text-sm mb-4">
        Manage your saved cards for faster checkout. Payments are secured via Stripe.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {methods.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">No payment methods saved yet.</p>
        ) : (
          methods.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 rounded bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  {pm.brand.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {pm.brand} •••• {pm.last4}
                  </p>
                  <p className="text-xs text-slate-500">
                    Expires {String(pm.expMonth).padStart(2, '0')}/{pm.expYear}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pm.isDefault && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                    Default
                  </span>
                )}
                {!pm.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(pm.id)}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(pm.id)}
                  className="text-sm text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={handleAddPaymentMethod}
        disabled={isCreatingSetupIntent}
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreatingSetupIntent ? 'Setting up...' : '+ Add payment method'}
      </button>
      <p className="text-xs text-slate-400 mt-3">
        You can also manage payment methods and billing in the secure Stripe Customer Portal when making a donation.
      </p>

      <AddPaymentMethodModal
        clientSecret={clientSecret}
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setClientSecret('');
        }}
        onSuccess={fetchPaymentMethods}
      />
    </div>
  );
}
