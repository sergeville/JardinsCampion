const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Define schemas
const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    voteCount: {
      type: Number,
      default: 0,
    },
    votedLogos: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const logoSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
    trim: true,
  },
  ownerId: {
    type: String,
    required: true,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  voteStats: {
    totalVotes: {
      type: Number,
      default: 0,
    },
    uniqueVoters: {
      type: Number,
      default: 0,
    },
    lastVoteAt: Date,
  },
});

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    logoId: {
      type: String,
      required: true,
      ref: 'Logo',
    },
    timestamp: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'rejected'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
);

// Create models
const User = mongoose.model('User', userSchema);
const Logo = mongoose.model('Logo', logoSchema);
const Vote = mongoose.model('Vote', voteSchema);

async function cleanupInvalidVotes() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(
      'mongodb://admin:devpassword@localhost:27019/jardins-campion-dev?authSource=admin&directConnection=true'
    );
    console.log('Connected to database');

    // Get all users and their voted logos
    const users = await User.find();
    console.log(`\nFound ${users.length} users`);

    // Start a session for transaction
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      for (const user of users) {
        console.log(`\nProcessing user: ${user.name}`);

        // Get all logos owned by this user
        const ownedLogos = await Logo.find({ ownerId: user.userId });
        console.log(`User owns ${ownedLogos.length} logos`);

        // Get the IDs of owned logos
        const ownedLogoIds = ownedLogos.map((logo) => logo.id);

        // Check if user has voted for any of their own logos
        const invalidVotes = user.votedLogos.filter((logoId) => ownedLogoIds.includes(logoId));

        if (invalidVotes.length > 0) {
          console.log(
            `Found ${invalidVotes.length} invalid votes where user voted for their own logos:`
          );
          for (const logoId of invalidVotes) {
            console.log(`- Logo ${logoId}`);

            // Remove the logo from user's votedLogos
            await User.findByIdAndUpdate(
              user._id,
              {
                $pull: { votedLogos: logoId },
                $inc: { voteCount: -1 },
              },
              { session }
            );

            // Update logo's vote stats
            await Logo.findOneAndUpdate(
              { id: logoId },
              {
                $inc: {
                  'voteStats.totalVotes': -1,
                  'voteStats.uniqueVoters': -1,
                },
              },
              { session }
            );

            // Mark any corresponding votes as rejected
            await Vote.updateMany(
              {
                userId: user.userId,
                logoId: logoId,
                status: 'confirmed',
              },
              {
                $set: {
                  status: 'rejected',
                  conflictResolution: {
                    resolutionType: 'reject',
                    resolvedAt: new Date(),
                  },
                },
              },
              { session }
            );
          }
        } else {
          console.log('No invalid votes found for this user');
        }
      }
    });

    // Clean up orphaned votes
    console.log('\nCleaning up orphaned votes...');
    const orphanedVotes = await Vote.find({
      status: 'confirmed',
      $or: [
        { userId: { $nin: users.map((u) => u.userId) } },
        { logoId: { $nin: (await Logo.find()).map((l) => l.id) } },
      ],
    });

    if (orphanedVotes.length > 0) {
      console.log(`Found ${orphanedVotes.length} orphaned votes to clean up`);
      await Vote.updateMany(
        {
          _id: { $in: orphanedVotes.map((v) => v._id) },
        },
        {
          $set: {
            status: 'rejected',
            conflictResolution: {
              resolutionType: 'reject',
              resolvedAt: new Date(),
            },
          },
        }
      );
    } else {
      console.log('No orphaned votes found');
    }

    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupInvalidVotes();
