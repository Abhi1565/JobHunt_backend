import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        // Check for token in cookies first
        let token = req.cookies.token;
        
        // If not in cookies, check Authorization header as fallback
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }
        
        console.log("Auth middleware - Cookies:", req.cookies);
        console.log("Auth middleware - Cookie header:", req.headers.cookie);
        console.log("Auth middleware - Origin:", req.headers.origin);
        console.log("Auth middleware - Token:", token ? "Present" : "Missing");
        
        if (!token) {
            console.log("Auth middleware - No token found");
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            })
        }
        
        if (!process.env.SECRET_KEY) {
            return res.status(500).json({
                message: "Server configuration error",
                success: false
            })
        }
        
        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        
        if (!decode) {
            console.log("Auth middleware - Invalid token");
            return res.status(401).json({
                message: "Invalid token",
                success: false
            })
        };
        console.log("Auth middleware - Token verified, userId:", decode.userId);
        req.id = decode.userId;
        next();
    } catch (error) {
        console.log("Auth middleware - Error:", error.message);
        return res.status(401).json({
            message: "Authentication failed",
            success: false
        });
    }
}
export default isAuthenticated;