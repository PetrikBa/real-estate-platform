import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role: 'buyer' | 'seller' | 'admin';
}

interface LoginBody {
  email: string;
  password: string;
}

interface VerifyEmailBody {
  email: string;
  code: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  password: string;
}

// Register a new user
export const register = async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificatonToken = crypto.randomInt(100000, 999999).toString();

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

//login
export const login = async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        message: 'Email not verified. Please check your email for the verification code.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: 'Your account has been blocked. Please contact support.' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ message: 'Server configuration error' });

    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//get my profile
export const getMe = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, user: req.user });
};

//verify email
export const verifyEmail = async (req: Request<{}, {}, VerifyEmailBody>, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (user.verificationToken !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully', success: true });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Server error', success: false });
  }
};

//forgot password
// Forgot Password
export const forgotPassword = async (req: Request<{}, {}, ForgotPasswordBody>, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: 'No user found with that email address', success: false });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(resetPasswordExpire);
    await user.save();

    const clientUrl = 'http://localhost:5173'; //frontend url
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    const message = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Please click on the link below to reset your password:</p>
            <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
            <p>This link will expire in 15 minutes.</p>
        `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset - Real Estate Platform',
        message,
      });
      res.status(200).json({ message: 'Password reset email sent', success: true });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'Could not send email', success: false });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
}; // for reset pass we require email

//reset password
export const resetPassword = async (
  req: Request<{ token: string }, {}, ResetPasswordBody>,
  res: Response
) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token', success: false });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully', success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ message, success: false });
  }
};
