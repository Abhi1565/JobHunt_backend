import express from "express"
import mongoose from "mongoose";
import { postJob, getAllJobs, getAdminJobs, getJobById } from "../controllers/job.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Test endpoint to check authentication
router.route("/test-auth").get(isAuthenticated, (req, res) => {
    res.json({ 
        message: "Authentication successful", 
        userId: req.id,
        success: true 
    });
});

// Test endpoint to check if job routes are working
router.route("/test").get((req, res) => {
    res.json({ 
        message: "Job routes are working", 
        timestamp: new Date().toISOString(),
        success: true 
    });
});

// Test database connection
router.route("/test-db").get(async (req, res) => {
    try {
        const Job = mongoose.model('Job');
        const count = await Job.countDocuments();
        res.json({ 
            message: "Database connection working", 
            jobCount: count,
            success: true 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Database error: " + error.message, 
            success: false 
        });
    }
});

router.route("/post").post(isAuthenticated, postJob);
router.route("/get").get(getAllJobs);
router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);
router.route("/get/:id").get(getJobById);

export default router;