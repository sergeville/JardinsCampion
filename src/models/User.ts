import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastVoteAt?: Date;
  voteCount: number;
  votedLogos: string[];
  canVote: (logoId: string) => boolean;
}

interface IUserModel extends Model<IUser> {
  findByUserId(userId: string): Promise<IUser | null> & {
    session(session: mongoose.ClientSession): Promise<IUser | null>;
  };
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    userId: {
      type: String,
      required: [true, 'UserId is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[a-z0-9-]+$/.test(v);
        },
        message: 'UserId can only contain lowercase letters, numbers, and hyphens',
      },
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
    collection: 'user',
    optimisticConcurrency: true,
    versionKey: '__v',
    methods: {
      canVote(logoId: string) {
        return !this.votedLogos.includes(logoId);
      },
    },
  }
);

// Indexes
userSchema.index({ lastVoteAt: 1 });

// Pre-save middleware
userSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  next();
});

// Static methods
userSchema.statics.findByUserId = function (userId: string) {
  return this.findOne({ userId: userId.toLowerCase() });
};

// Try to prevent errors during hot reloading
const UserModel = (mongoose.models.User ||
  mongoose.model<IUser, IUserModel>('User', userSchema)) as IUserModel;

export default UserModel;
