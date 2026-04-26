import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vibefeed', // Folder name in Cloudinary
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp', 'mp4'],
    resource_type: 'auto', // Allow both images and videos
  },
});

export const upload = multer({ storage: storage });
