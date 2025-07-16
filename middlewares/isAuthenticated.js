import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        console.log("Auth middleware - cookies:", req.cookies);
        console.log("Auth middleware - token:", token ? "exists" : "missing");
        
        if (!token) {
            console.log("Auth middleware - No token found");
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            })
        }
        
        if (!process.env.SECRET_KEY) {
            console.log("Auth middleware - SECRET_KEY missing");
            return res.status(500).json({
                message: "Server configuration error",
                success: false
            })
        }
        
        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        console.log("Auth middleware - decoded token:", decode);
        
        if (!decode) {
            console.log("Auth middleware - Invalid token");
            return res.status(401).json({
                message: "Invalid token",
                success: false
            })
        };
        req.id = decode.userId;
        console.log("Auth middleware - Authentication successful for user:", req.id);
        next();
    } catch (error) {
        console.log("Authentication error:", error);
        return res.status(401).json({
            message: "Authentication failed",
            success: false
        });
    }
}
export default isAuthenticated;