const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Middleware for protecting admin routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try to find user as admin first
      req.admin = await Admin.findById(decoded.id).select('-password');
      
      // If not admin, try to find as regular user
      if (!req.admin) {
        req.user = await User.findById(decoded.id).select('-passkey');
      }
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// NEW: Middleware for protecting public routes (both admin and user)
const authenticateUser = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token belongs to admin
      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin) {
        req.user = admin; // Attach as user (could rename to req.admin if needed)
        req.userType = 'admin';
        return next();
      }
      
      // Check if token belongs to regular user
      const regularUser = await User.findById(decoded.id).select('-passkey');
      if (regularUser) {
        // Check if user is active
        if (!regularUser.isActive) {
          return res.status(403).json({ message: 'Account is deactivated' });
        }
        
        req.user = regularUser;
        req.userType = 'user';
        return next();
      }
      
      // If no user found with this token
      return res.status(401).json({ message: 'User not found' });
      
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

// NEW: Middleware to check if user is verified (for payment/verification routes)
const requireVerifiedUser = async (req, res, next) => {
  await authenticateUser(req, res, async () => {
    try {
      // If admin, allow access
      if (req.userType === 'admin') {
        return next();
      }
      
      // For regular users, check subscription and verification
      const user = await User.findById(req.user._id);
      
      if (!user.subscriptionPaid) {
        return res.status(402).json({ 
          message: 'Subscription payment required',
          paymentRequired: true 
        });
      }
      
      if (!user.isVerified) {
        return res.status(403).json({ 
          message: 'Account verification pending',
          verificationPending: true 
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
};

module.exports = { 
  protect, 
  authenticateUser, 
  requireVerifiedUser 
};