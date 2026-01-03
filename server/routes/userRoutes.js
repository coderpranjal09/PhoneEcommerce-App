const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  submitPayment,
  checkVerificationStatus,
  getVerificationRequests, // Make sure this matches
  updateVerificationStatus,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  updateSubscriptionStatus,
  updateUserVerification
} = require('../controllers/userController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/submit-payment', submitPayment);
router.get('/verification-status/:userId', checkVerificationStatus);

// Admin protected routes (add admin middleware if you have it)
router.get('/verification-requests', protect, getVerificationRequests);
router.put('/verification-requests/:requestId', protect, updateVerificationStatus);

// New admin routes for user management
router.get('/all', protect, getAllUsers);
router.get('/:userId', protect, getUserById);
router.put('/:userId/status', protect, updateUserStatus);
router.put('/:userId/subscription', protect, updateSubscriptionStatus);
router.put('/:userId/verification', protect, updateUserVerification);
router.delete('/:userId', protect, deleteUser);

module.exports = router;