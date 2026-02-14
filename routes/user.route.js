import express from "express"
import { checkEmail, login, logout, register, requestPasswordReset, resetPassword, updateProfile } from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload, profileUpload } from "../middlewares/multer.js";
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();

router.route("/register").post(singleUpload,register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/profile/update").post(isAuthenticated,profileUpload,updateProfile);
router.route("/check-email").get(checkEmail);
router.route("/forgot-password").post(requestPasswordReset);
router.route("/reset-password").post(resetPassword);

// Test endpoint to check current user authentication
router.route("/me").get(isAuthenticated, (req, res) => {
    res.json({
        message: "User is authenticated",
        userId: req.id,
        success: true
    });
});

// Test endpoint to verify Cloudinary configuration
router.route("/test-cloudinary").get((req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    console.log("Cloudinary config check:", {
        cloudName: cloudName ? "set" : "missing",
        apiKey: apiKey ? "set" : "missing", 
        apiSecret: apiSecret ? "set" : "missing"
    });
    
    if (!cloudName || !apiKey || !apiSecret) {
        return res.status(500).json({
            message: "Cloudinary environment variables are missing",
            success: false,
            missing: {
                cloudName: !cloudName,
                apiKey: !apiKey,
                apiSecret: !apiSecret
            }
        });
    }
    
    // Test Cloudinary connection
    try {
        res.json({
            message: "Cloudinary environment variables are configured",
            success: true,
            cloudName: cloudName,
            apiKeyExists: !!apiKey,
            apiSecretExists: !!apiSecret,
            config: cloudinary.config()
        });
    } catch (error) {
        res.status(500).json({
            message: "Cloudinary configuration error",
            success: false,
            error: error.message
        });
    }
});

export default router;
