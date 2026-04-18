// middleware/role.js
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // Extra safety (in case protect middleware somehow fails)
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${roles.join(" or ")}`,
                requiredRoles: roles,
                yourRole: req.user.role
            });
        }

        next();
    };
};

export default restrictTo;