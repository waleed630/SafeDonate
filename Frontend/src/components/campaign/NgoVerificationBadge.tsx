export type NgoVerificationSnapshot = {
  verified?: boolean;
  level?: string;
  registry_type?: string;
  checked_at?: string;
};

interface NgoVerificationBadgeProps {
  campaignType?: string;
  /** Campaign moderation status from backend */
  campaignStatus?: string;
  ngoVerification?: NgoVerificationSnapshot | null;
  /** Card/list layout vs detail page */
  variant?: 'inline' | 'prominent';
}

/**
 * NGO registry trust badge — only rendered for campaign_type === 'ngo'.
 */
export function NgoVerificationBadge({
  campaignType,
  campaignStatus,
  ngoVerification,
  variant = 'inline',
}: NgoVerificationBadgeProps) {
  if (campaignType !== 'ngo') return null;

  const nv = ngoVerification || {};
  const level = nv.level || 'unverified';
  const registryOk =
    nv.verified === true && (level === 'government' || level === 'admin');

  const isPendingReview = campaignStatus === 'pending';

  const wrap =
    variant === 'prominent'
      ? 'flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium'
      : 'flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold mb-2 mt-1';

  if (registryOk) {
    const body =
      level === 'government'
        ? `Verified NGO — Registered with ${nv.registry_type || 'authority'}`
        : 'Verified NGO — Confirmed by SafeDonate admin';
    return (
      <div className={`${wrap} border-emerald-200 bg-emerald-50 text-emerald-800`}>
        <i className="fa-solid fa-shield-halved text-emerald-600" aria-hidden />
        <span>{body}</span>
      </div>
    );
  }

  if (isPendingReview) {
    return (
      <div className={`${wrap} border-amber-200 bg-amber-50 text-amber-900`}>
        <i className="fa-regular fa-clock text-amber-600" aria-hidden />
        <span>Pending NGO verification — Admin may review credentials</span>
      </div>
    );
  }

  return (
    <div className={`${wrap} border-slate-200 bg-slate-50 text-slate-600`}>
      <i className="fa-regular fa-circle-question text-slate-500" aria-hidden />
      <span>NGO not matched to national registry snapshot — donate carefully</span>
    </div>
  );
}
