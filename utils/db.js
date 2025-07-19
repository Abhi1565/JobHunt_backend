import mongoose from "mongoose";

const connectDB = async()=>{
    try {
        const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/jobhunt";
        console.log('Attempting to connect to MongoDB...');
        console.log('MongoDB URI:', mongoURI ? 'Set' : 'Not set');
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
        
        // Test the connection
        const db = mongoose.connection;
        db.on('error', (error) => {
            console.error('MongoDB connection error:', error);
        });
        
        db.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
        
    } catch (error) {
        console.log('MongoDB connection error:', error);   
        console.log('Connection failed. Please check your MongoDB URI and network connection.');
        process.exit(1);
    }
}
export default connectDB;