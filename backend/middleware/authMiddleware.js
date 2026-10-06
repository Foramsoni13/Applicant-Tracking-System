import jwt from "jsonwebtoken";
import User from "../models/User.js";
import HR from "../models/HR.js";

/**
 * Protect middleware: Verifies JWT token from Authorization header (Bearer <token>)
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const secret = process.env.JWT_SECRET || "AI_ATS_SECRET";
      const decoded = jwt.verify(token, secret);

      // Check User or HR collection
      let user = await User.findById(decoded.id).select("-password");
      if (!user) {
        user = await HR.findById(decoded.id).select("-password");
      }

      req.user = user || { _id: decoded.id, role: decoded.role, email: decoded.email };
      return next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid or expired token",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

export default protect;
