import User, { IUser } from '../models/user.model.js';
import { Request, Response } from 'express';
import Property, { IProperty } from '../models/property.model.js';
import Inquiry, { IInquiry } from '../models/inquiry.model.js';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      users,
      success: true,
      count: users.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};

//Block user
export const blockUser = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found', success: false });
      return;
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.status(200).json({
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      isBlocked: user.isBlocked,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};

//delete user
export const deleteUser = async (req: Request<{ id: string }>, res: Response) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully', success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};

//view all properties
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const properties = await Property.find().populate('seller', 'name email');
    res.status(200).json({
      properties,
      success: true,
      count: properties.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};

//delete property
export const deleteProperty = async (req: Request<{ id: string }>, res: Response) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Property deleted successfully', success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};

//view all inquiries
export const getAllInquiries = async (req: Request, res: Response) => {
  try {
    const inquiries = await Inquiry.find()
      .populate('property', 'title price')
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({
      inquiries,
      success: true,
      count: inquiries.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};

//Dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const activeListings = await Property.countDocuments({ status: 'sale' });
    const soldProperties = await Property.countDocuments({ status: 'sold' });

    res.status(200).json({
      stats: {
        totalUsers,
        totalProperties,
        activeListings,
        soldProperties,
      },
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};

//get pending seller accounts
export const getPendingSellers = async (req: Request, res: Response) => {
  try {
    const pendingSellers = await User.find({
      role: 'seller',
      isApproved: false,
    }).select('-password');

    res.status(200).json({
      pendingSellers,
      success: true,
      count: pendingSellers.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};

//approve seller account
export const approveSeller = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const seller = await User.findById(req.params.id);
    if (!seller) {
      res.status(404).json({ message: 'Seller not found', success: false });
      return;
    }
    if (seller.role !== 'seller') {
      res.status(400).json({ message: 'User is not a seller', success: false });
      return;
    }
    seller.isApproved = true;
    await seller.save();
    res.status(200).json({ message: 'Seller approved successfully', success: true, seller });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};
