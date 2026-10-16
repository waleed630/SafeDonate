import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { API_BASE_URL } from '../api/axios';

type GoogleRole = 'donor' | 'fundraiser';

const ROLE_OPTIONS: { role: GoogleRole; label: string; icon: string; hint: string }[] = [
  { role: 'donor', label: 'Donor', icon: 'fa-heart', hint: 'Give to campaigns' },
  { role: 'fundraiser', label: 'Fundraiser', icon: 'fa-hand-holding-heart', hint: 'Start campaigns' },
];

/** Shown next to the Google button so people pick a role before using it. */
export function GoogleRoleHint({ pickerPosition = 'below', className = '-mt-1' }: { pickerPosition?: 'above' | 'below'; className?: string }) {
  return (
    <p className={`text-xs text-slate-500 flex items-center gap-1.5 ${className}`}>
      <i className="fa-solid fa-circle-info text-emerald-600" />
      New here? Select your role {pickerPosition} before continuing with Google.
    </p>
  );
}

/**
 * Confirms which role a brand-new Google account should get before leaving for Google.
 * Existing accounts keep their role (the backend ignores this for them), including admins.
 */
export function GoogleRoleDialog({
  open,
  onOpenChange,
  selectedRole,
  onRoleChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRole: string;
  onRoleChange?: (role: GoogleRole) => void;
}) {
  const [role, setRole] = useState<GoogleRole>('donor');

  useEffect(() => {
    if (open) setRole(selectedRole === 'fundraiser' ? 'fundraiser' : 'donor');
  }, [open, selectedRole]);

  const label = role === 'fundraiser' ? 'Fundraiser' : 'Donor';

  const handleContinue = () => {
    onRoleChange?.(role);
    window.location.href = `${API_BASE_URL}/auth/google?role=${role}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Continue with Google as a {label}?</DialogTitle>
          <DialogDescription>
            If this is your first time, your SafeDonate account will be created as a{' '}
            <span className="font-semibold text-slate-700">{label.toLowerCase()}</span>. You can change it below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.role}
              type="button"
              onClick={() => setRole(opt.role)}
              aria-pressed={role === opt.role}
              className={`rounded-xl border-2 p-3 text-left transition-colors ${
                role === opt.role
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-emerald-200'
              }`}
            >
              <i className={`fa-solid ${opt.icon} ${role === opt.role ? 'text-emerald-600' : 'text-slate-400'}`} />
              <p className="mt-1 text-sm font-semibold text-slate-800">{opt.label}</p>
              <p className="text-xs text-slate-500">{opt.hint}</p>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          Already have an account with this Google email? You'll sign in with your existing role.
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 flex items-center justify-center gap-2"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4 bg-white rounded-full" alt="" />
            Continue as {label}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
