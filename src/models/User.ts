import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  userId: string;
  lastVoteAt?: Date;
  voteCount: number;
  votedLogos: string[];
  createdAt: Date;
  updatedAt: Date;
  canVote(logoId: string): boolean;
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByUserId(userId: string): Promise<IUser | null>;
}

const userSchema = new Schema<IUser>(
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
        validator: function (v: string) {
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

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUserId = function (userId: string) {
  return this.findOne({ userId });
};

userSchema.methods.canVote = function (logoId: string): boolean {
  return !this.votedLogos.includes(logoId);
};

const UserModel = (mongoose.models.User ||
  mongoose.model<IUser, IUserModel>('User', userSchema)) as IUserModel;

export default UserModel;
