// config/stripe.js
import stripe from 'stripe';

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

export default stripeInstance;