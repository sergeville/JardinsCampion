import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICounter extends Document {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const CounterModel = (mongoose.models.Counter ||
  mongoose.model<ICounter>('Counter', counterSchema)) as Model<ICounter>;

export default CounterModel; 