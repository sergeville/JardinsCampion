import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import UserModel from '../models/User';
import LogoModel from '../models/Logo';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const logos = [
  {
    value: '1',
    src: '/logos/Logo1.png',
    alt: 'Classic garden design logo with ornate botanical details',
    ownerId: 'pierre-gagnon',
    createdAt: new Date('2024-01-15'),
  },
  {
    value: '2',
    src: '/logos/Logo2.png',
    alt: 'Elegant floral logo with intertwined leaves and vines in a circular design',
    ownerId: 'marie-dubois',
    createdAt: new Date('2024-01-20'),
  },
  {
    value: '3',
    src: '/logos/Logo3.png',
    alt: 'Modern minimalist garden logo with stylized plant elements',
    ownerId: 'jean-tremblay',
    createdAt: new Date('2024-01-25'),
  },
  {
    value: '4',
    src: '/logos/Logo4.png',
    alt: 'Nature-inspired logo featuring delicate leaf patterns',
    ownerId: 'sophie-laurent',
    createdAt: new Date('2024-01-30'),
  },
  {
    value: '5',
    src: '/logos/Logo5.png',
    alt: 'Contemporary garden logo with abstract plant motifs',
    ownerId: 'marie-dubois',
    createdAt: new Date('2024-02-05'),
  },
  {
    value: '6',
    src: '/logos/Logo6.png',
    alt: 'Sustainable garden design logo with eco-friendly elements',
    ownerId: 'jean-tremblay',
    createdAt: new Date('2024-02-10'),
  },
];

const users = [
  // Logo owners
  {
    name: 'Marie Dubois',
    userId: 'marie-dubois',
    createdAt: new Date('2024-01-15'),
  },
  {
    name: 'Jean Tremblay',
    userId: 'jean-tremblay',
    createdAt: new Date('2024-01-20'),
  },
  {
    name: 'Sophie Laurent',
    userId: 'sophie-laurent',
    createdAt: new Date('2024-01-25'),
  },
  {
    name: 'Pierre Gagnon',
    userId: 'pierre-gagnon',
    createdAt: new Date('2024-01-30'),
  },
  // Regular users
  {
    name: 'Isabelle Côté',
    userId: 'isabelle-cote',
    createdAt: new Date('2024-02-01'),
  },
  {
    name: 'Michel Bouchard',
    userId: 'michel-bouchard',
    createdAt: new Date('2024-02-05'),
  },
  {
    name: 'Claire Lemieux',
    userId: 'claire-lemieux',
    createdAt: new Date('2024-02-10'),
  },
  {
    name: 'François Roy',
    userId: 'francois-roy',
    createdAt: new Date('2024-02-15'),
  },
  {
    name: 'Anne Bergeron',
    userId: 'anne-bergeron',
    createdAt: new Date('2024-02-20'),
  },
  {
    name: 'Luc Morin',
    userId: 'luc-morin',
    createdAt: new Date('2024-02-25'),
  },
];

async function seedDatabase() {
  try {
    // Connect to development database
    const MONGODB_URI = process.env.MONGODB_URI_DEV;
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI_DEV environment variable');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await UserModel.deleteMany({});
    await LogoModel.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = await UserModel.insertMany(users);
    console.log('Created users:', createdUsers.length);

    // Create logos with owner references
    const logosWithStats = logos.map((logo) => ({
      ...logo,
      status: 'active',
      voteStats: {
        totalVotes: 0,
        uniqueVoters: 0,
      },
    }));

    const createdLogos = await LogoModel.insertMany(logosWithStats);
    console.log('Created logos:', createdLogos.length);

    console.log('\nDatabase seeded successfully!');
    console.log('Summary:');
    console.log('- Users created:', createdUsers.length);
    console.log('- Logos created:', createdLogos.length);
    console.log('\nLogo Owners:');
    createdUsers.slice(0, 4).forEach((user) => {
      console.log(`- ${user.name} (${user.userId})`);
    });
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedDatabase();
