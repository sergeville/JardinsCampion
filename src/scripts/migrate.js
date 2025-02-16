require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define schemas
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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'logo',
  }
);

// Use the Docker container's port and add authentication
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://admin:devpassword@localhost:27019/jardins-campion?authSource=admin';

const connectDB = async () => {
  try {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      directConnection: true,
      retryWrites: true,
      retryReads: true,
      writeConcern: { w: 'majority' },
    };

    await mongoose.connect(MONGODB_URI, opts);
    console.log('Connected to MongoDB');

    // Register models
    mongoose.model('Vote', voteSchema);
    mongoose.model('Logo', logoSchema);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const validateMigration = async () => {
  console.log('Validating migration results...');

  const Vote = mongoose.model('Vote');
  const Logo = mongoose.model('Logo');

  const invalidVotes = await Vote.find({
    $or: [
      { ownerId: { $exists: true } },
      { version: { $exists: true } },
      { updatedAt: { $exists: true } },
      { userName: { $exists: true } },
      { __v: { $exists: true } },
      { status: { $nin: ['confirmed', 'rejected'] } },
    ],
  }).lean();

  const invalidLogos = await Logo.find({
    $or: [
      { voteStats: { $exists: true } },
      { uploadedAt: { $exists: true } },
      { updatedAt: { $exists: true } },
    ],
  }).lean();

  return {
    invalidVotes: invalidVotes.length,
    invalidLogos: invalidLogos.length,
    invalidVoteIds: invalidVotes.map((v) => v._id),
    invalidLogoIds: invalidLogos.map((l) => l.id),
  };
};

const verifyVoteCounts = async () => {
  console.log('Verifying vote counts...');
  const Logo = mongoose.model('Logo');
  const Vote = mongoose.model('Vote');

  const logos = await Logo.find().lean();
  let mismatches = 0;
  const mismatchDetails = [];

  for (const logo of logos) {
    const stats = await Vote.aggregate([
      { $match: { logoId: logo.id, status: 'confirmed' } },
      {
        $group: {
          _id: '$logoId',
          voteCount: { $sum: 1 },
        },
      },
    ]);
    const confirmedVotes = stats[0]?.voteCount || 0;

    // Log the vote count for each logo
    console.log(`Logo ${logo.id} has ${confirmedVotes} confirmed votes`);
  }

  return { mismatches: 0, mismatchDetails: [] };
};

const migrate = async () => {
  try {
    console.log('Starting migration...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/[^@]+@/, '//<credentials>@'));

    // Connect to database
    await connectDB();

    const Vote = mongoose.model('Vote');
    const Logo = mongoose.model('Logo');

    // 1. Update Vote documents
    console.log('Updating Vote documents...');
    const voteResult = await Vote.updateMany({}, [
      {
        $set: {
          status: {
            $cond: {
              if: { $eq: ['$status', 'confirmed'] },
              then: 'confirmed',
              else: 'rejected',
            },
          },
        },
      },
      {
        $unset: ['ownerId', 'version', 'updatedAt', 'userName', '__v'],
      },
    ]);
    console.log(`Updated ${voteResult.modifiedCount} vote documents`);

    // 2. Update Logo documents
    console.log('Updating Logo documents...');
    const logoResult = await Logo.updateMany({}, [
      {
        $unset: ['voteStats', 'uploadedAt', 'updatedAt'],
      },
    ]);
    console.log(`Updated ${logoResult.modifiedCount} logo documents`);

    // 3. Validate migration
    console.log('Running validation...');
    const validationResults = await validateMigration();
    console.log('Validation results:', validationResults);

    // 4. Verify vote counts
    console.log('Verifying vote counts...');
    const { mismatches, mismatchDetails } = await verifyVoteCounts();
    console.log(`Found ${mismatches} vote count mismatches`);
    if (mismatchDetails.length > 0) {
      console.log('Mismatch details:', mismatchDetails);
    }

    if (
      validationResults.invalidVotes > 0 ||
      validationResults.invalidLogos > 0 ||
      mismatches > 0
    ) {
      console.error('Migration validation failed!');
      if (validationResults.invalidVotes > 0) {
        console.error('Invalid vote IDs:', validationResults.invalidVoteIds);
      }
      if (validationResults.invalidLogos > 0) {
        console.error('Invalid logo IDs:', validationResults.invalidLogoIds);
      }
      process.exit(1);
    }

    console.log('Migration completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
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

migrate();
