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

      res.json({
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        token: generateToken(user._id),
        subscriptionPaid: user.subscriptionPaid,
        isVerified: user.isVerified,
      });
    } else {
      res.status(401).json({ message: 'Invalid mobile or passkey' });
    }
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
      .populate('userId', 'name mobile subscriptionDate')
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

module.exports = {
  registerUser,
  loginUser,
  submitPayment,
  checkVerificationStatus,
  getVerificationRequests,
  updateVerificationStatus,
};