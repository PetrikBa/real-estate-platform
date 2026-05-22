import Inquiry from '../models/inquiry.model.js';
import Property from '../models/property.model.js';
import { IUser } from '../models/user.model.js';
import { Request, Response } from 'express';

interface SendInquiryBody {
  propertyId: string;
  message: string;
}

export const sendInquiry = async (req: Request<{}, {}, SendInquiryBody>, res: Response) => {
  try {
    const { propertyId, message } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }

    const property = await Property.findById(propertyId).populate('seller');

    if (!property) {
      return res.status(404).json({ error: 'Property not found', success: false });
    }

    const seller = property.seller as unknown as IUser;

    const inquiry = await Inquiry.create({
      property: property._id,
      message,
      buyer: req.user._id,
      seller: seller._id,
    });

    res.status(201).json({
      inquiry,
      success: true,
      message: 'Inquiry sent successfully',
    });
  } catch (error) {
    console.error('Error sending inquiry:', error);
    res.status(500).json({
      error: 'Failed to send inquiry',
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};
//seller view inquiry
export const getSellerInquiries = async (req: Request, res: Response) => {
  try {
    const inquiries = await Inquiry.find({
      seller: req.user?._id,
    })
      .populate('buyer', 'name email phone')
      .populate('property', 'title price images city')
      .sort({ createdAt: -1 });
    res.status(200).json({
      inquiries,
      count: inquiries.length,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch inquiries',
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};

//mark inquires read
export const markInquiryAsRead = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found', success: false });
    }
    inquiry.isRead = true;
    await inquiry.save();
    res.status(200).json({ message: 'Inquiry marked as read', success: true });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to mark inquiry as read',
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};
