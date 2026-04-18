import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

const cloud_name ="dtt20zowa"
const cloud_api="96141619866815"
const api_secret="tVjWdRKV4DjieH__oJ2VIh-g2IQ"
// Validate Cloudinary config
const hasCloudinaryConfig = cloud_name && 
                            cloud_api && 
                            api_secret;

let storage;

if (hasCloudinaryConfig) {
    logger.info('[PROFILE UPLOAD] Using Cloudinary storage');
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dtt20zowa",
        api_key: process.env.CLOUDINARY_API_KEY || "961416198668185",
        api_secret: process.env.CLOUDINARY_API_SECRET || "tVjWdRKV4DjieH__oJ2VIh-g2IQ",
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
        
        // Log successful file upload for debugging
        if (req.file) {
            console.log('[PROFILE UPLOAD] File object received:');
            console.log('File keys:', Object.keys(req.file));
            console.log('File details:', {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                encoding: req.file.encoding,
                mimetype: req.file.mimetype,
                size: req.file.size,
                bucket: req.file.bucket,
                acl: req.file.acl,
                contentType: req.file.contentType,
                contentDisposition: req.file.contentDisposition,
                storageClass: req.file.storageClass,
                serverSideEncryption: req.file.serverSideEncryption,
                metadata: req.file.metadata,
                location: req.file.location,
                etag: req.file.etag,
                path: req.file.path,
                secure_url: req.file.secure_url,
                url: req.file.url,
                public_id: req.file.public_id,
                version: req.file.version,
                signature: req.file.signature,
                width: req.file.width,
                height: req.file.height,
                format: req.file.format,
                resource_type: req.file.resource_type,
                created_at: req.file.created_at,
                tags: req.file.tags,
                bytes: req.file.bytes,
                type: req.file.type,
                etag2: req.file.etag,
                placeholder: req.file.placeholder,
                eager: req.file.eager,
                responsive_breakpoints: req.file.responsive_breakpoints,
            });
            logger.info(`[PROFILE UPLOAD SUCCESS] File uploaded: ${req.file.originalname}`);
        }
        
        next();
    });
};

export default profileUploadMiddleware;
