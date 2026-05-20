import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

export const uploadToCloudinary = (
  buffer: Buffer,
  folder = 'general'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (result) resolve(result);
        else reject(error ?? new Error('Cloudinary upload failed'));
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};
