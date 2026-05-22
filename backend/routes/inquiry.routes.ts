import express from 'express';
import {
  getSellerInquiries,
  markInquiryAsRead,
  sendInquiry,
} from '../controllers/inquiry.controler.js';
import { authorize, protect } from '../middlewares/auth.middleware.js';

const inquiryRouter = express.Router();

inquiryRouter.post('/', protect, authorize('buyer'), sendInquiry);
inquiryRouter.get('/seller', protect, authorize('seller'), getSellerInquiries);
inquiryRouter.patch('/:id/read', protect, authorize('seller'), markInquiryAsRead);

export default inquiryRouter;
