import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true
    },
    applicant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    status:{
        type:String,
        enum:['pending', 'shortlisted', 'interview_scheduled', 'interview_rescheduled', 'interview_completed', 'rejected', 'hired'],
        default:'pending'
    },
    interview: {
        date: { type: Date, default: null },
        time: { type: String, default: "" },
        mode: { type: String, enum: ["online", "onsite"], default: null },
        location: { type: String, default: "" },
        meetingLink: { type: String, default: "" },
        notes: { type: String, default: "" }
    }
},{timestamps:true});
export const Application  = mongoose.model("Application", applicationSchema);
