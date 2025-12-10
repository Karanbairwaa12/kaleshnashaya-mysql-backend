const { User } = require('../models');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'name', 'profilePicture', 'phone', 'bio', 'createdAt']
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio } = req.body;

    await req.user.update({
      name: name || req.user.name,
      phone: phone !== undefined ? phone : req.user.phone,
      bio: bio !== undefined ? bio : req.user.bio
    });

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'name', 'profilePicture', 'phone', 'bio']
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await req.user.update({ isActive: false });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};