import { Modal } from './ui/Modal';
import { formatTimestamp } from '../data/mockData';

/** Minimum fields for a receipt (matches API donation history + mock data) */
export type ReceiptDonation = {
  transactionId: string;
  campaign: string;
  amount: number;
  timestamp: string;
  status: string;
  verified: boolean;
};

interface DonationReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: ReceiptDonation | null;
}

export function DonationReceiptModal({ isOpen, onClose, donation }: DonationReceiptModalProps) {
  if (!donation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Donation Receipt" size="md">
      <div className="space-y-6">
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-3">
            <i className="fa-solid fa-receipt text-2xl" />
          </div>
          <p className="text-sm text-slate-500">Transaction #{donation.transactionId}</p>
          {donation.verified && (
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              <i className="fa-solid fa-shield-check" /> Verified
            </span>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Campaign</span>
            <span className="font-medium text-slate-800">{donation.campaign}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount</span>
            <span className="font-semibold text-emerald-600">${donation.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date & Time</span>
            <span className="text-slate-800">{formatTimestamp(donation.timestamp)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <span className="text-emerald-600 font-medium capitalize">{donation.status}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-print" /> Print
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
            Done
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center">
          This is a mock receipt. For production, connect to your payment provider for real receipts.
        </p>
      </div>
    </Modal>
  );
}
