require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define schemas (same as in migrate.js)
const logoSchema = new Schema(
  {
    id: {
      type: String,
      required: [true, 'Logo ID is required'],
      unique: true,
      trim: true,
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
    },
    contentType: {
      type: String,
      required: false,
    },
    voteStats: {
      type: {
        totalVotes: {
          type: Number,
          default: 0,
        },
      },
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'logo',
  }
);

const voteSchema = new Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    logoId: {
      type: String,
      required: [true, 'Logo ID is required'],
      ref: 'Logo',
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['confirmed', 'rejected'],
      default: 'confirmed',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'vote',
  }
);

// Sample data
const sampleLogos = [
  {
    id: 'logo1',
    alt: 'A beautiful garden with colorful flowers',
    src: '/logos/garden1.jpg',
    ownerId: 'user1',
    status: 'active',
    contentType: 'image/jpeg',
    voteStats: { totalVotes: 1 }, // 1 confirmed vote, 1 rejected vote
  },
  {
    id: 'logo2',
    alt: 'Professional landscaping design with water features',
    src: '/logos/garden2.jpg',
    ownerId: 'user2',
    status: 'active',
    contentType: 'image/jpeg',
    voteStats: { totalVotes: 1 }, // 1 confirmed vote
  },
  {
    id: 'logo3',
    alt: 'Modern garden maintenance tools and equipment',
    src: '/logos/garden3.jpg',
    ownerId: 'user1',
    status: 'active',
    contentType: 'image/jpeg',
    voteStats: { totalVotes: 0 }, // no votes
  },
];

const sampleVotes = [
  {
    userId: 'user1',
    logoId: 'logo2',
    status: 'confirmed',
  },
  {
    userId: 'user2',
    logoId: 'logo1',
    status: 'confirmed',
  },
  {
    userId: 'user3',
    logoId: 'logo1',
    status: 'rejected',
  },
];

// Use the Docker container's port and add authentication
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://admin:devpassword@localhost:27019/jardins-campion?authSource=admin';

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/[^@]+@/, '//<credentials>@'));

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      directConnection: true,
      retryWrites: true,
      retryReads: true,
      writeConcern: { w: 'majority' },
    });

    console.log('Connected to MongoDB');

    // Register models
    const Logo = mongoose.model('Logo', logoSchema);
    const Vote = mongoose.model('Vote', voteSchema);

    // Clear existing data
    await Logo.deleteMany({});
    await Vote.deleteMany({});
    console.log('Cleared existing data');

    // Insert sample logos
    await Logo.insertMany(sampleLogos);
    console.log('Inserted sample logos');

    // Insert sample votes
    await Vote.insertMany(sampleVotes);
    console.log('Inserted sample votes');

    console.log('Database seeding completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Add error handlers
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  mongoose.disconnect().then(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  mongoose.disconnect().then(() => process.exit(1));
});

seedDatabase();
