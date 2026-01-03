const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, mobile, passkey } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ mobile });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash passkey
    const salt = await bcrypt.genSalt(10);
    const hashedPasskey = await bcrypt.hash(passkey, salt);

    // Create user
    const user = await User.create({
      name,
      mobile,
      passkey: hashedPasskey,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      mobile: user.mobile,
      subscriptionPaid: user.subscriptionPaid,
      isVerified: user.isVerified,
      isLoggedIn: user.isLoggedIn,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { mobile, passkey } = req.body;

    const user = await User.findOne({ mobile });

    if (user && (await bcrypt.compare(passkey, user.passkey))) {
      // Check if user is already logged in
      if (user.isLoggedIn) {
        return res.status(403).json({ 
          message: 'User is already logged in on another device',
          alreadyLoggedIn: true 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

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

      // Set user as logged in
      user.isLoggedIn = true;
      user.lastLoginAt = new Date();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        token: generateToken(user._id),
        subscriptionPaid: user.subscriptionPaid,
        isVerified: user.isVerified,
        isLoggedIn: user.isLoggedIn,
      });
    } else {
      res.status(401).json({ message: 'Invalid mobile or passkey' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const logoutUser = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you have authentication middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set user as logged out
    user.isLoggedIn = false;
    user.lastLogoutAt = new Date();
    await user.save();

    res.json({
      message: 'Logged out successfully',
      isLoggedIn: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const forceLogoutUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // This should be protected for admin use only
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Force logout user
    user.isLoggedIn = false;
    user.lastLogoutAt = new Date();
    await user.save();

    res.json({
      message: 'User force logged out successfully',
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        isLoggedIn: user.isLoggedIn,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const submitPayment = async (req, res) => {
  try {
    const { userId, transactionId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already paid
    if (user.subscriptionPaid) {
      return res.status(400).json({ message: 'Subscription already paid' });
    }

    // Update user with transaction ID and mark as paid
    user.transactionId = transactionId;
    user.subscriptionPaid = true;
    user.subscriptionDate = new Date();
    await user.save();

    // Create verification request
    const verificationRequest = await VerificationRequest.create({
      userId: user._id,
      name: user.name,
      mobile: user.mobile,
      transactionId: transactionId,
      status: 'pending',
    });

    res.json({
      message: 'Payment submitted successfully',
      verificationRequestId: verificationRequest._id,
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        subscriptionPaid: user.subscriptionPaid,
        isLoggedIn: user.isLoggedIn,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const checkVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const verificationRequest = await VerificationRequest.findOne({
      userId: user._id,
      status: 'pending',
    }).sort({ createdAt: -1 });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        subscriptionPaid: user.subscriptionPaid,
        isVerified: user.isVerified,
        isLoggedIn: user.isLoggedIn,
      },
      verificationRequest: verificationRequest ? {
        status: verificationRequest.status,
        submittedAt: verificationRequest.createdAt,
        reviewedAt: verificationRequest.reviewedAt,
      } : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin controllers
const getVerificationRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await VerificationRequest.find(query)
      .populate('userId', 'name mobile subscriptionDate isLoggedIn lastLoginAt')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateVerificationStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, remarks } = req.body;

    const verificationRequest = await VerificationRequest.findById(requestId);
    if (!verificationRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update verification request
    verificationRequest.status = status;
    verificationRequest.reviewedBy = req.admin._id;
    verificationRequest.reviewedAt = new Date();
    verificationRequest.remarks = remarks || '';
    await verificationRequest.save();

    // Update user verification status
    const user = await User.findById(verificationRequest.userId);
    if (user) {
      user.isVerified = status === 'approved';
      user.verificationDate = status === 'approved' ? new Date() : null;
      await user.save();
    }

    res.json({
      message: `Verification request ${status} successfully`,
      verificationRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// New Admin functions for user management
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

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-passkey');

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
  getVerificationRequests, // FIXED: Changed from gettVerificationRequests to getVerificationRequests
  updateVerificationStatus,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  updateSubscriptionStatus,
  updateUserVerification
};