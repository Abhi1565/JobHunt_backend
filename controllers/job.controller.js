import { Job } from "../models/job.model.js";
import mongoose from "mongoose";

const parseRequirements = (requirements) => {
    if (Array.isArray(requirements)) {
        return requirements.map((req) => String(req).trim()).filter(Boolean);
    }
    if (typeof requirements === "string") {
        return requirements.split(/[,;\n]+/).map((req) => req.trim()).filter(Boolean);
    }
    return [];
};

const parseSalaryValue = (salary) => {
    const salaryRaw = String(salary).trim();
    const salaryMatch = salaryRaw.match(/^(\d+(\.\d+)?)(\s*LPA)?$/i);
    if (!salaryMatch) return null;

    const salaryValue = Number(salaryMatch[1]);
    if (!Number.isFinite(salaryValue) || salaryValue <= 0) return null;
    return salaryValue;
};

const parseDeadline = (deadline) => {
    const parsed = new Date(deadline);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const parsePositionValue = (position) => {
    const parsed = Number(position);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.trunc(parsed);
};

const initializeApplicantLocks = (job) => {
    if (job.applicationLockActivatedAt) return false;

    const requirements = Array.isArray(job.requirements) ? job.requirements : [];
    const coreCount = Math.ceil(requirements.length * 0.7);

    job.coreRequirements = requirements.slice(0, coreCount);
    job.lockedSalary = job.salary;
    job.applicationLockActivatedAt = new Date();
    return true;
};

const archiveExpiredJobs = async (extraFilter = {}) => {
    const now = new Date();
    await Job.updateMany(
        {
            ...extraFilter,
            isArchived: false,
            deadline: { $lt: now }
        },
        {
            $set: {
                isArchived: true,
                archivedAt: now
            }
        }
    );
};

// admin post krega job
export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, locationType, jobType, experience, position, companyId, deadline } = req.body;
        const userId = req.id;

        // Basic validation like company
        if (!title || !description || !requirements || !salary || !location || !locationType || !jobType || !experience || !position || !companyId || !deadline) {
            return res.status(400).json({
                message: "Something is missing.",
                success: false
            })
        };

        // Simple data processing
        const experienceLevel = parseInt(experience) || 0;
        const salaryValue = parseSalaryValue(salary);
        if (salaryValue === null) {
            return res.status(400).json({
                message: "Salary must be a number in LPA (e.g., 8 or 8.5).",
                success: false
            });
        }
        const parsedRequirements = parseRequirements(requirements);
        if (parsedRequirements.length === 0) {
            return res.status(400).json({
                message: "At least one requirement is required.",
                success: false
            });
        }

        const deadlineValue = parseDeadline(deadline);
        if (!deadlineValue) {
            return res.status(400).json({
                message: "A valid application deadline is required.",
                success: false
            });
        }

        const positionValue = parsePositionValue(position);
        if (positionValue === null) {
            return res.status(400).json({
                message: "Number of positions must be greater than 0.",
                success: false
            });
        }
        
        const job = await Job.create({
            title,
            description,
            requirements: parsedRequirements,
            salary: salaryValue,
            deadline: deadlineValue,
            location,
            locationType,
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
        await archiveExpiredJobs();
        
        let query = {
            isArchived: false,
            deadline: { $gte: new Date() }
        };
        
        // If keyword is provided, search in title and description
        if (keyword && keyword.trim() !== "") {
            const searchRegex = new RegExp(keyword, 'i'); // case-insensitive search
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { location: searchRegex },
                { locationType: searchRegex },
                { jobType: searchRegex }
            ];
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
        let job = await Job.findById(jobId)
            .populate("company")
            .populate({path:"applications"});
        if (!job) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };

        const now = new Date();
        if (!job.isArchived && job.deadline && new Date(job.deadline) < now) {
            job.isArchived = true;
            job.archivedAt = now;
            await job.save();
        }

        if (job.isArchived) {
            return res.status(404).json({
                message: "Job is no longer active.",
                success: false
            });
        }

        return res.status(200).json({ job, success: true });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

export const getAdminJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const adminId = req.id;

        let job = await Job.findById(jobId)
            .populate("company")
            .populate({ path: "applications" });

        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false
            });
        }

        if (String(job.created_by) !== String(adminId)) {
            return res.status(403).json({
                message: "You are not authorized to view this job.",
                success: false
            });
        }

        const now = new Date();
        if (!job.isArchived && job.deadline && new Date(job.deadline) < now) {
            job.isArchived = true;
            job.archivedAt = now;
            await job.save();
        }

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
        await archiveExpiredJobs({ created_by: adminId });
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

