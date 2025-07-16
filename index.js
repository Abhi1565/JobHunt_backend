import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
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
const corsOptions = {
   origin:'http://localhost:5173',
   credentials:true
}
app.use(cors(corsOptions))

const PORT = process.env.PORT || 3000;

// api's
app.use("/api/v1/user",userRoute);
app.use("/api/v1/company",companyRoute);
app.use("/api/v1/job",jobRoute);
app.use("/api/v1/application",applicationRoute);

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ message: "JobHunt API is running!" });
});

app.listen(PORT, async () => {
   try {
       await connectDB();
       console.log(`Server running at port ${PORT}`);
       console.log(`API available at http://localhost:${PORT}`);
   } catch (error) {
       console.error("Failed to start server:", error);
       process.exit(1);
   }
})