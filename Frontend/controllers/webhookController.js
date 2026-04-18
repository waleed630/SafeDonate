// controllers/webhookController.js
import stripe from '../config/stripe.js';
import Donation from '../models/Donation.js';
import Campaign from '../models/Campaign.js';
import logger from '../utils/logger.js';

export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        logger.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Only handle successful checkout
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Find donation
        const donation = await Donation.findOne({ stripeSessionId: session.id });

        if (donation && donation.status !== 'completed') {   // ← Prevents double processing
            // === NEW FIELDS FOR TRANSPARENT TRACKING ===
            donation.status = 'completed';
            donation.stripePaymentIntentId = session.payment_intent;   // For receipt
            donation.receiptUrl = session.receipt_url;                 // Direct Stripe receipt link

            await donation.save();

            // Real-time campaign update
            const campaign = await Campaign.findById(donation.campaign);
            if (campaign) {
                campaign.raisedAmount += donation.amount;
                campaign.donorCount += 1;
                await campaign.save();
            }

            logger.info(`✅ Donation completed & campaign updated | 
                Donation ID: ${donation._id} | 
                Amount: ${donation.amount} | 
                Campaign: ${campaign?.title}`);
        }
    }

    res.json({ received: true });
};