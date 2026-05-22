import express from 'express';
import { addWishlist, removeWishlist, getWishlist } from '../controllers/wishlist.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/:propertyId', protect, addWishlist);
wishlistRouter.get('/', protect, getWishlist);
wishlistRouter.delete('/remove/:propertyId', protect, removeWishlist);

export default wishlistRouter;
