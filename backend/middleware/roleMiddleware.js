/**
 * Role middleware: Verifies if req.user has required role(s)
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user?.role || "unknown"}' is not authorized.`,
      });
    }
    next();
  };
};

export default authorizeRoles;
