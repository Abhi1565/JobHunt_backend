import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        // Check for token in cookies first
        let token = req.cookies.token;
        
        // If not in cookies, check Authorization header as fallback
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }
        
        if (!token) {
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
            return res.status(401).json({
                message: "Invalid token",
                success: false
            })
        };
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