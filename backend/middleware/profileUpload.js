import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const cloud_api = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;
// Validate Cloudinary config
const hasCloudinaryConfig = cloud_name &&
                            cloud_api &&
                            api_secret;

let storage;

if (hasCloudinaryConfig) {
    logger.info('[PROFILE UPLOAD] Using Cloudinary storage');
    cloudinary.config({
        cloud_name,
        api_key: cloud_api,
        api_secret,
    });

    storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'safedonate/profiles',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            public_id: (req, file) => {
                // Use userId-profilepicture as the public ID for uniqueness
                return `${req.user._id}-profilepicture`;
            },
            overwrite: true, // Overwrite if profile picture already exists
            resource_type: 'auto',
        },
    });
} else {
    logger.warn('[PROFILE UPLOAD] Cloudinary not configured, using memory storage fallback');
    storage = multer.memoryStorage();
}

const profileUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, and WEBP images are allowed'));
        }
    }
}).single('profilePicture'); // Accept single file in 'profilePicture' field

// Wrap upload to handle errors gracefully
const profileUploadMiddleware = (req, res, next) => {
    profileUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            logger.error(`[PROFILE UPLOAD MULTER ERROR] Message: ${err.message}`);
            return res.status(400).json({ 
                success: false, 
                message: `File upload error: ${err.message}` 
            });
        } else if (err) {
            logger.error(`[PROFILE UPLOAD ERROR] Message: ${err.message || 'Unknown error'}`);
            return res.status(500).json({ 
                success: false, 
                message: `Upload failed: ${err.message || 'Unknown error'}` 
            });
        }
        
        if (req.file) {
            logger.info(`[PROFILE UPLOAD SUCCESS] File uploaded: ${req.file.originalname}`);
        }
        
        next();
    });
};

export default profileUploadMiddleware;
