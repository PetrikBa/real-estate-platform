import mongoose from 'mongoose';
import Wishlist from '../models/wishlist.model.js';
import { Request, Response } from 'express';
import Property from '../models/property.model.js';

export const addWishlist = async (req: Request, res: Response) => {
  try {
    const propertyId = new mongoose.Types.ObjectId(req.params.propertyId as string);

    const existing = await Wishlist.findOne({
      user: req.user?._id,
      property: propertyId,
    });

    if (existing) {
      return res.status(200).json({
        message: 'Property already in wishlist',
        success: true,
      });
    }

    await Wishlist.create({
      user: req.user?._id,
      property: propertyId,
    });
    res.status(201).json({
      message: 'Property added to wishlist',
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add to wishlist',
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};
