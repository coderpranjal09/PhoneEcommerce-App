const express = require('express');
const router = express.Router();
const { protect, adminProtect, userProtect } = require('../middleware/authMiddleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// Get all products - accessible by both users (verified & paid) and admins
// We'll create a custom middleware that allows both
const userOrAdminProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try to find admin first (admins don't need verification checks)
      req.admin = await Admin.findById(decoded.id).select('-password');
      
      if (!req.admin) {
        // If not admin, check for user
        req.user = await User.findById(decoded.id).select('-passkey');
        
        if (!req.user) {
          return res.status(401).json({ message: 'Not authorized' });
        }
        
        // User verification checks
        if (!req.user.isActive) {
          return res.status(403).json({ message: 'Account is deactivated' });
        }
        
        if (!req.user.subscriptionPaid) {
          return res.status(402).json({ 
            message: 'Subscription payment required',
            paymentRequired: true 
          });
        }
        
        if (!req.user.isVerified) {
          return res.status(403).json({ 
            message: 'Account verification pending',
            verificationPending: true 
          });
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

// Apply userOrAdminProtect for GET routes
// Apply adminProtect for POST, PUT, DELETE routes

router.route('/')
  .get(userOrAdminProtect, getProducts)  // Both users and admins can view
  .post(adminProtect, createProduct);    // Only admins can create

router.route('/:id')
  .get(userOrAdminProtect, getProductById)  // Both users and admins can view single
  .put(adminProtect, updateProduct)         // Only admins can update
  .delete(adminProtect, deleteProduct);     // Only admins can delete

module.exports = router;