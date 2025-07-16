import mongoose from "mongoose";

const connectDB = async()=>{
    try {
        const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/jobhunt";
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.log('MongoDB connection error:', error);   
        process.exit(1);
    }
}
export default connectDB;