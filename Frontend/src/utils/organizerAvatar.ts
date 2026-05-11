/** Fundraiser ref as returned from campaign APIs (populate). */
export type FundraiserAvatarRef = {
  profilePicture?: string | null;
  username?: string | null;
  email?: string | null;
  _id?: string;
} | null | undefined;

/**
 * Prefer the organizer's uploaded profile image; otherwise a neutral initial-based avatar (not random faces).
 */
export function organizerAvatarUrl(f: FundraiserAvatarRef): string {
  const pic = f?.profilePicture?.trim();
  if (pic) return pic;
  const name = encodeURIComponent(f?.username || f?.email || 'Organizer');
  return `https://ui-avatars.com/api/?name=${name}&background=e2e8f0&color=64748b&size=128&bold=true`;
}