export const updateJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.id;
        const {
            title,
            description,
            requirements,
            salary,
            location,
            locationType,
            jobType,
            experience,
            position,
            companyId,
            deadline
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                message: "Invalid job id.",
                success: false
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false
            });
        }

        if (String(job.created_by) !== String(userId)) {
            return res.status(403).json({
                message: "You are not authorized to update this job.",
                success: false
            });
        }

        if (job.isArchived) {
            return res.status(400).json({
                message: "Archived jobs are read-only and cannot be edited.",
                success: false
            });
        }

        const hasApplicants = (job.applications?.length || 0) > 0;
        if (hasApplicants) {
            initializeApplicantLocks(job);
        }

        const restrictedFieldMessages = [];

        if (!hasApplicants) {
            if (title !== undefined) job.title = String(title).trim();
            if (description !== undefined) job.description = String(description).trim();
            if (location !== undefined) job.location = String(location).trim();
            if (locationType !== undefined) job.locationType = String(locationType).trim();
            if (jobType !== undefined) job.jobType = String(jobType).trim();
            if (experience !== undefined) job.experienceLevel = parseInt(experience) || 0;
            if (position !== undefined) {
                const positionValue = parsePositionValue(position);
                if (positionValue === null) {
                    return res.status(400).json({
                        message: "Number of positions must be greater than 0.",
                        success: false
                    });
                }
                job.position = positionValue;
            }
            if (companyId !== undefined) job.company = companyId;

            if (requirements !== undefined) {
                const parsedRequirements = parseRequirements(requirements);
                if (parsedRequirements.length <= 1 || parsedRequirements.length > 10) {
                    return res.status(400).json({
                        message: `Requirements must have at least 2 and at most 10 skills. Received: ${parsedRequirements.length}.`,
                        success: false
                    });
                }
                job.requirements = parsedRequirements;
            }

            if (salary !== undefined) {
                const parsedSalary = parseSalaryValue(salary);
                if (parsedSalary === null) {
                    return res.status(400).json({
                        message: "Salary must be a number in LPA (e.g., 8 or 8.5).",
                        success: false
                    });
                }
                job.salary = parsedSalary;
            }
        } else {
            const restrictedChanges = [
                { key: "title", label: "title", incoming: title, current: job.title },
                { key: "location", label: "location", incoming: location, current: job.location },
                { key: "locationType", label: "location type", incoming: locationType, current: job.locationType },
                { key: "jobType", label: "job type", incoming: jobType, current: job.jobType },
                { key: "experience", label: "experience level", incoming: experience, current: String(job.experienceLevel) },
                { key: "position", label: "position count", incoming: position, current: String(job.position) },
                { key: "companyId", label: "company", incoming: companyId, current: String(job.company) }
            ];

            restrictedChanges.forEach(({ incoming, current, label }) => {
                if (incoming !== undefined && String(incoming).trim() !== String(current).trim()) {
                    restrictedFieldMessages.push(label);
                }
            });

            if (restrictedFieldMessages.length > 0) {
                return res.status(400).json({
                    message: `These fields are locked after applications are received: ${restrictedFieldMessages.join(", ")}.`,
                    success: false
                });
            }

            if (description !== undefined) {
                job.description = String(description).trim();
            }

            if (requirements !== undefined) {
                const updatedRequirements = parseRequirements(requirements);
                if (updatedRequirements.length <= 1 || updatedRequirements.length > 10) {
                    return res.status(400).json({
                        message: `Requirements must have at least 2 and at most 10 skills. Received: ${updatedRequirements.length}.`,
                        success: false
                    });
                }

                job.requirements = updatedRequirements;
            }

            if (salary !== undefined) {
                const parsedSalary = parseSalaryValue(salary);
                if (parsedSalary === null) {
                    return res.status(400).json({
                        message: "Salary must be a number in LPA (e.g., 8 or 8.5).",
                        success: false
                    });
                }

                const baseSalary = Number.isFinite(job.lockedSalary) ? job.lockedSalary : job.salary;
                const minSalary = Number((baseSalary * 0.85).toFixed(2));
                const maxSalary = Number((baseSalary * 1.15).toFixed(2));

                if (parsedSalary < minSalary || parsedSalary > maxSalary) {
                    return res.status(400).json({
                        message: `Salary can only be changed within +/-15% of ${baseSalary} LPA (allowed range: ${minSalary}-${maxSalary} LPA).`,
                        success: false
                    });
                }

                job.salary = parsedSalary;
            }
        }

        if (deadline !== undefined) {
            const parsedDeadline = parseDeadline(deadline);
            if (!parsedDeadline) {
                return res.status(400).json({
                    message: "Please provide a valid deadline.",
                    success: false
                });
            }
            job.deadline = parsedDeadline;
        }

        await job.save();

        return res.status(200).json({
            message: "Job updated successfully.",
            job,
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
