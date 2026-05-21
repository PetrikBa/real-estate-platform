import mongoose, { Document } from 'mongoose';

export interface IInquiry extends Document {
  buyer: mongoose.Types.ObjectId;
  email: string;
  message: string;
  property: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  isRead: boolean;
}

const inquirySchema = new mongoose.Schema<IInquiry>(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Inquiry = mongoose.model<IInquiry>('Inquiry', inquirySchema);

export default Inquiry;
