import express from 'express';
import { submitContactForm, getAllContacts } from '../controllers/contact.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const contactRouter = express.Router();
contactRouter.post('/', submitContactForm);
contactRouter.get('/', protect, authorize('admin'), getAllContacts);

export default contactRouter;
