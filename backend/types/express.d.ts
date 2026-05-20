import 'express';
import { IUser } from '../models/user.model.js';

declare module 'express' {
  interface Request {
    user?: IUser | null;
  }
}
