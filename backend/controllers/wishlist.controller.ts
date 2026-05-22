import mongoose from 'mongoose';
import Wishlist from '../models/wishlist.model.js';
import { Request, Response } from 'express';

export const addWishlist = async (req: Request<{ propertyId: string }>, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    const propertyId = new mongoose.Types.ObjectId(req.params.propertyId);

    const existing = await Wishlist.findOne({
      user: req.user._id,
      property: propertyId,
    });

    if (existing) {
      return res.status(200).json({
        message: 'Property already in wishlist',
        success: true,
      });
    }

    await Wishlist.create({
      user: req.user._id,
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

//get properties in user wishlist
export const getWishlist = async (req: Request, res: Response) => {
  try {
    const data = await Wishlist.find({ user: req.user?._id }).populate('property');

    res.status(200).json({
      data,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch wishlist',
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};

//remove property from wishlist
export const removeWishlist = async (req: Request<{ propertyId: string }>, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    const propertyId = new mongoose.Types.ObjectId(req.params.propertyId);
    const result = await Wishlist.findOneAndDelete({
      user: req.user._id,
      property: propertyId,
    });

    if (!result) {
      return res.status(404).json({
        error: 'Property not found in wishlist',
        success: false,
      });
    }
    res.status(200).json({
      message: 'Property removed from wishlist',
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to remove from wishlist',
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};
