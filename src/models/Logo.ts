import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILogo extends Document {
  id: string;
  alt: string;
  src: string;
  ownerId: string;
  status: 'active' | 'inactive';
  contentType?: string;
  createdAt: Date;
}

interface ILogoModel extends Model<ILogo> {
  findActiveLogo(id: string): Promise<ILogo | null>;
}

const logoSchema = new Schema<ILogo>(
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
        validator: function (v: string) {
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
    contentType: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Static methods
logoSchema.statics.findActiveLogo = function (id: string) {
  return this.findOne({
    id,
    status: 'active',
  });
};

const LogoModel = (mongoose.models.Logo ||
  mongoose.model<ILogo, ILogoModel>('Logo', logoSchema)) as ILogoModel;

export default LogoModel;
