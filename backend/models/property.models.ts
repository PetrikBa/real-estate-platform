import mongoose, { Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  price: number;
  city: string;
  area: string;
  pincode: string;
  propertyType:
    | 'flat'
    | 'apartment'
    | 'villa'
    | 'house'
    | 'studio'
    | 'penthouse'
    | 'office'
    | 'townhouse'
    | 'plot'
    | 'commercial';
  bhk?: string;
  bathrooms?: number;
  areaSize?: number;
  furnishing?: 'furnished' | 'semi-furnished' | 'unfurnished';
  amenities?: string[];
  status: 'sale' | 'sold';
  images: string[];
  seller: mongoose.Types.ObjectId;
  isVerified: boolean;
  views: number;
  viewedBy: string[];
  latitude?: number;
  longitude?: number;
}

const propertySchema = new mongoose.Schema<IProperty>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      enum: [
        'flat',
        'apartment',
        'villa',
        'house',
        'studio',
        'penthouse',
        'office',
        'townhouse',
        'plot',
        'commercial',
      ],
      required: true,
    },
    bhk: {
      type: String,
    },
    bathrooms: {
      type: Number,
    },
    areaSize: {
      type: Number,
    },
    furnishing: {
      type: String,
      enum: ['furnished', 'semi-furnished', 'unfurnished'],
    },
    amenities: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['sale', 'sold'],
      default: 'sale',
    },
    images: [{ type: String }],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    viewedBy: [{ type: String }],
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model<IProperty>('Property', propertySchema);

export default Property;
