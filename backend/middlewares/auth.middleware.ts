import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model.js';

interface AuthJwtPayload extends jwt.JwtPayload {
  id: string;
}

//protect
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token', success: false });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: 'Server configuration error', success: false });
    }

    const decoded = jwt.verify(token, jwtSecret) as AuthJwtPayload;
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user || req.user.isBlocked) {
      return res.status(403).json({ message: 'Not authorized, user is blocked', success: false });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed', success: false });
  }
};

//role based authorization
export const authorize = (...roles: Array<IUser['role']>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'Not authorized, insufficient permissions', success: false });
    }
    next();
  };
};
