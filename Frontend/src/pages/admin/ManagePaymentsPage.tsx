import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatTimestamp } from '../../data/mockData';

type PayoutStatus = 'pending' | 'paid' | 'failed';

interface PaymentRecord {
  id: string;
  transactionId: string;
  campaign: string;
  donorName: string;
  donorAvatar?: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  payoutStatus: PayoutStatus;
}

export function ManagePaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/donations/admin/all');
        setPayments(response.data?.donations || []);
      } catch (err: any) {
        console.error('Failed to load payments:', err);
        setError(err?.response?.data?.message || err?.message || 'Unable to load payments');
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, []);

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Manage Payments</h1>
      <p className="text-slate-500 mb-8">View and manage platform transactions and payouts</p>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Transaction ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Donor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Payout</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Loading payments...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-mono text-sm text-slate-700">{d.transactionId}</td>
                    <td className="px-4 py-4 text-slate-800">{d.campaign}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <img src={d.donorAvatar || 'https://i.pravatar.cc/150'} alt="" className="w-8 h-8 rounded-full" />
                        <span className="text-slate-700">{d.donorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-emerald-600">${d.amount.toLocaleString()}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm">{formatTimestamp(d.timestamp)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : d.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.payoutStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : d.payoutStatus === 'pending'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {d.payoutStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {d.payoutStatus === 'pending' && (
                          <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                            Mark paid
                          </button>
                        )}
                        <button className="text-rose-600 hover:text-rose-700 text-sm font-medium">Refund</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
