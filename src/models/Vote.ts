import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVote extends Document {
  userId: string;
  logoId: string;
  timestamp: Date;
  status: 'confirmed' | 'rejected';
  createdAt: Date;
  conflictResolution?: {
    originalVote: string;
    resolutionType: 'reject';
    resolvedAt: Date;
  };
}

interface IVoteModel extends Model<IVote> {
  findUserVotes(userId: string): Promise<IVote[]>;
  getVoteStats(logoId: string): Promise<{ voteCount: number }>;
}

const voteSchema = new Schema<IVote>(
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
    conflictResolution: {
      type: {
        originalVote: String,
        resolutionType: {
          type: String,
          enum: ['reject'],
        },
        resolvedAt: Date,
      },
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'vote',
  }
);

// Add indexes for common queries
voteSchema.index({ userId: 1, logoId: 1 }, { unique: true });
voteSchema.index({ logoId: 1, status: 1 });

// Static methods
voteSchema.statics.findUserVotes = function (userId: string) {
  return this.find({
    userId,
    status: 'confirmed',
  })
    .sort({ timestamp: -1 })
    .lean();
};

voteSchema.statics.getVoteStats = function (logoId: string) {
  return this.aggregate([
    {
      $match: {
        logoId,
        status: 'confirmed',
      },
    },
    {
      $group: {
        _id: null,
        voteCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        voteCount: 1,
      },
    },
  ]);
};

const VoteModel = (mongoose.models.Vote ||
  mongoose.model<IVote, IVoteModel>('Vote', voteSchema)) as IVoteModel;

export default VoteModel;
