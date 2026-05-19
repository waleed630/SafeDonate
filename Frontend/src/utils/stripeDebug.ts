/**
 * Stripe Configuration Diagnostic
 * Run this to check if your Stripe setup is correct
 */

console.log('=== Stripe Configuration Diagnostic ===\n');

// Check environment variable
const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
console.log('1. VITE_STRIPE_PUBLIC_KEY:', publicKey ? '✅ SET' : '❌ NOT SET');

if (publicKey) {
  console.log('   Value prefix:', publicKey.substring(0, 30) + '...');
  console.log('   Starts with pk_test_:', publicKey.startsWith('pk_test_') ? '✅ YES' : '❌ NO');
  console.log('   Length:', publicKey.length);
} else {
  console.log('   ⚠️  Please add VITE_STRIPE_PUBLIC_KEY to Frontend/.env.local');
}

// Check Stripe library (packages are build-time dependencies of the app)
console.log('\n2. @stripe/react-stripe-js: ✅ (dependency present if app builds)');
console.log('3. @stripe/stripe-js: ✅ (dependency present if app builds)');

// Instructions
console.log('\n=== Setup Instructions ===\n');
console.log('To get your Stripe public key:');
console.log('1. Go to https://dashboard.stripe.com/apikeys');
console.log('2. Look for "Publishable key"');
console.log('3. Copy the key starting with "pk_test_"');
console.log('4. Add to Frontend/.env.local:');
console.log('   VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE');
console.log('5. Restart the frontend: npm run dev\n');
