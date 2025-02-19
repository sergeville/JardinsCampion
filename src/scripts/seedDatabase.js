import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI_DEV;
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI_DEV environment variable');
}

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define User schema
    const userSchema = new mongoose.Schema(
      {
        id: {
          type: String,
          required: [true, 'User ID is required'],
          unique: true,
          trim: true,
          index: true,
        },
        name: {
          type: String,
          required: [true, 'Name is required'],
          trim: true,
          minlength: [2, 'Name must be at least 2 characters long'],
          maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
          type: String,
          required: [true, 'Email is required'],
          unique: true,
          trim: true,
          lowercase: true,
          index: true,
          validate: {
            validator: function (v) {
              return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Invalid email format',
          },
        },
        userId: {
          type: String,
          required: [true, 'User ID is required'],
          unique: true,
          trim: true,
          index: true,
        },
        lastVoteAt: {
          type: Date,
          default: null,
        },
        voteCount: {
          type: Number,
          default: 0,
          min: [0, 'Vote count cannot be negative'],
        },
        votedLogos: {
          type: [String],
          default: [],
        },
      },
      {
        timestamps: true,
        collection: 'users',
        optimisticConcurrency: true,
        versionKey: '__v',
      }
    );

    // Define Logo schema
    const logoSchema = new mongoose.Schema(
      {
        id: {
          type: String,
          required: [true, 'Logo ID is required'],
          unique: true,
          trim: true,
          index: true,
        },
        alt: {
          type: String,
          required: [true, 'Alt text is required'],
          trim: true,
          minlength: [10, 'Alt text must be at least 10 characters long'],
        },
        src: {
          type: String,
          required: [true, 'Logo source URL is required'],
          validate: {
            validator: function (v) {
              return /^\/logos\/.*\.(png|jpg|jpeg|svg)$/i.test(v);
            },
            message: 'Invalid logo URL format',
          },
        },
        ownerId: {
          type: String,
          required: [true, 'Owner ID is required'],
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['active', 'inactive'],
          default: 'active',
          index: true,
        },
      },
      {
        timestamps: { createdAt: true, updatedAt: false },
      }
    );

    // Create models
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const Logo = mongoose.models.Logo || mongoose.model('Logo', logoSchema);

    // Clear existing data
    await User.deleteMany({});
    await Logo.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = [
      // Logo owners
      {
        id: 'marie-dubois',
        name: 'Marie Dubois',
        email: 'marie.dubois@example.com',
        userId: 'marie-dubois',
        voteCount: 0,
        votedLogos: [],
      },
      {
        id: 'jean-tremblay',
        name: 'Jean Tremblay',
        email: 'jean.tremblay@example.com',
        userId: 'jean-tremblay',
        voteCount: 0,
        votedLogos: [],
      },
      {
        id: 'sophie-laurent',
        name: 'Sophie Laurent',
        email: 'sophie.laurent@example.com',
        userId: 'sophie-laurent',
        voteCount: 0,
        votedLogos: [],
      },
      {
        id: 'pierre-gagnon',
        name: 'Pierre Gagnon',
        email: 'pierre.gagnon@example.com',
        userId: 'pierre-gagnon',
        voteCount: 0,
        votedLogos: [],
      },
      // Regular users
      {
        id: 'isabelle-cote',
        name: 'Isabelle Côté',
        email: 'isabelle.cote@example.com',
        userId: 'isabelle-cote',
        voteCount: 0,
        votedLogos: [],
      },
      {
        id: 'michel-bouchard',
        name: 'Michel Bouchard',
        email: 'michel.bouchard@example.com',
        userId: 'michel-bouchard',
        voteCount: 0,
        votedLogos: [],
      },
      {
        id: 'claire-lemieux',
        name: 'Claire Lemieux',
        email: 'claire.lemieux@example.com',
        userId: 'claire-lemieux',
        voteCount: 0,
        votedLogos: [],
      },
      {
        id: 'francois-roy',
        name: 'François Roy',
        email: 'francois.roy@example.com',
        userId: 'francois-roy',
        voteCount: 0,
        votedLogos: [],
      },
      {
        id: 'anne-bergeron',
        name: 'Anne Bergeron',
        email: 'anne.bergeron@example.com',
        userId: 'anne-bergeron',
        voteCount: 0,
        votedLogos: [],
      },
      {
        id: 'luc-morin',
        name: 'Luc Morin',
        email: 'luc.morin@example.com',
        userId: 'luc-morin',
        voteCount: 0,
        votedLogos: [],
      },
    ];

    const createdUsers = await Promise.all(users.map(async (userData) => {
      const user = new User(userData);
      return user.save();
    }));
    console.log('Created users:', createdUsers.length);

    // Create logos
    const logos = [
      {
        id: 'logo1',
        src: '/logos/Logo1.png',
        alt: 'Classic garden design logo with ornate botanical details',
        ownerId: 'pierre-gagnon',
        status: 'active',
      },
      {
        id: 'logo2',
        src: '/logos/Logo2.png',
        alt: 'Elegant floral logo with intertwined leaves and vines in a circular design',
        ownerId: 'marie-dubois',
        status: 'active',
      },
      {
        id: 'logo3',
        src: '/logos/Logo3.png',
        alt: 'Modern minimalist garden logo with stylized plant elements',
        ownerId: 'jean-tremblay',
        status: 'active',
      },
      {
        id: 'logo4',
        src: '/logos/Logo4.png',
        alt: 'Nature-inspired logo featuring delicate leaf patterns',
        ownerId: 'sophie-laurent',
        status: 'active',
      },
      {
        id: 'logo5',
        src: '/logos/Logo5.png',
        alt: 'Contemporary garden logo with abstract plant motifs',
        ownerId: 'marie-dubois',
        status: 'active',
      },
      {
        id: 'logo6',
        src: '/logos/Logo6.png',
        alt: 'Sustainable garden design logo with eco-friendly elements',
        ownerId: 'jean-tremblay',
        status: 'active',
      },
    ];

    const createdLogos = await Promise.all(logos.map(async (logoData) => {
      const logo = new Logo(logoData);
      return logo.save();
    }));
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