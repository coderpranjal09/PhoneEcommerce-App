const express = require('express');
const router = express.Router();
const { 
  protect, 
  authenticateUser, 
  requireVerifiedUser 
} = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  submitPayment,
  checkVerificationStatus,
  getVerificationRequests,
  updateVerificationStatus,
} = require('../controllers/userController');

// Public routes (no authentication needed)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require either admin or user authentication)
router.post('/submit-payment', authenticateUser, submitPayment);
router.get('/verification-status/:userId', authenticateUser, checkVerificationStatus);

// Admin-only protected routes
router.get('/verification-requests', protect, getVerificationRequests);
router.put('/verification-requests/:requestId', protect, updateVerificationStatus);

module.exports = router;