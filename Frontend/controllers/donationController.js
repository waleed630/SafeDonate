// controllers/donationController.js
import stripe from '../config/stripe.js';
import Donation from '../models/Donation.js';
import Campaign from '../models/Campaign.js';
import logger from '../utils/logger.js';

export const createDonationSession = async (req, res) => {
    try {
        const { campaignId, amount } = req.body;

        if (req.user.role !== 'donor') {
            return res.status(403).json({ success: false, message: 'Only donors can make donations' });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Donation to ${campaign.title}`,
                    },
                    unit_amount: amount * 100, // in cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.APP_URL}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.APP_URL}/donation/cancel`,
            client_reference_id: campaignId, // to link back
            metadata: {
                donorId: req.user._id.toString(),
                campaignId: campaignId.toString(),
            },
        });

        const donation = new Donation({
            campaign: campaignId,
            donor: req.user._id,
            amount,
            stripeSessionId: session.id,
        });
        await donation.save();

        res.json({ success: true, sessionId: session.id });
    } catch (error) {
        logger.error('Donation session error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};