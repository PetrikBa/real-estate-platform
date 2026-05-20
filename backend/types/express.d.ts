import 'express-serve-static-core';
import 'multer';
import { IUser } from '../models/user.model.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser | null;
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  }
}
