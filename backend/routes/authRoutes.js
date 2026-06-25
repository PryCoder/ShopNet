const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getUsers,
  updateUserRole,
  toggleAdminStatus,
  getUserById,
  deleteUser,
  updateUserProfile,
  getUserStats
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.get('/users', protect, admin, getUsers);
router.get('/users/:userId', protect, admin, getUserById);
router.put('/users/:userId/profile', protect, updateUserProfile);

// Admin only routes
router.put('/users/:userId/role', protect, admin, updateUserRole);
router.put('/users/:userId/toggle-admin', protect, admin, toggleAdminStatus);
router.delete('/users/:userId', protect, admin, deleteUser);
router.get('/stats', protect, admin, getUserStats);

module.exports = router;