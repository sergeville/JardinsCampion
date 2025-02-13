import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILogo extends Document {
  value: string;
  src: string;
  alt: string;
  ownerId?: string;
  status: 'active' | 'inactive';
  voteStats: {
    totalVotes: number;
    uniqueVoters: number;
    lastVoteAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ILogoModel extends Model<ILogo> {
  findActiveLogo(value: string): Promise<ILogo | null>;
  findByOwner(ownerId: string): Promise<ILogo[]>;
}

const logoSchema = new Schema<ILogo>(
  {
    value: {
      type: String,
      required: [true, 'Logo value is required'],
      unique: true,
      trim: true,
    },
    src: {
      type: String,
      required: [true, 'Logo source URL is required'],
      validate: {
        validator: function (v: string) {
          return /^\/logos\/.*\.(png|jpg|jpeg|svg)$/i.test(v);
        },
        message: 'Invalid logo URL format',
      },
    },
    alt: {
      type: String,
      required: [true, 'Alt text is required'],
      trim: true,
      minlength: [10, 'Alt text must be at least 10 characters long'],
    },
    ownerId: {
      type: String,
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
        min: [0, 'Total votes cannot be negative'],
      },
      uniqueVoters: {
        type: Number,
        default: 0,
        min: [0, 'Unique voters cannot be negative'],
      },
      lastVoteAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    collection: 'logo',
    optimisticConcurrency: true,
    versionKey: '__v',
  }
);

// Indexes
logoSchema.index({ status: 1 });
logoSchema.index({ ownerId: 1 });

// Static methods
logoSchema.statics.findActiveLogo = function (value: string) {
  return this.findOne({ value, status: 'active' });
};

logoSchema.statics.findByOwner = function (ownerId: string) {
  return this.find({ ownerId });
};

// Try to prevent errors during hot reloading
const LogoModel = (mongoose.models.Logo ||
  mongoose.model<ILogo, ILogoModel>('Logo', logoSchema)) as ILogoModel;

export default LogoModel;
