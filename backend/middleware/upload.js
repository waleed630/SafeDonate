import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import dotenv from "dotenv";
dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dtt20zowa';
const cloudApiKey = process.env.CLOUDINARY_API_KEY || '961416198668185';
const cloudApiSecret = process.env.CLOUDINARY_API_SECRET || 'tVjWdRKV4DjieH__oJ2VIh-g2IQ';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temp uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Validate Cloudinary config
const hasCloudinaryConfig = cloudName && cloudApiKey && cloudApiSecret;

let storage;

if (hasCloudinaryConfig) {
    logger.info('[UPLOAD] Using Cloudinary storage');
    cloudinary.config({
        cloud_name: cloudName,
        api_key: cloudApiKey,
        api_secret: cloudApiSecret,
    });

    storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'safedonate/campaigns',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        },
    });
} else {
    logger.warn('[UPLOAD] Cloudinary not configured, using local storage fallback');
    
    // Fallback: Local disk storage
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
}

const upload = multer({
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
}).fields([
    { name: 'images', maxCount: 6 },
    { name: 'image', maxCount: 1 },
]);

const normalizeUploadedFiles = (files) => {
    if (!files) return [];
    if (Array.isArray(files)) return files;
    return Object.values(files).flat();
};

const getUploadUrl = (file) => {
    return file?.path || file?.secure_url || file?.url || file?.filename || '';
};

// Wrap upload to handle errors gracefully
const uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            logger.error(`[UPLOAD MULTER ERROR] Field: ${err.field}, Message: ${err.message}`);
            return res.status(400).json({ 
                success: false, 
                message: `File upload error: ${err.message}` 
            });
        } else if (err) {
            logger.error(`[UPLOAD ERROR] Message: ${err.message || 'Unknown error'}`);
            return res.status(500).json({ 
                success: false, 
                message: `Upload failed: ${err.message || 'Unknown error'}` 
            });
        }

        req.files = normalizeUploadedFiles(req.files);

        // Log successful file upload for debugging
        if (req.files && req.files.length > 0) {
            logger.info(`[UPLOAD SUCCESS] ${req.files.length} file(s) uploaded`);
            req.files = req.files.map(file => ({
                ...file,
                path: getUploadUrl(file),
            }));
        }

        next();
    });
};

export default uploadMiddleware;