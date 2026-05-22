import mongoose, { Document } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller';
  message: string;
}

const contactSchema = new mongoose.Schema<IContact>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['buyer', 'seller'], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const Contact = mongoose.model<IContact>('Contact', contactSchema);
export default Contact;
