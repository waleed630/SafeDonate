import Campaign from '../models/Campaign.js';
import { createNotification } from '../services/notificationService.js';
import logger from './logger.js';

/**
 * After raisedAmount is updated, notify fundraiser once when goal is first reached.
 */
export async function notifyCampaignGoalReachedIfNeeded(campaignId) {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.goalReachedNotified) return;
    if (!campaign.goalAmount || campaign.raisedAmount < campaign.goalAmount) return;

    campaign.goalReachedNotified = true;
    await campaign.save();

    const fundraiserId = campaign.fundraiser;
    await createNotification(
      fundraiserId,
      'campaign_goal',
      'Funding goal reached',
      `Congratulations! "${campaign.title}" has reached its funding goal of $${Number(campaign.goalAmount).toLocaleString()}.`,
      campaign._id,
    );
    logger.info(`[GOAL] Notified fundraiser for campaign ${campaign._id}`);
  } catch (e) {
    logger.error('[GOAL] notifyCampaignGoalReachedIfNeeded error:', e);
  }
}
