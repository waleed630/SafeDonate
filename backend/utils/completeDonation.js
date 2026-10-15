import Donation from '../models/Donation.js';
import Campaign from '../models/Campaign.js';
import { notifyCampaignGoalReachedIfNeeded } from './campaignGoalNotifications.js';
import { broadcastCampaignProgress } from '../socket/socketHandler.js';

/**
 * Marks a Stripe checkout as paid exactly once and adds it to the campaign total.
 * Both the webhook and the success-page verification call this, often at the same
 * time, so the status flip is a single atomic update: only the first caller wins.
 *
 * @returns the completed donation, or null if it was already completed / not found
 */
export async function completeDonationOnce(stripeSessionId, extraFields = {}) {
  const donation = await Donation.findOneAndUpdate(
    { stripeSessionId, status: { $ne: 'completed' } },
    { $set: { status: 'completed', ...extraFields } },
    { new: true },
  );
  if (!donation) return null;

  await Campaign.updateOne(
    { _id: donation.campaign },
    { $inc: { raisedAmount: donation.amount, donorCount: 1 } },
  );
  await notifyCampaignGoalReachedIfNeeded(donation.campaign);
  await broadcastCampaignProgress(donation.campaign).catch(() => {});

  return donation;
}
