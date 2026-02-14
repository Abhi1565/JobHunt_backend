import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { sendHiredEmail, sendInterviewEmail, sendInterviewRescheduledEmail, sendRejectionEmail } from "../utils/mailer.js";

export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            })
        };
        // check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this jobs",
                success: false
            });
        }

        // check if the jobs exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            })
        }

        const now = new Date();
        if (!job.isArchived && job.deadline && now > new Date(job.deadline)) {
            job.isArchived = true;
            job.archivedAt = now;
            await job.save();
        }

        if (job.isArchived) {
            return res.status(400).json({
                message: "This job has been archived and is no longer accepting applications.",
                success: false
            });
        }

        // ensure user has resume before applying
        const user = await User.findById(userId);
        if (!user?.profile?.resume) {
            return res.status(400).json({
                message: "Please upload your resume in your profile before applying.",
                success: false
            });
        }
        // create a new application
        const newApplication = await Application.create({
            job:jobId,
            applicant:userId,
        });

        job.applications.push(newApplication._id);

        if (!job.applicationLockActivatedAt) {
            const requirements = Array.isArray(job.requirements) ? job.requirements : [];
            const coreCount = Math.ceil(requirements.length * 0.7);
            job.coreRequirements = requirements.slice(0, coreCount);
            job.lockedSalary = job.salary;
            job.applicationLockActivatedAt = new Date();
        }

        await job.save();
        return res.status(201).json({
            message:"Job applied successfully.",
            success:true
        })
    } catch (error) {
        console.log(error);
    }
};
export const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        });
        if(!application){
            return res.status(404).json({
                message:"No Applications",
                success:false
            })
        };
        // Filter out applications whose job was deleted
        const validApplications = application.filter((app) => app.job);

        // Clean up orphaned applications
        if (validApplications.length !== application.length) {
            const orphanIds = application
                .filter((app) => !app.job)
                .map((app) => app._id);
            if (orphanIds.length > 0) {
                await Application.deleteMany({ _id: { $in: orphanIds } });
            }
        }

        return res.status(200).json({
            application: validApplications,
            success:true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            succees:true
        });
    } catch (error) {
        console.log(error);
    }
}
export const updateStatus = async (req,res) => {
    try {
        const {
            status,
            interviewDate,
            interviewTime,
            mode,
            location,
            meetingLink,
            notes
        } = req.body;
        const applicationId = req.params.id;
        if(!status){
            return res.status(400).json({
                message:'status is required',
                success:false
            })
        };

        // find the application by applicantion id
        const application = await Application.findOne({ _id: applicationId })
            .populate({
                path: "job",
                populate: { path: "company" }
            })
            .populate("applicant");
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        if (!application.job) {
            return res.status(404).json({
                message: "Job not found for this application.",
                success: false
            });
        }

        const adminId = req.id;
        if (String(application.job.created_by) !== String(adminId)) {
            return res.status(403).json({
                message: "You are not authorized to update this application.",
                success: false
            });
        }

        const nextStatus = String(status).toLowerCase();
        const currentStatus = application.status;

        const allowedTransitions = {
            pending: ["shortlisted", "rejected"],
            shortlisted: ["interview_scheduled", "rejected"],
            interview_scheduled: ["interview_scheduled", "interview_rescheduled", "interview_completed", "shortlisted", "rejected"],
            interview_rescheduled: ["interview_rescheduled", "interview_completed", "rejected"],
            interview_completed: ["hired", "rejected"],
            rejected: [],
            hired: []
        };

        const isReschedule =
            (currentStatus === "interview_scheduled" && nextStatus === "interview_scheduled") ||
            (currentStatus === "interview_rescheduled" && nextStatus === "interview_rescheduled");
        if (!isReschedule && !allowedTransitions[currentStatus]?.includes(nextStatus)) {
            return res.status(400).json({
                message: `Invalid status transition from ${currentStatus} to ${nextStatus}.`,
                success: false
            });
        }

        if (nextStatus === "interview_scheduled" || nextStatus === "interview_rescheduled") {
            const parsedDate = new Date(interviewDate);
            if (!interviewDate || Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    message: "Valid interviewDate is required.",
                    success: false
                });
            }
            const timeValue = String(interviewTime || "").trim();
            if (!timeValue) {
                return res.status(400).json({
                    message: "interviewTime is required.",
                    success: false
                });
            }
            const modeValue = String(mode || "").toLowerCase();
            if (modeValue !== "online" && modeValue !== "onsite") {
                return res.status(400).json({
                    message: "mode must be online or onsite.",
                    success: false
                });
            }

            const locationValue = String(location || "").trim();
            const meetingLinkValue = String(meetingLink || "").trim();

            if (modeValue === "online" && !meetingLinkValue) {
                return res.status(400).json({
                    message: "meetingLink is required for online interviews.",
                    success: false
                });
            }
            if (modeValue === "onsite" && !locationValue) {
                return res.status(400).json({
                    message: "location is required for onsite interviews.",
                    success: false
                });
            }

            if (nextStatus === "interview_rescheduled") {
                const existingInterview = application.interview || {};
                const existingDate = existingInterview.date ? new Date(existingInterview.date).getTime() : null;
                const nextDate = parsedDate.getTime();
                const sameDate = existingDate === nextDate;
                const sameTime = (existingInterview.time || "") === timeValue;
                const sameMode = (existingInterview.mode || "") === modeValue;
                const sameLocation = (existingInterview.location || "") === locationValue;
                const sameMeetingLink = (existingInterview.meetingLink || "") === meetingLinkValue;
                const sameNotes = (existingInterview.notes || "") === String(notes || "").trim();

                if (sameDate && sameTime && sameMode && sameLocation && sameMeetingLink && sameNotes) {
                    return res.status(400).json({
                        message: "Please change at least one interview detail to reschedule.",
                        success: false
                    });
                }
            }

            application.interview = {
                date: parsedDate,
                time: timeValue,
                mode: modeValue,
                location: locationValue,
                meetingLink: meetingLinkValue,
                notes: String(notes || "").trim()
            };
        }

        if (currentStatus === "interview_scheduled" && nextStatus === "shortlisted") {
            application.interview = {
                date: null,
                time: "",
                mode: null,
                location: "",
                meetingLink: "",
                notes: ""
            };
        }

        application.status = nextStatus;
        await application.save();

        const applicantEmail = application.applicant?.email;
        const applicantName = application.applicant?.fullname || "Candidate";
        const jobTitle = application.job?.title || "this role";
        const companyName = application.job?.company?.name || "our company";

        if (applicantEmail && nextStatus === "interview_scheduled") {
            await sendInterviewEmail({
                to: applicantEmail,
                applicantName,
                jobTitle,
                companyName,
                interview: application.interview
            });
        }

        if (applicantEmail && nextStatus === "interview_rescheduled") {
            await sendInterviewRescheduledEmail({
                to: applicantEmail,
                applicantName,
                jobTitle,
                companyName,
                interview: application.interview
            });
        }

        if (applicantEmail && nextStatus === "rejected") {
            await sendRejectionEmail({
                to: applicantEmail,
                applicantName,
                jobTitle,
                companyName
            });
        }

        if (applicantEmail && nextStatus === "hired") {
            await sendHiredEmail({
                to: applicantEmail,
                applicantName,
                jobTitle,
                companyName,
                salary: application.job?.salary
            });
        }

        return res.status(200).json({
            message:"Status updated successfully.",
            success:true
        });

    } catch (error) {
        console.log(error);
    }
}
