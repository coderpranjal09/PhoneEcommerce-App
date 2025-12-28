const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  submitPayment,
  checkVerificationStatus,
  getVerificationRequests,
  updateVerificationStatus,
} = require('../controllers/userController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/submit-payment', submitPayment);
router.get('/verification-status/:userId', checkVerificationStatus);

// Admin protected routes
router.get('/verification-requests', protect, getVerificationRequests);
router.put('/verification-requests/:requestId', protect, updateVerificationStatus);

module.exports = router;