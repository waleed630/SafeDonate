// services/demoData.js
// Creates (or restores) the shared demo accounts and their sample data so every
// visitor of the portfolio demo starts from the same state.
import crypto from 'crypto';
import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import ContactMessage from '../models/ContactMessage.js';
import logger from '../utils/logger.js';

const DEMO_USERS = {
  admin: { email: 'demo-admin@safedonate.demo', username: 'Demo Admin' },
  fundraiser: { email: 'demo-fundraiser@safedonate.demo', username: 'Ayesha (Demo Fundraiser)' },
  donor: { email: 'demo-donor@safedonate.demo', username: 'Bilal (Demo Donor)', interests: ['Medical', 'Education'] },
};

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const DEMO_CAMPAIGNS = [
  {
    key: 'surgery',
    title: 'Heart Surgery for 8-year-old Hamza',
    category: 'Medical',
    tags: ['Urgent', 'Verified'],
    description:
      'Hamza was born with a hole in his heart and needs open-heart surgery at a children\'s hospital in Lahore. ' +
      'His father is a daily-wage worker and cannot cover the cost. Funds go directly to the hospital account, ' +
      'and we will post the invoice and discharge summary as updates on this page.',
    image: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?auto=compress&cs=tinysrgb&w=1200',
    goalAmount: 5000,
    status: 'approved',
    fraudScore: 12,
    donations: [250, 100, 500, 75, 1200],
  },
  {
    key: 'school',
    title: 'Computer Lab for a Rural Girls School',
    category: 'Education',
    tags: ['Featured'],
    description:
      'A government girls school in a village near Multan has 300 students and no working computers. ' +
      'This campaign will buy 10 refurbished laptops, a projector and one year of internet, so students can ' +
      'learn basic computing before they finish school. The headmistress will share photos once the lab is set up.',
    image: 'https://images.pexels.com/photos/8613089/pexels-photo-8613089.jpeg?auto=compress&cs=tinysrgb&w=1200',
    goalAmount: 3500,
    status: 'approved',
    fraudScore: 8,
    donations: [300, 150, 50],
  },
  {
    key: 'shelter',
    title: 'Winter Shelter for Stray Animals',
    category: 'Animals',
    tags: ['New'],
    description:
      'Every winter dozens of stray dogs and cats in our neighbourhood die from the cold. We want to build a small ' +
      'insulated shelter with bedding, food and basic vet care for the season, run by local volunteers who already ' +
      'feed these animals every day.',
    image: 'https://images.pexels.com/photos/1904105/pexels-photo-1904105.jpeg?auto=compress&cs=tinysrgb&w=1200',
    goalAmount: 1200,
    status: 'pending',
    fraudScore: 22,
    donations: [],
  },
  {
    key: 'suspicious',
    title: 'URGENT please help me god bless',
    category: 'Medical',
    tags: ['Urgent'],
    description:
      'Please help me urgent emergency, I need money very fast for my family. God bless everyone who sends money ' +
      'today. Please help, this is an emergency and there is no time. Send now and share with everyone you know.',
    image: null,
    goalAmount: 75000,
    status: 'pending',
    fraudScore: 78,
    donations: [],
  },
  {
    key: 'ngo',
    title: 'Clean Water Wells in Tharparkar',
    category: 'Medical',
    tags: [],
    description:
      'Our trust has been installing hand-pump wells in Tharparkar since 2019. Each well serves around 40 families ' +
      'and costs about $600 including the pump and a concrete base. This campaign will fund five new wells before ' +
      'summer, with GPS photos of every completed well.',
    image: 'https://images.pexels.com/photos/1739855/pexels-photo-1739855.jpeg?auto=compress&cs=tinysrgb&w=1200',
    goalAmount: 3000,
    status: 'pending',
    fraudScore: 15,
    ngo: { organization_name: 'Hope Relief Trust (Demo)', organization_registration_number: 'DEMO-12345' },
    donations: [],
  },
  {
    key: 'rejected',
    title: 'Fund My Vacation to Dubai',
    category: 'Creative',
    tags: [],
    description:
      'I have always wanted to visit Dubai and I think the people of the internet should pay for it. I will post ' +
      'pictures from the trip so you can see how much fun I am having with your money. Thanks in advance everyone.',
    image: null,
    goalAmount: 8000,
    status: 'rejected',
    fraudScore: 55,
    rejectionReason: 'Personal travel is not an eligible cause on SafeDonate.',
    donations: [],
  },
];

