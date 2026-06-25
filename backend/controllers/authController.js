const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });
    if (user) {
      
      // Generate a mock OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      
      // Send Welcome / OTP Email
      const message = `
        <h2>Welcome to ShopNest, ${name}!</h2>
        <p>Thank you for registering on our platform.</p>
        <p>Your one-time verification/discount OTP is: <strong>${otp}</strong></p>
      `;

      await sendEmail({
        email: user.email,
        subject: 'Welcome to ShopNest - Your OTP',
        message
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Update user role (Admin only)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['user', 'admin', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Allowed roles: user, admin, manager' 
      });
    }

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (userId === req.user.id) {
      return res.status(403).json({ 
        message: 'You cannot change your own role' 
      });
    }

    // Update user role
    user.role = role;
    await user.save();

    // Send email notification about role change
    const message = `
      <h2>Role Updated - ShopNest</h2>
      <p>Hello ${user.name},</p>
      <p>Your account role has been updated to: <strong>${role.toUpperCase()}</strong></p>
      <p>If you didn't request this change, please contact support immediately.</p>
      <br>
      <p>Regards,<br>ShopNest Team</p>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Your Role Has Been Updated',
      message
    }).catch(err => console.error('Email send failed:', err));

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Toggle admin status (Convenience function)
const toggleAdminStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (userId === req.user.id) {
      return res.status(403).json({ 
        message: 'You cannot change your own admin status' 
      });
    }

    // Toggle role between 'admin' and 'user'
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    user.role = newRole;
    await user.save();

    // Send email notification about role change
    const message = `
      <h2>Admin Status Updated - ShopNest</h2>
      <p>Hello ${user.name},</p>
      <p>Your admin status has been ${newRole === 'admin' ? 'granted' : 'revoked'}.</p>
      <p>Your current role is: <strong>${newRole.toUpperCase()}</strong></p>
      <p>If you didn't request this change, please contact support immediately.</p>
      <br>
      <p>Regards,<br>ShopNest Team</p>
    `;

    await sendEmail({
      email: user.email,
      subject: `Admin Status ${newRole === 'admin' ? 'Granted' : 'Revoked'}`,
      message
    }).catch(err => console.error('Email send failed:', err));

    res.json({
      success: true,
      message: `User admin status ${newRole === 'admin' ? 'granted' : 'revoked'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Get single user details (Admin only)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting their own account
    if (userId === req.user.id) {
      return res.status(403).json({ 
        message: 'You cannot delete your own account' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    res.json({ 
      success: true, 
      message: `User ${user.name} deleted successfully` 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Update user profile (Self update)
const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is updating their own profile or is admin
    if (userId !== req.user.id) {
      return res.status(403).json({ 
        message: 'You can only update your own profile' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, password } = req.body;

    // Update fields
    if (name) user.name = name;
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Get user statistics for admin dashboard
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const userCount = await User.countDocuments({ role: 'user' });
    const managerCount = await User.countDocuments({ role: 'manager' });

    const recentUsers = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalUsers,
      adminCount,
      userCount,
      managerCount,
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getUsers,
  updateUserRole,
  toggleAdminStatus,
  getUserById,
  deleteUser,
  updateUserProfile,
  getUserStats
};