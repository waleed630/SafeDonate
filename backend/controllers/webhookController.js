// controllers/webhookController.js
import stripe from '../config/stripe.js';
import logger from '../utils/logger.js';
import { completeDonationOnce } from '../utils/completeDonation.js';

export const stripeWebhook = async (req, res) => {
    // Check if Stripe is properly initialized
    if (!stripe) {
        logger.error('Stripe webhook handler called but Stripe not configured');
        return res.status(500).json({ 
            success: false, 
            message: 'Stripe is not configured.' 
        });
    }

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
        return res.status(400).send('Webhook signature verification failed');
    }

    // ✅ Only handle successful checkout
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        if (session.payment_status === 'paid') {
            try {
                // Atomic: safe even if /verify handles the same session at the same moment
                const donation = await completeDonationOnce(session.id, {
                    stripePaymentIntentId: session.payment_intent,
                });
                if (donation) {
                    logger.info(`✅ Donation completed | ID: ${donation._id} | Amount: ${donation.amount}`);
                }
            } catch (err) {
                logger.error('Webhook donation update failed:', err);
                return res.status(500).json({ received: false });
            }
        }
    }

    res.json({ received: true });
};