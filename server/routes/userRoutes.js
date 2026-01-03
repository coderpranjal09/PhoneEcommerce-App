const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware'); // Assuming you have admin middleware
const {
  registerUser,
  loginUser,
  submitPayment,
  checkVerificationStatus,
  getVerificationRequests,
  updateVerificationStatus,
  // New imports
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

// Admin protected routes
router.get('/verification-requests', protect, admin, getVerificationRequests);
router.put('/verification-requests/:requestId', protect, admin, updateVerificationStatus);

// New admin routes for user management
router.get('/all', protect, admin, getAllUsers);
router.get('/:userId', protect, admin, getUserById);
router.put('/:userId/status', protect, admin, updateUserStatus);
router.put('/:userId/subscription', protect, admin, updateSubscriptionStatus);
router.put('/:userId/verification', protect, admin, updateUserVerification);
router.delete('/:userId', protect, admin, deleteUser);

module.exports = router;