import VerifiedNGO from '../models/VerifiedNGO.js';

export function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeRegistrationNumber(value) {
  return String(value || '')
    .replace(/[\s\-/.]/g, '')
    .toUpperCase();
}

export function buildTokenRegex(name) {
  const raw = String(name || '').trim();
  const words = raw.split(/\s+/).filter((w) => w.length >= 2).map(escapeRegex);
  if (words.length === 0) {
    const single = escapeRegex(raw);
    return single ? new RegExp(single, 'i') : null;
  }
  return new RegExp(words.map((w) => `(?=.*${w})`).join(''), 'i');
}

export function toMatchedRecord(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  return {
    _id: o._id,
    name: o.name,
    aliases: o.aliases || [],
    registration_number: o.registration_number,
    registry_type: o.registry_type,
    category: o.category,
    website: o.website,
    is_verified: o.is_verified,
  };
}

/**
 * Local registry check: fuzzy name (+ aliases), optional registration match.
 */
export async function verifyOrganization(organization_name, registration_number) {
  const rawName = String(organization_name || '').trim();
  if (!rawName) {
    return {
      verified: false,
      verification_level: 'unverified',
      matched_record: null,
      message: 'Organization name is required.',
    };
  }

  const regNorm = normalizeRegistrationNumber(registration_number);
  const tokenPattern = buildTokenRegex(rawName);
  if (!tokenPattern) {
    return {
      verified: false,
      verification_level: 'unverified',
      matched_record: null,
      message: 'Organization name is required.',
    };
  }

  let matches = await VerifiedNGO.find({
    is_verified: true,
    $or: [{ name: tokenPattern }, { aliases: tokenPattern }],
  })
    .limit(25)
    .lean();

  if (matches.length === 0) {
    const ordered = new RegExp(escapeRegex(rawName).replace(/\s+/g, '\\s+'), 'i');
    matches = await VerifiedNGO.find({
      is_verified: true,
      $or: [{ name: ordered }, { aliases: ordered }],
    })
      .limit(25)
      .lean();
  }

  if (matches.length === 0) {
    return {
      verified: false,
      verification_level: 'unverified',
      matched_record: null,
      message:
        'No matching organization was found in the national NGO registry snapshot used by SafeDonate.',
    };
  }

  const lower = rawName.toLowerCase();
  matches.sort((a, b) => {
    const aExact = a.name.toLowerCase() === lower ? 0 : 1;
    const bExact = b.name.toLowerCase() === lower ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    const aAlias = (a.aliases || []).some((x) => String(x).toLowerCase() === lower) ? 0 : 1;
    const bAlias = (b.aliases || []).some((x) => String(x).toLowerCase() === lower) ? 0 : 1;
    if (aAlias !== bAlias) return aAlias - bAlias;
    return String(a.name).length - String(b.name).length;
  });

  const best = matches[0];

  if (!regNorm && matches.length > 1) {
    return {
      verified: false,
      verification_level: 'unverified',
      matched_record: toMatchedRecord(best),
      message:
        'Several registry entries match parts of this name. Enter your official registration number or pick the exact organization from search suggestions.',
    };
  }

  const docNorm = normalizeRegistrationNumber(best.registration_number);
  if (regNorm && docNorm !== regNorm) {
    return {
      verified: false,
      verification_level: 'unverified',
      matched_record: toMatchedRecord(best),
      message:
        'This name is similar to a registered NGO, but the registration number does not match our records. You can still submit; an admin may review your credentials.',
    };
  }

  return {
    verified: true,
    verification_level: 'government',
    matched_record: toMatchedRecord(best),
    message: `Matched registered NGO (${best.registry_type}).`,
  };
}
