import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        console.log("Auth middleware - Cookies:", req.cookies);
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
        return res.status(401).json({
            message: "Authentication failed",
            success: false
        });
    }
}
export default isAuthenticated;