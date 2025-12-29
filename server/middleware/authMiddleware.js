const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Middleware for both users and admins
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try to find user first
      req.user = await User.findById(decoded.id).select('-passkey');
      
      // If not user, try to find admin
      if (!req.user) {
        req.admin = await Admin.findById(decoded.id).select('-password');
        if (!req.admin) {
          return res.status(401).json({ message: 'Not authorized' });
        }
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

// Middleware for admin only
const adminProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Only check for admin
      req.admin = await Admin.findById(decoded.id).select('-password');
      
      if (!req.admin) {
        return res.status(403).json({ message: 'Not authorized as admin' });
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

// Middleware to check if user is verified and has paid subscription
const userProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check for user
      req.user = await User.findById(decoded.id).select('-passkey');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      
      // Check if user is active
      if (!req.user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }
      
      // Check if subscription is paid
      if (!req.user.subscriptionPaid) {
        return res.status(402).json({ 
          message: 'Subscription payment required',
          paymentRequired: true 
        });
      }
      
      // Check if user is verified
      if (!req.user.isVerified) {
        return res.status(403).json({ 
          message: 'Account verification pending',
          verificationPending: true 
        });
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

module.exports = { protect, adminProtect, userProtect };