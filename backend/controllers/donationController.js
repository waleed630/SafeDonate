// controllers/donationController.js
import stripe from '../config/stripe.js';
import Donation from '../models/Donation.js';
import Campaign from '../models/Campaign.js';
import { getFrontendUrl } from '../utils/getFrontendUrl.js';
import logger from '../utils/logger.js';

export const createDonationSession = async (req, res) => {
    try {
        // Check if Stripe is properly initialized
        if (!stripe) {
            return res.status(500).json({ 
                success: false, 
                message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.' 
            });
        }

        const { campaignId, amount } = req.body;

        if (req.user && req.user.role && req.user.role !== 'donor') {
            return res.status(403).json({ success: false, message: 'Only donors can make donations' });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

        const frontendUrl = getFrontendUrl(req);
        const donorId = req.user?.role === 'donor' ? req.user._id.toString() : undefined;
        const metadata = {
            campaignId: campaignId.toString(),
        };

        if (donorId) {
            metadata.donorId = donorId;
        }

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
            success_url: `${frontendUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/donation/cancel`,
            client_reference_id: campaignId,
            metadata,
        });

        console.log('✅ Stripe session created:', session.id);
        console.log('🔍 Session object:', JSON.stringify(session, null, 2));

        const donation = new Donation({
            campaign: campaignId,
            donor: req.user?.role === 'donor' ? req.user._id : undefined,
            amount,
            stripeSessionId: session.id,
        });
        await donation.save();

        res.json({ success: true, sessionId: session.id, checkoutUrl: session.url });
    } catch (error) {
        logger.error('Donation session error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getDonationHistory = async (req, res) => {
    try {
        const donations = await Donation.find({ donor: req.user._id })
            .populate('campaign', 'title description category')
            .sort({ timestamp: -1 });

        res.json({
            success: true,
            donations: donations.map(d => ({
                _id: d._id,
                id: d._id.toString(), // For compatibility
                campaign: d.campaign?.title || 'Unknown Campaign',
                campaignId: d.campaign?._id,
                amount: d.amount,
                status: d.status,
                verified: d.status === 'completed',
                timestamp: d.timestamp,
                date: new Date(d.timestamp).toLocaleDateString(),
                transactionId: d.stripeSessionId,
                receiptUrl: d.receiptUrl,
            })),
        });
    } catch (error) {
        logger.error('Get donation history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getRecentDonations = async (req, res) => {
    try {
        const donations = await Donation.find()
            .populate('campaign', 'title')
            .populate('donor', 'username name email profilePicture')
            .sort({ timestamp: -1 })
            .limit(5);

        res.json({
            success: true,
            donations: donations.map(d => {
                const donorName = d.donor?.name || d.donor?.username || d.donor?.email || 'Anonymous';
                return {
                    _id: d._id,
                    id: d._id.toString(),
                    amount: d.amount,
                    campaign: d.campaign?.title || 'Unknown Campaign',
                    campaignId: d.campaign?._id,
                    verified: d.status === 'completed',
                    donorName,
                    donorAvatar: d.donor?.profilePicture || `https://i.pravatar.cc/150?u=${encodeURIComponent(d.donor?._id?.toString() || donorName)}`,
                    timestamp: d.timestamp || d.createdAt,
                };
            }),
        });
    } catch (error) {
        logger.error('Get recent donations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getDonationsByCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        console.log('Getting donations for campaign:', campaignId);
        const donations = await Donation.find({ campaign: campaignId, status: 'completed' })
            .populate('donor', 'username name email profilePicture')
            .sort({ timestamp: -1 })
            .limit(10);

        console.log('Found donations:', donations.length);
        res.json({
            success: true,
            donations: donations.map(d => {
                const donorName = d.donor?.name || d.donor?.username || d.donor?.email || 'Anonymous';
                return {
                    _id: d._id,
                    id: d._id.toString(),
                    amount: d.amount,
                    verified: true,
                    donorName,
                    donorAvatar: d.donor?.profilePicture || `https://i.pravatar.cc/150?u=${encodeURIComponent(d.donor?._id?.toString() || donorName)}`,
                    timestamp: d.timestamp || d.createdAt,
                };
            }),
        });
    } catch (error) {
        logger.error('Get donations by campaign error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find()
            .populate('campaign', 'title')
            .populate('donor', 'username name email profilePicture')
            .sort({ timestamp: -1 });

        res.json({
            success: true,
            donations: donations.map(d => {
                const donorName = d.donor?.name || d.donor?.username || d.donor?.email || 'Anonymous';
                return {
                    _id: d._id,
                    id: d._id.toString(),
                    transactionId: d.stripeSessionId,
                    campaign: d.campaign?.title || 'Unknown Campaign',
                    donorName,
                    donorAvatar: d.donor?.profilePicture || `https://i.pravatar.cc/150?u=${encodeURIComponent(d.donor?._id?.toString() || donorName)}`,
                    amount: d.amount,
                    timestamp: d.timestamp || d.createdAt,
                    status: d.status,
                    payoutStatus: d.status === 'completed' ? 'paid' : 'pending',
                };
            }),
        });
    } catch (error) {
        logger.error('Get all donations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const verifyDonation = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ 
                success: false, 
                message: 'Stripe is not configured.' 
            });
        }

        const { session_id } = req.query;
        
        if (!session_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Session ID is required' 
            });
        }

        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        if (!session) {
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found' 
            });
        }

        // Find the donation by session ID
        const donation = await Donation.findOne({ stripeSessionId: session_id })
            .populate('campaign', 'title');

        if (!donation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Donation not found' 
            });
        }

        // Check payment status
        if (session.payment_status === 'paid') {
            // Update donation status if not already completed
            if (donation.status !== 'completed') {
                donation.status = 'completed';
                await donation.save();
                
                // Update campaign raised amount
                await Campaign.findByIdAndUpdate(
                    donation.campaign._id,
                    { $inc: { raisedAmount: donation.amount } }
                );
            }
        }

        res.json({
            success: true,
            donation: {
                _id: donation._id,
                amount: donation.amount,
                campaignTitle: donation.campaign.title,
                status: donation.status,
                timestamp: donation.timestamp,
                paymentStatus: session.payment_status,
            }
        });
    } catch (error) {
        logger.error('Verify donation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};