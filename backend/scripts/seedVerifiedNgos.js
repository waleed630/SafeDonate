/**
 * Seeds verified_ngos collection with prominent Pakistani NGOs (snapshot data for demos).
 * Run: npm run seed:ngos (from backend folder)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import VerifiedNGO from '../models/VerifiedNGO.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const NGOS = [
  {
    name: 'Edhi Foundation',
    aliases: ['Abdul Sattar Edhi Foundation', 'Edhi Welfare Organisation'],
    registration_number: 'SECP-CUIN-0038921',
    registry_type: 'SECP',
    category: 'Social Welfare',
    website: 'https://edhi.org',
  },
  {
    name: 'Chippa Welfare Association',
    aliases: ['Chhipa Welfare Association', 'Chippa Welfare', 'Chhipa Welfare'],
    registration_number: 'PCP-NGO-2008-014523',
    registry_type: 'PCP',
    category: 'Emergency Relief',
    website: 'https://chhipa.org',
  },
  {
    name: 'Shaukat Khanum Memorial Cancer Hospital',
    aliases: ['SKMCH', 'Shaukat Khanum Hospital', 'SKMT'],
    registration_number: 'SECP-CUIN-0065418',
    registry_type: 'SECP',
    category: 'Healthcare',
    website: 'https://shaukatkhanum.org.pk',
  },
  {
    name: 'Aga Khan Foundation Pakistan',
    aliases: ['Aga Khan Foundation', 'AKF Pakistan'],
    registration_number: 'SECP-CUIN-0021765',
    registry_type: 'SECP',
    category: 'Development',
    website: 'https://www.akdn.org',
  },
  {
    name: 'JDC Foundation',
    aliases: ['JDC Welfare Foundation', 'Jafaria Disaster Cell'],
    registration_number: 'PCP-NGO-2012-031872',
    registry_type: 'PCP',
    category: 'Social Welfare',
    website: 'https://jdcpk.org',
  },
  {
    name: 'Alkhidmat Foundation Pakistan',
    aliases: ['Al-Khidmat Foundation', 'Alkhidmat'],
    registration_number: 'PCP-NGO-1998-009441',
    registry_type: 'PCP',
    category: 'Humanitarian',
    website: 'https://alkhidmat.org.pk',
  },
  {
    name: 'Saylani Welfare International Trust',
    aliases: ['Saylani Welfare Trust', 'Saylani Trust'],
    registration_number: 'SECP-CUIN-0049086',
    registry_type: 'SECP',
    category: 'Food & Welfare',
    website: 'https://saylaniwelfare.com',
  },
  {
    name: 'The Citizen Foundation',
    aliases: ['TCF', 'Citizen Foundation', 'TCF Pakistan'],
    registration_number: 'SECP-CUIN-0053344',
    registry_type: 'SECP',
    category: 'Education',
    website: 'https://www.tcf.org.pk',
  },
  {
    name: 'Imran Khan Foundation',
    aliases: ['IKF'],
    registration_number: 'SECP-CUIN-0072219',
    registry_type: 'SECP',
    category: 'Social Welfare',
    website: 'https://www.imrankhanfoundation.org',
  },
  {
    name: 'The Indus Hospital',
    aliases: ['Indus Hospital & Health Network', 'IHHN', 'Indus Hospital Network'],
    registration_number: 'SECP-CUIN-0081163',
    registry_type: 'SECP',
    category: 'Healthcare',
    website: 'https://www.indushospital.org.pk',
  },
  {
    name: 'Layton Rahmatulla Benevolent Trust',
    aliases: ['LRBT', 'LRBT Eye Hospitals'],
    registration_number: 'SECP-CUIN-0018837',
    registry_type: 'SECP',
    category: 'Healthcare',
    website: 'https://www.lrbt.org.pk',
  },
  {
    name: 'Rozan',
    aliases: ['ROZAN NGO', 'Rozan Pakistan'],
    registration_number: 'PCP-NGO-2004-027651',
    registry_type: 'PCP',
    category: 'Mental Health',
    website: 'https://www.rozan.org',
  },
  {
    name: 'Developments in Literacy',
    aliases: ['DIL', 'DIL Trust Pakistan'],
    registration_number: 'SECP-CUIN-0059872',
    registry_type: 'SECP',
    category: 'Education',
    website: 'https://www.dil.org',
  },
  {
    name: 'Baitussalam Welfare Trust',
    aliases: ['Bait-us-Salam Welfare Trust', 'Baitussalam Trust'],
    registration_number: 'PCP-NGO-2015-042908',
    registry_type: 'PCP',
    category: 'Humanitarian',
    website: 'https://baitussalam.org',
  },
  {
    name: 'Pakistan Red Crescent Society',
    aliases: ['PRCS', 'Red Crescent Pakistan'],
    registration_number: 'PROV-SD-PRCS-1952-001',
    registry_type: 'Provincial',
    category: 'Humanitarian',
    website: 'https://www.prcs.org.pk',
  },
  {
    name: 'Akhuwat Foundation',
    aliases: ['Akhuwat Islamic Microfinance'],
    registration_number: 'MANUAL-AKH-PAK-2001',
    registry_type: 'Manual',
    category: 'Microfinance & Welfare',
    website: 'https://akhuwat.org.pk',
  },
];

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI (or MONGODB_URI) missing in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected. Upserting NGOs...');

  const baseDate = new Date('2024-06-01T00:00:00.000Z');

  for (const row of NGOS) {
    await VerifiedNGO.findOneAndUpdate(
      { registration_number: row.registration_number },
      {
        ...row,
        is_verified: true,
        verified_at: baseDate,
        added_by: null,
      },
      { upsert: true, setDefaultsOnInsert: true, returnDocument: 'after' },
    );
    console.log(`  ✓ ${row.name}`);
  }

  console.log(`Done. ${NGOS.length} organizations in verified_ngos.`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
