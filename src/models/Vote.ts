import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';
import { ILogo } from './Logo';

interface IVoteStats {
  totalVotes: number;
  uniqueVoters: number;
}

export interface IVote extends Document {
  userId: string;
  logoId: string;
  timestamp: Date;
  ownerId?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  version: number;
  conflictResolution?: {
    originalVote?: string;
    resolutionType?: 'override' | 'merge' | 'reject';
    resolvedAt?: Date;
  };
  userName?: string;
}

interface IVoteModel extends Model<IVote> {
  findUserVotes(userId: string): Promise<IVote[]>;
  getVoteStats(logoId: string): Promise<IVoteStats[]>;
}

const voteSchema = new Schema<IVote>(
  {
    userId: {
      type: String,
      required: [true, 'UserId is required'],
      validate: {
        validator: async function (userId: string) {
          const User = mongoose.model('User');
          const user = await User.findOne({ userId });
          return user !== null;
        },
        message: 'Referenced user does not exist',
      },
    },
    userName: {
      type: String,
      required: false,
    },
    logoId: {
      type: String,
      required: [true, 'LogoId is required'],
      validate: {
        validator: async function (logoId: string) {
          const Logo = mongoose.model('Logo');
          const logo = await Logo.findOne({ value: logoId, status: 'active' });
          return logo !== null;
        },
        message: 'Referenced logo does not exist or is not active',
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    ownerId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
    },
    version: {
      type: Number,
      default: 1,
    },
    conflictResolution: {
      originalVote: {
        type: String,
      },
      resolutionType: {
        type: String,
        enum: ['override', 'merge', 'reject'],
      },
      resolvedAt: Date,
    },
  },
  {
    timestamps: true,
    collection: 'vote',
    optimisticConcurrency: true,
    versionKey: '__v',
  }
);

// Compound index for userId and logoId, but only for confirmed votes
voteSchema.index(
  { userId: 1, logoId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'confirmed' },
  }
);
voteSchema.index({ timestamp: -1 });
voteSchema.index({ status: 1 });

// Pre-save middleware to set userName
voteSchema.pre('save', async function (next) {
  try {
    if (this.isNew || this.isModified('userId')) {
      const User = mongoose.model('User');
      const session = this.$session();
      const query = User.findOne({ userId: this.userId });

      if (session) {
        query.session(session);
      }

      const user = await query;
      if (user) {
        this.userName = user.name;
      }
    }
    next();
  } catch (error) {
    console.error('Error in Vote pre-save middleware:', error);
    next(error as mongoose.CallbackError);
  }
});

// Post-save middleware for user update
voteSchema.post('save', async function (doc) {
  try {
    if (doc.status === 'confirmed') {
      const User = mongoose.model('User');
      const session = doc.$session();
      const updateQuery = User.findOneAndUpdate(
        { userId: doc.userId },
        {
          $inc: { voteCount: 1 },
          $set: { lastVoteAt: doc.timestamp },
        }
      );

      if (session) {
        updateQuery.session(session);
      }

      await updateQuery;
    }
  } catch (error) {
    console.error('Error in Vote post-save middleware:', error);
    throw error;
  }
});

// Static methods
voteSchema.statics.findUserVotes = function (userId: string) {
  return this.find({ userId, status: 'confirmed' }).sort({ timestamp: -1 });
};

voteSchema.statics.getVoteStats = function (logoId: string) {
  return this.aggregate([
    { $match: { logoId, status: 'confirmed' } },
    {
      $group: {
        _id: '$logoId',
        totalVotes: { $sum: 1 },
        uniqueVoters: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        totalVotes: 1,
        uniqueVoters: { $size: '$uniqueVoters' },
      },
    },
  ]);
};

// Try to prevent errors during hot reloading
const VoteModel = (mongoose.models.Vote ||
  mongoose.model<IVote, IVoteModel>('Vote', voteSchema)) as IVoteModel;

export default VoteModel;
