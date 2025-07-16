import { Job } from "../models/job.model.js";

// admin post krega job
export const postJob = async (req, res) => {
    try {
        console.log("Received job data:", req.body);
        console.log("User ID from token:", req.id);
        
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;

        if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
            console.log("Missing required fields:", { title, description, requirements, salary, location, jobType, experience, position, companyId });
            return res.status(400).json({
                message: "Something is missing.",
                success: false
            })
        };
        
        // Convert experience to number
        const experienceLevel = parseInt(experience);
        if (isNaN(experienceLevel)) {
            return res.status(400).json({
                message: "Experience level must be a valid number.",
                success: false
            })
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
        
        const job = await Job.create(jobData);
        
        console.log("Job created successfully:", job);
        
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
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// student k liye
export const getAllJobs = async (req, res) => {
    try {
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
        }).sort({createdAt: -1 });

        console.log("Found jobs count:", jobs.length);
        
        // Log the found jobs for debugging
        if (jobs.length > 0) {
            console.log("Found jobs titles:", jobs.map(job => job.title));
        }

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
        const adminId = req.id;
        const jobs = await Job.find({ created_by: adminId }).populate({path:'company',createdAt:-1});
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