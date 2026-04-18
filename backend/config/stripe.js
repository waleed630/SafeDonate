import Stripe from 'stripe';
import dotenv from "dotenv";
dotenv.config();

let stripeInstance = null;

// Get the ACTUAL secret key from your Stripe Dashboard (Developers > API Keys)
// Make sure it matches your PUBLIC key from the frontend!
// You can find it at: https://dashboard.stripe.com/apikeys
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

// Only initialize if key exists from environment
if (STRIPE_KEY) {
  try {
    stripeInstance = new Stripe(STRIPE_KEY);
    console.log('✅ Stripe initialized successfully with secret key:', STRIPE_KEY.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ Error initializing Stripe:', error.message);
  }
} else {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables!');
  console.error('Please set STRIPE_SECRET_KEY in your backend .env file');
  console.log('Get your secret key from: https://dashboard.stripe.com/apikeys');
}

export default stripeInstance;