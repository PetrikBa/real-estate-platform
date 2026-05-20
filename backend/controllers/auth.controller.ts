import { Request, Response } from 'express';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificatonToken = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isApproved: role === 'seller' ? false : true, // Sellers need approval
      verificationToken: verificatonToken,
    });

    try {
      await sendEmail({
        email,
        subject: 'Verify your email',
        message: `
        <p>
        Thank you for registering on our Real Estate Platform. 
        Please use the following verification code to verify your email 
        address:
        </p>

        <h2>${verificatonToken}</h2>
        <p>
        Enter this code in the app on the verification screen to complete your registration.
        </p>`,
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      //User will be create in DB anyway
    }

    res.status(201).json({
      message: 'User registered successfully. Check email for verification code.',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
