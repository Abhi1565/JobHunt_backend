import { Job } from "../models/job.model.js";
import mongoose from "mongoose";

// admin post krega job
export const postJob = async (req, res) => {
    try {
        console.log("=== JOB CREATION START ===");
        console.log("Received job data:", req.body);
        console.log("User ID from token:", req.id);
        console.log("Request headers:", req.headers);
        
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;

        if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
            console.log("Missing required fields:", { title, description, requirements, salary, location, jobType, experience, position, companyId });
            return res.status(400).json({
                message: "Something is missing.",
                success: false
            })
        };
        
        // Convert experience to number - handle various formats
        let experienceLevel;
        if (typeof experience === 'string') {
            // Extract the first number from the string (e.g., "2 years" -> 2, "Entry level" -> 0)
            const experienceMatch = experience.match(/\d+/);
            if (experienceMatch) {
                experienceLevel = parseInt(experienceMatch[0]);
            } else {
                // If no number found, default to 0 (entry level)
                experienceLevel = 0;
            }
        } else {
            experienceLevel = Number(experience);
        }
        
        if (isNaN(experienceLevel)) {
            experienceLevel = 0; // Default to entry level if parsing fails
        }
        
        // Parse salary - extract numeric value from strings like "60 LPA"
        let salaryValue;
        if (typeof salary === 'string') {
            // Extract the first number from the string
            const salaryMatch = salary.match(/\d+/);
            if (salaryMatch) {
                salaryValue = parseInt(salaryMatch[0]);
            } else {
                return res.status(400).json({
                    message: "Salary must contain a valid number.",
                    success: false
                });
            }
        } else {
            salaryValue = Number(salary);
        }
        
        if (isNaN(salaryValue)) {
            return res.status(400).json({
                message: "Salary must be a valid number.",
                success: false
            });
        }
        
        const jobData = {
            title,
            description,
            requirements: requirements.split(","),
            salary: salaryValue,
            location,
            jobType,
            experienceLevel,
            position: Number(position),
            company: companyId,
            created_by: userId
        };
        
        console.log("Creating job with data:", jobData);
        
        // Validate that all required fields are present
        if (!jobData.title || !jobData.description || !jobData.requirements || 
            jobData.salary === undefined || !jobData.location || !jobData.jobType || 
            jobData.experienceLevel === undefined || jobData.position === undefined || 
            !jobData.company || !jobData.created_by) {
            console.log("Missing required fields in jobData:", jobData);
            return res.status(400).json({
                message: "Missing required fields for job creation",
                success: false
            });
        }
        
        console.log("All validations passed, attempting to create job...");
        
        // Check if the company exists
        const Company = mongoose.model('Company');
        const companyExists = await Company.findById(jobData.company);
        if (!companyExists) {
            console.log("Company not found:", jobData.company);
            return res.status(400).json({
                message: "Company not found",
                success: false
            });
        }
        console.log("Company found:", companyExists.name);
        
        const job = await Job.create(jobData);
        
        console.log("Job created successfully:", job);
        console.log("=== JOB CREATION END ===");
        
        return res.status(201).json({
            message: "New job created successfully.",
            job,
            success: true
        });
    } catch (error) {
        console.log("Error creating job:", error);
        console.log("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        // Check if it's a MongoDB connection error
        if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
            return res.status(500).json({
                message: "Database connection error. Please try again later.",
                success: false
            });
        }
        
        // Check if it's a validation error
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Validation error: " + error.message,
                success: false
            });
        }
        
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
        const keyword = req.query.keyword || "";
        console.log("Backend received keyword:", keyword);
        
        let query = {};
        
        // Only apply search filter if keyword is provided
        if (keyword && keyword.trim() !== "") {
            // Create a case-insensitive regex pattern that matches the keyword anywhere in the text
            const searchPattern = keyword.trim();
            
            query = {
                $or: [
                    { title: { $regex: searchPattern, $options: "i" } },
                    { description: { $regex: searchPattern, $options: "i" } }
                ]
            };
            
            console.log("Applied search query:", JSON.stringify(query));
        } else {
            console.log("No keyword provided, returning all jobs");
        }
        
        const jobs = await Job.find(query).populate({
            path: "company"
        }).sort({createdAt: -1});

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
        return res.status(500).json({
            message: "Internal server error",
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
        const jobs = await Job.find({ created_by: adminId }).populate({
            path: 'company'
        }).sort({createdAt: -1});
        console.log("Found admin jobs count:", jobs.length);
        console.log("=== GET ADMIN JOBS END ===");
        return res.status(200).json({
            jobs: jobs || [],
            success: true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}