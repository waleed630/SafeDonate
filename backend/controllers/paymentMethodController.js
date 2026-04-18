// controllers/paymentMethodController.js
import stripe from '../config/stripe.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Get all saved payment methods for the user
export const getPaymentMethods = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        success: false, 
        message: 'Stripe is not configured' 
      });
    }

    const user = req.user;
    
    // If user doesn't have a Stripe customer ID, return empty list
    if (!user.stripeCustomerId) {
      return res.json({ success: true, paymentMethods: [] });
    }

    // Fetch payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    // Get default payment method
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);

    const methods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1),
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      isDefault: customer.invoice_settings?.default_payment_method === pm.id,
    }));

    res.json({ success: true, paymentMethods: methods });
  } catch (error) {
    logger.error('Error fetching payment methods:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment methods' 
    });
  }
};

// Set a payment method as default
export const setDefaultPaymentMethod = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        success: false, 
        message: 'Stripe is not configured' 
      });
    }

    const { paymentMethodId } = req.params;
    const user = req.user;

    if (!paymentMethodId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment method ID is required' 
      });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User has no Stripe customer account' 
      });
    }

    // Update customer's default payment method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({ 
      success: true, 
      message: 'Default payment method updated' 
    });
  } catch (error) {
    logger.error('Error setting default payment method:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to set default payment method' 
    });
  }
};

// Delete a payment method
export const deletePaymentMethod = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        success: false, 
        message: 'Stripe is not configured' 
      });
    }

    const { paymentMethodId } = req.params;

    if (!paymentMethodId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment method ID is required' 
      });
    }

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({ 
      success: true, 
      message: 'Payment method removed successfully' 
    });
  } catch (error) {
    logger.error('Error deleting payment method:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete payment method' 
    });
  }
};

// Get Stripe setup intent (for adding new payment method)
export const createSetupIntent = async (req, res) => {
  try {
    // Debug logging
    console.log('[DEBUG] createSetupIntent - STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('[DEBUG] createSetupIntent - stripe instance:', !!stripe);
    
    if (!stripe) {
      console.error('[ERROR] Stripe is not configured - STRIPE_SECRET_KEY missing or invalid');
      return res.status(500).json({ 
        success: false, 
        message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.' 
      });
    }

    const user = req.user;
    
    // Validate user has required fields
    if (!user.email || !user.name) {
      return res.status(400).json({
        success: false,
        message: 'User email and name are required'
      });
    }

    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
        });
        customerId = customer.id;
        
        // Save Stripe customer ID to user
        user.stripeCustomerId = customerId;
        await user.save();
      } catch (customerError) {
        logger.error('Error creating Stripe customer:', customerError.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to create Stripe customer'
        });
      }
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    res.json({ 
      success: true, 
      clientSecret: setupIntent.client_secret 
    });
  } catch (error) {
    logger.error('Error creating setup intent:', error.message || error);
    console.error('Detailed error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create setup intent: ' + (error.message || 'Unknown error')
    });
  }
};
