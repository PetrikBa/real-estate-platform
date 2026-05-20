//get profile
import User from '../models/user.model.js';
import { Request, Response } from 'express';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';

export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ user, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};

//get public profile
export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('name profilePicture role createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }
    res.status(200).json({ user, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};

//update profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, profilePicture, phone, address, removeProfilePicture } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized', success: false });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    //image handling
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'profile_pictures');
      user.profilePicture = result.secure_url;
    } else if (removeProfilePicture === 'true') {
      user.profilePicture = undefined;
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    const updatedUser = await user.save();
    res
      .status(200)
      .json({ user: updatedUser, success: true, message: 'Profile updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};
