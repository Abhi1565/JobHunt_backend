import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js"
import jobRoute from "./routes/job.route.js"
import applicationRoute from "./routes/application.route.js"

dotenv.config({});

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// Explicit CORS middleware to ensure it works
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// CORS configuration - allow all origins
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const PORT = process.env.PORT || 8000;

// api's
app.use("/api/v1/user",userRoute);
app.use("/api/v1/company",companyRoute);
app.use("/api/v1/job",jobRoute);
app.use("/api/v1/application",applicationRoute);

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ 
        message: "JobHunt API is running!",
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
});

app.listen(PORT, async () => {
   try {
       await connectDB();
       console.log(`Server running at port ${PORT}`);
       console.log(`API available at http://localhost:${PORT}`);
       console.log(`CORS configured for origins:`, corsOptions.origin);
       console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
   } catch (error) {
       console.error("Failed to start server:", error);
       process.exit(1);
   }
})