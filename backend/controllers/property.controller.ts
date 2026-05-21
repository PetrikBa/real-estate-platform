import Property from '../models/property.models.js';
import Inquiry from '../models/inquiry.model.js';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';
import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary.js';
import jwt from 'jsonwebtoken';

export const addProperty = async (req: Request, res: Response) => {
  try {
    let imageUrls = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      for (let file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        imageUrls.push(result.secure_url);
      }
    }

    const property = await Property.create({
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      city: req.body.city,
      area: req.body.area,
      pincode: req.body.pincode,
      propertyType: req.body.propertyType,
      bhk: req.body.bhk ? String(req.body.bhk) : undefined,
      bathrooms: req.body.bathrooms ? Number(req.body.bathrooms) : undefined,
      areaSize: req.body.areaSize ? Number(req.body.areaSize) : undefined,
      furnishing: req.body.furnishing,
      status: req.body.status,
      images: imageUrls,
      seller: req.user?._id,
      amenities: req.body.amenities
        ? Array.isArray(req.body.amenities)
          ? req.body.amenities
          : (() => {
              try {
                return JSON.parse(req.body.amenities);
              } catch (e) {
                return req.body.amenities.split(',');
              }
            })()
        : [],
      latitude: req.body.latitude ? Number(req.body.latitude) : undefined,
      longitude: req.body.longitude ? Number(req.body.longitude) : undefined,
    });
    res.status(201).json({ property, success: true });
  } catch (error) {
    console.error('Add property error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//get my properties
export const getMyProperties = async (req: Request, res: Response) => {
  try {
    const properties = await Property.find({ seller: req.user?._id }).sort({ createdAt: -1 });
    res.status(200).json({ properties, success: true });
  } catch (error) {
    console.error('Get my properties error', error);
    res.status(500).json({ message: 'Internal server error', success: false });
  }
};

//update a property
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    if (property.seller.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const fields = [
      'title',
      'description',
      'price',
      'city',
      'area',
      'pincode',
      'propertyType',
      'bhk',
      'bathrooms',
      'areaSize',
      'furnishing',
      'status',
      'amenities',
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'amenities' && typeof req.body[field] === 'string') {
          try {
            (property as any)[field] = JSON.parse(req.body[field]);
          } catch (e) {
            (property as any)[field] = req.body[field].split(',');
          }
        } else {
          (property as any)[field] = req.body[field];
        }
      }
    });

    if (req.body.existingImages) {
      try {
        const existing = JSON.parse(req.body.existingImages);
        property.images = Array.isArray(existing) ? existing : property.images;
      } catch (e) {
        console.error('Failed to parse existingImages:', e);
      }
    }

    if (Array.isArray(req.files) && req.files.length > 0) {
      let newImages = [];
      for (let file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'properties');
        newImages.push(result.secure_url);
      }
      property.images = [...property.images, ...newImages];
    }

    await property.save();

    res.json({
      success: true,
      message: 'Property updated',
      property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};

//delete property

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    if (property.seller.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    for (let imageUrl of property.images) {
      const publicId = imageUrl.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`properties/${publicId}`);
      }
    }

    await property.deleteOne();

    res.json({
      success: true,
      message: 'Property deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};

//update property status
export const updatePropertyStatus = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    if (property.seller.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    property.status = req.body.status;
    await property.save();

    res.json({
      success: true,
      message: 'Property status updated successfully',
      property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};

//get all propertes
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const {
      city,
      area,
      pincode,
      propertyType,
      bhk,
      furnishing,
      status,
      minPrice,
      maxPrice,
      amenities,
      sort,
      seller,
    } = req.query;

    let query: Record<string, any> = {
      status: 'sale',
    };

    if (seller) query.seller = String(seller);
    if (city) query.city = new RegExp(String(city), 'i');
    if (area) query.area = new RegExp(String(area), 'i');
    if (pincode) query.pincode = String(pincode);

    if (propertyType) {
      query.propertyType = { $in: String(propertyType).toLowerCase().split(',') };
    }
    if (bhk) {
      if (bhk === '5+') {
        query.bhk = { $gte: '5' };
      } else {
        query.bhk = String(bhk);
      }
    }
    if (furnishing) {
      const furnishingArray = String(furnishing).split(',');
      query.furnishing = {
        $in: furnishingArray.map((f: string) => new RegExp(`^${f.trim()}$`, 'i')),
      };
    }
    if (status) query.status = String(status);

    if (minPrice || maxPrice) {
      query.price = {};
      const minP = Number(minPrice);
      const maxP = Number(maxPrice);
      if (minPrice && !isNaN(minP)) query.price.$gte = minP;
      if (maxPrice && !isNaN(maxP)) query.price.$lte = maxP;
      if (Object.keys(query.price).length === 0) delete query.price;
    }

    if (amenities) {
      query.amenities = {
        $in: String(amenities).split(',').map((a: string) => a.trim()),
      };
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'priceLow') sortOption = { price: 1 };
    if (sort === 'priceHigh') sortOption = { price: -1 };
    if (sort === 'latest') sortOption = { createdAt: -1 };

    const properties = await Property.find(query)
      .populate('seller', 'name phone profilePic')
      .sort(sortOption);

    res.json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching properties',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

//to get property details
export const getPropertyDetails = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      'seller',
      'name phone profilePicture'
    );
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    let visitorId: string = req.user?._id ? req.user._id.toString() : (req.ip ?? '');
    const authHeaders = req.headers.authorization;
    if (authHeaders && authHeaders.startsWith('Bearer ')) {
      try {
        const token = authHeaders.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        visitorId = decoded.id;
      } catch (error) {
        //ignore invalid token
      }
    }

    const isSellerChecking = visitorId === property.seller._id.toString();

    if (!isSellerChecking && !property.viewedBy.includes(visitorId)) {
      property.views += 1;
      property.viewedBy.push(visitorId);
      await property.save();
    }

    const similarProperties = await Property.find({
      _id: { $ne: property._id },
      city: property.city,
      propertyType: property.propertyType,
      status: property.status,
    })
      .limit(4)
      .select('title price city area propertyType images bhk areaSize status');

    res.json({
      success: true,
      property,
      similarProperties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching property details',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

//seller dashboard
export const getSellerDashboard = async (req: Request, res: Response) => {
  try {
    const slllerId = req.user?._id;
    const totalProperties = await Property.countDocuments({ seller: slllerId });
    const activeListings = await Property.countDocuments({ seller: slllerId, status: 'sale' });
    const soldProperties = await Property.countDocuments({ seller: slllerId, status: 'sold' });
    const totalInquiries = await Inquiry.countDocuments({ seller: slllerId });

    const viewsData = await Property.aggregate([
      { $match: { seller: slllerId } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } },
    ]);

    const totalViews = viewsData.length > 0 ? viewsData[0].totalViews : 0;

    res.json({
      success: true,
      stats: {
        totalProperties,
        activeListings,
        soldProperties,
        totalInquiries,
        totalViews,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching seller dashboard',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

//get propert counts by type
export const getPropertyCountsByType = async (req: Request, res: Response) => {
  try {
    const counts = await Property.aggregate([
      { $match: { status: 'sale' } },
      { $group: { _id: '$propertyType', count: { $sum: 1 } } },
    ]);
    const formattedCounts = counts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    res.json({
      success: true,
      counts: formattedCounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching property counts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
