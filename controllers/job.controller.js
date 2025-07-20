import { Job } from "../models/job.model.js";
import mongoose from "mongoose";

// admin post krega job
export const postJob = async (req, res) => {
    try {
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
        
        return res.status(201).json({
            message: "New job created successfully.",
            job,
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// student k liye
export const getAllJobs = async (req, res) => {
    try {
        const { keyword } = req.query;
        
        let query = {};
        
        // If keyword is provided, search in title and description
        if (keyword && keyword.trim() !== "") {
            const searchRegex = new RegExp(keyword, 'i'); // case-insensitive search
            query = {
                $or: [
                    { title: searchRegex },
                    { description: searchRegex },
                    { location: searchRegex },
                    { jobType: searchRegex }
                ]
            };
        }
        
        const jobs = await Job.find(query).populate("company").sort({createdAt: -1});

        return res.status(200).json({
            jobs: jobs || [],
            success: true
        })
    } catch (error) {
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
        const jobs = await Job.find({ created_by: adminId }).populate("company").sort({createdAt: -1});
        
        return res.status(200).json({
            jobs: jobs || [],
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}