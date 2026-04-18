// middleware/errorHandler.js
import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
    // Log full details for debugging
    logger.error(
        `${err.name}: ${err.message} | URL: ${req.originalUrl} | IP: ${req.ip || "unknown"}`
    );

    // Support both statusCode and status (some libraries use .status)
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Internal Server Error";

    // ✅ Special handling for common errors (makes API much cleaner)
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation failed";
    }
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Invalid or expired token";
    }
    if (err.code === 11000) { // Mongoose duplicate key
        statusCode = 400;
        message = "Duplicate value detected";
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && {
            error: err.name,
            stack: err.stack,
        }),
    });
};

export default errorHandler;