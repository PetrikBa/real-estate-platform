import express from 'express';
import {
  addProperty,
  deleteProperty,
  getAllProperties,
  getMyProperties,
  getPropertyCountsByType,
  getPropertyDetails,
  getSellerDashboard,
  updateProperty,
  updatePropertyStatus,
} from '../controllers/property.controller.js';
import { authorize, protect } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const propertyRouter = express.Router();

propertyRouter.get('/', getAllProperties);

//protected
propertyRouter.post(
  '/',
  protect,
  authorize('admin', 'seller'),
  upload.array('images', 10),
  addProperty
);
propertyRouter.get('/my', protect, authorize('admin', 'seller'), getMyProperties);
propertyRouter.put(
  '/:id',
  protect,
  authorize('admin', 'seller'),
  upload.array('images', 10),
  updateProperty
);

propertyRouter.delete('/:id', protect, authorize('admin', 'seller'), deleteProperty);
propertyRouter.patch(
  '/:id',
  protect,
  authorize('admin', 'seller'),
  upload.array('images', 10),
  updatePropertyStatus
);

propertyRouter.get('/counts', getPropertyCountsByType);
propertyRouter.get('/:id', getPropertyDetails);

propertyRouter.get('/seller/dashboard', protect, authorize('seller'), getSellerDashboard);

export default propertyRouter;
