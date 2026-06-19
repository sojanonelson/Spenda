const User = require('../models/User');

// GET /api/users/partner
const getPartnerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.partnerId)
      return res.status(404).json({ success: false, message: 'No partner connected' });

    const partner = await User.findById(user.partnerId).select('name email profileImage createdAt');
    res.json({ success: true, partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, profileImage } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (profileImage) updates.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/partner — unlink partner
const unlinkPartner = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.partnerId)
      return res.status(400).json({ success: false, message: 'No partner to unlink' });

    await User.findByIdAndUpdate(user.partnerId, { partnerId: null });
    await User.findByIdAndUpdate(req.user._id, { partnerId: null });

    res.json({ success: true, message: 'Partner unlinked' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPartnerProfile, updateProfile, unlinkPartner };
