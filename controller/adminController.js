const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Market = require('../models/marketSchema');
const Order = require('../models/orderSchema');

// Get high-level platform analytics for admin dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalMarkets = await Market.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalFarmers,
        totalCustomers,
        totalMarkets,
        totalProducts,
        totalOrders
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin dashboard analytics', error: error.message });
  }
};

// Get all registered users (supports filtering by role)
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users list', error: error.message });
  }
};

// Update user status or role (e.g., suspend or upgrade user)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isVerified } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role) user.role = role;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile', error: error.message });
  }
};

// Delete a user from the platform
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};