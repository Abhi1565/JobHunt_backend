import express from "express"
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

router.route("/post").post(isAuthenticated, postJob);
router.route("/get").get(getAllJobs);
router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);
router.route("/get/:id").get(getJobById);

export default router;