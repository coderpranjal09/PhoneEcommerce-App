const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');

// ... (keep existing functions) ...

// Admin: Get all users
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      subscriptionStatus,
      verificationStatus,
      loginStatus
    } = req.query;

    const query = {};

    // Search by name or mobile
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by subscription status
    if (subscriptionStatus) {
      if (subscriptionStatus === 'paid') {
        query.subscriptionPaid = true;
      } else if (subscriptionStatus === 'unpaid') {
        query.subscriptionPaid = false;
      }
    }

    // Filter by verification status
    if (verificationStatus) {
      if (verificationStatus === 'verified') {
        query.isVerified = true;
      } else if (verificationStatus === 'unverified') {
        query.isVerified = false;
      }
    }

    // Filter by login status
    if (loginStatus) {
      if (loginStatus === 'online') {
        query.isLoggedIn = true;
      } else if (loginStatus === 'offline') {
        query.isLoggedIn = false;
      }
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-passkey') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get single user details
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-passkey')
      .populate('verificationRequests', 'status reviewedAt remarks');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get verification requests for this user
    const verificationRequests = await VerificationRequest.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      user,
      verificationHistory: verificationRequests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, isLoggedIn } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (isActive !== undefined) {
      user.isActive = isActive;
      // If deactivating, also log out the user
      if (!isActive) {
        user.isLoggedIn = false;
        user.lastLogoutAt = new Date();
      }
    }

    if (isLoggedIn !== undefined) {
      user.isLoggedIn = isLoggedIn;
      if (isLoggedIn) {
        user.lastLoginAt = new Date();
      } else {
        user.lastLogoutAt = new Date();
      }
    }

    await user.save();

    res.json({
      message: 'User status updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        isActive: user.isActive,
        isLoggedIn: user.isLoggedIn,
        subscriptionPaid: user.subscriptionPaid,
        isVerified: user.isVerified,
        lastLoginAt: user.lastLoginAt,
        lastLogoutAt: user.lastLogoutAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete verification requests first
    await VerificationRequest.deleteMany({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update subscription status
const updateSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subscriptionPaid, transactionId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (subscriptionPaid !== undefined) {
      user.subscriptionPaid = subscriptionPaid;
      if (subscriptionPaid) {
        user.subscriptionDate = new Date();
        if (transactionId) {
          user.transactionId = transactionId;
        }
      } else {
        user.subscriptionDate = null;
        user.transactionId = '';
      }
    }

    await user.save();

    res.json({
      message: 'Subscription status updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        subscriptionPaid: user.subscriptionPaid,
        subscriptionDate: user.subscriptionDate,
        transactionId: user.transactionId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update verification status directly
const updateUserVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = isVerified;
    user.verificationDate = isVerified ? new Date() : null;

    await user.save();

    // Also update any pending verification request
    await VerificationRequest.findOneAndUpdate(
      { userId, status: 'pending' },
      {
        status: isVerified ? 'approved' : 'rejected',
        reviewedBy: req.admin._id,
        reviewedAt: new Date(),
        remarks: isVerified ? 'Manually verified by admin' : 'Manually rejected by admin'
      }
    );

    res.json({
      message: `User verification ${isVerified ? 'approved' : 'rejected'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        isVerified: user.isVerified,
        verificationDate: user.verificationDate
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  forceLogoutUser,
  submitPayment,
  checkVerificationStatus,
  getVerificationRequests,
  updateVerificationStatus,
  // New exports
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  updateSubscriptionStatus,
  updateUserVerification
};