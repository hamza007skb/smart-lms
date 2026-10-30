// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Protect routes (Make sure user is logged in)
exports.protect = async (req, res, next) => {
    let token;

    // Check if the token is in the headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify token using your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from the database and attach it to the request (minus the password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user || req.user.active === false) return res.status(401).json({ message: 'Account unavailable' });
            next(); // Move on to the next function/route
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// 2. Role Authorization (Make sure user is a Teacher, etc.)
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role '${req.user.role}' is not authorized to access this route` 
            });
        }
        next();
    };
};