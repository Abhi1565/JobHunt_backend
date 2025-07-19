import { Job } from "../models/job.model.js";
import mongoose from "mongoose";

// admin post krega job
export const postJob = async (req, res) => {
    try {
        console.log("=== JOB CREATION START ===");
        console.log("Received job data:", req.body);
        console.log("User ID from token:", req.id);
        
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;

        // Basic validation like company
        if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
            return res.status(400).json({
                message: "Something is missing.",
                success: false
            })
        };

        // Simple data processing
        const experienceLevel = parseInt(experience) || 0;
        const salaryValue = parseInt(salary.match(/\d+/)?.[0] || '0');
        const positionValue = parseInt(position) || 1;
        
        const job = await Job.create({
            title,
            description,
            requirements: requirements.split(",").map(req => req.trim()),
            salary: salaryValue,
            location,
            jobType,
            experienceLevel,
            position: positionValue,
            company: companyId,
            created_by: userId
        });
        
        console.log("Job created successfully:", job._id);
        console.log("=== JOB CREATION END ===");
        
        return res.status(201).json({
            message: "New job created successfully.",
            job,
            success: true
        });
    } catch (error) {
        console.log("Error creating job:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// student k liye
export const getAllJobs = async (req, res) => {
    try {
        console.log("=== GET ALL JOBS START ===");
        
        // Simple query like company - no complex logic
        const jobs = await Job.find({}).populate("company").sort({createdAt: -1});

        console.log("Found jobs count:", jobs.length);
        
        // Log the found jobs for debugging
        if (jobs.length > 0) {
            console.log("Found jobs titles:", jobs.map(job => job.title));
        }

        console.log("=== GET ALL JOBS END ===");
        return res.status(200).json({
            jobs: jobs || [],
            success: true
        })
    } catch (error) {
        console.log("Error in getAllJobs:", error);
        console.log("Error details:", error.message);
        return res.status(500).json({
            message: "Internal server error: " + error.message,
            success: false
        });
    }
}
// student
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({path:"applications"});
        if (!job) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };
        return res.status(200).json({ job, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
    try {
        console.log("=== GET ADMIN JOBS START ===");
        const adminId = req.id;
        console.log("Admin ID:", adminId);
        
        const jobs = await Job.find({ created_by: adminId }).populate("company").sort({createdAt: -1});
        
        console.log("Found admin jobs count:", jobs.length);
        console.log("=== GET ADMIN JOBS END ===");
        return res.status(200).json({
            jobs: jobs || [],
            success: true
        })
    } catch (error) {
        console.log("Error in getAdminJobs:", error);
        console.log("Error details:", error.message);
        return res.status(500).json({
            message: "Internal server error: " + error.message,
            success: false
        });
    }
}