const DEMO_CONTACT_MESSAGES = [
  {
    name: 'Sara Ahmed',
    email: 'sara.ahmed@example.com',
    subject: 'Report a Campaign',
    message: 'The campaign "URGENT please help me god bless" looks like a scam. The story keeps changing and there are no documents.',
  },
  {
    name: 'Usman Tariq',
    email: 'usman.t@example.com',
    subject: 'NGO Verification Request',
    message: 'We are a registered trust in Sindh and would like our campaigns to show the verified NGO badge. What documents do you need?',
  },
  {
    name: 'Hina Malik',
    email: 'hina.malik@example.com',
    subject: 'Technical Support',
    message: 'My donation receipt is not showing in my history even though the payment went through. Can you check?',
  },
];

const upsertDemoUser = async (role) => {
  const spec = DEMO_USERS[role];
  let user = await User.findOne({ email: spec.email });
  if (!user) user = new User({ email: spec.email });

  user.set({
    username: spec.username,
    name: spec.username,
    role,
    isDemo: true,
    isActive: true,
    isVerified: true,
    profilePicture: undefined,
    interests: spec.interests || [],
    completedCampaignsCount: 0,
    completedCampaignDonorsTotal: 0,
    fundraiserLifetimeRaised: 0,
  });
  // Demo accounts sign in with the one-click demo login only; nobody knows this password
  user.password = crypto.randomBytes(24).toString('hex');
  await user.save();
  return user;
};

export async function resetDemoData() {
  const admin = await upsertDemoUser('admin');
  const fundraiser = await upsertDemoUser('fundraiser');
  const donor = await upsertDemoUser('donor');
  const demoUserIds = [admin._id, fundraiser._id, donor._id];

  // Wipe everything the demo accounts created since the last reset
  const oldCampaignIds = await Campaign.distinct('_id', { fundraiser: fundraiser._id });
  await Donation.deleteMany({
    $or: [{ campaign: { $in: oldCampaignIds } }, { stripeSessionId: /^demo_/ }],
  });
  await Notification.deleteMany({
    $or: [{ user: { $in: demoUserIds } }, { campaign: { $in: oldCampaignIds } }],
  });
  await Message.deleteMany({ from: { $in: demoUserIds }, to: { $in: demoUserIds } });
  await Campaign.deleteMany({ _id: { $in: oldCampaignIds } });
  await ContactMessage.deleteMany({ isDemo: true });

  const created = {};
  for (const spec of DEMO_CAMPAIGNS) {
    const raised = spec.donations.reduce((sum, amount) => sum + amount, 0);
    const reviewed = spec.status !== 'pending';
    const campaign = await Campaign.create({
      title: spec.title,
      category: spec.category,
      tags: spec.tags,
      description: spec.description,
      images: spec.image ? [spec.image] : [],
      goalAmount: spec.goalAmount,
      raisedAmount: raised,
      donorCount: spec.donations.length,
      endDate: daysFromNow(30),
      fundraiser: fundraiser._id,
      status: spec.status,
      verified: spec.status === 'approved',
      fraudScore: spec.fraudScore,
      verifiedBy: reviewed ? admin._id : undefined,
      verifiedAt: reviewed ? new Date() : undefined,
      rejectionReason: spec.rejectionReason,
      campaign_type: spec.ngo ? 'ngo' : 'individual',
      organization_name: spec.ngo?.organization_name || '',
      organization_registration_number: spec.ngo?.organization_registration_number || '',
      ...(spec.ngo && {
        ngo_verification: { verified: false, level: 'unverified', checked_at: new Date() },
      }),
      updates: spec.status === 'approved'
        ? [{ title: 'Thank you!', content: 'We have received the first donations. Thank you all for the support.', postedBy: fundraiser._id }]
        : [],
    });
    created[spec.key] = campaign;

    // Completed sample donations; the first one is from the demo donor so their history isn't empty
    for (const [index, amount] of spec.donations.entries()) {
      await Donation.create({
        campaign: campaign._id,
        donor: index === 0 ? donor._id : undefined,
        amount,
        status: 'completed',
        stripeSessionId: `demo_${spec.key}_${index}_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date(Date.now() - (index + 1) * 6 * 60 * 60 * 1000),
      });
    }
  }

  await Notification.insertMany([
    {
      user: fundraiser._id,
      type: 'donation',
      title: 'New Donation Received!',
      message: `Someone just donated $250 to "${created.surgery.title}"`,
      campaign: created.surgery._id,
    },
    {
      user: donor._id,
      type: 'campaign_update',
      title: 'New Update from Campaign',
      message: `${created.surgery.title}: Thank you!`,
      campaign: created.surgery._id,
    },
  ]);

  await Message.create({
    from: donor._id,
    to: fundraiser._id,
    campaignId: created.surgery._id,
    message: 'Hi Ayesha, is there an update on Hamza\'s surgery date?',
    readBy: [donor._id],
  });

  await ContactMessage.insertMany(
    DEMO_CONTACT_MESSAGES.map((m) => ({ ...m, status: 'unread', isDemo: true })),
  );

  logger.info('[DEMO] Demo accounts and sample data reset');
}
