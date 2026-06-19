const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Notification = require('../models/Notification');
const { sendPartnerInvitationEmail, sendInvitationAcceptedEmail } = require('../services/emailService');
const { emitToUser } = require('../services/socketService');

// POST /api/invitations/send
const sendInvitation = async (req, res) => {
  try {
    const { receiverEmail } = req.body;
    if (!receiverEmail)
      return res.status(400).json({ success: false, message: 'Receiver email is required' });

    const sender = await User.findById(req.user._id);

    if (sender.email === receiverEmail.toLowerCase())
      return res.status(400).json({ success: false, message: 'You cannot invite yourself' });

    if (sender.partnerId)
      return res.status(400).json({ success: false, message: 'You already have a partner' });

    // Check for existing pending
    const existing = await Invitation.findOne({
      senderId: req.user._id,
      receiverEmail: receiverEmail.toLowerCase(),
      status: 'pending',
    });
    if (existing)
      return res.status(409).json({ success: false, message: 'Invitation already sent' });

    const invitation = await Invitation.create({
      senderId: req.user._id,
      receiverEmail: receiverEmail.toLowerCase(),
    });

    const invitationUrl = `spenda://accept-invitation?id=${invitation._id}`;
    try {
      await sendPartnerInvitationEmail(receiverEmail, sender.name, invitationUrl);
    } catch (e) {
      console.error('[Invitation] Email failed:', e.message);
    }

    // Notify receiver if they're already a user
    const receiver = await User.findOne({ email: receiverEmail.toLowerCase() });
    if (receiver) {
      const notif = await Notification.create({
        userId: receiver._id,
        title: '🤝 Partner Invitation',
        message: `${sender.name} invited you to be their Spenda partner!`,
        type: 'invitation',
      });
      emitToUser(String(receiver._id), 'notification', notif);
    }

    res.status(201).json({ success: true, message: 'Invitation sent!', invitation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/invitations/accept
const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const invitation = await Invitation.findById(invitationId).populate('senderId', 'name email');

    if (!invitation || invitation.status !== 'pending')
      return res.status(404).json({ success: false, message: 'Invitation not found or already processed' });

    if (invitation.receiverEmail !== req.user.email.toLowerCase())
      return res.status(403).json({ success: false, message: 'This invitation is not for you' });

    // Link the two users
    invitation.status = 'accepted';
    await invitation.save();

    await User.findByIdAndUpdate(req.user._id, { partnerId: invitation.senderId._id });
    await User.findByIdAndUpdate(invitation.senderId._id, { partnerId: req.user._id });

    // Notify both
    const notif1 = await Notification.create({
      userId: req.user._id,
      title: '🎉 Partner Connected!',
      message: `You are now connected with ${invitation.senderId.name}`,
      type: 'partner_connected',
    });
    const notif2 = await Notification.create({
      userId: invitation.senderId._id,
      title: '🎉 Partner Connected!',
      message: `${req.user.name} accepted your partner invitation!`,
      type: 'partner_connected',
    });

    emitToUser(String(req.user._id), 'notification', notif1);
    emitToUser(String(invitation.senderId._id), 'notification', notif2);
    emitToUser(String(invitation.senderId._id), 'partner_connected', { partner: req.user });

    try {
      await sendInvitationAcceptedEmail(invitation.senderId.email, invitation.senderId.name, req.user.name);
    } catch (e) {}

    res.json({ success: true, message: 'Invitation accepted! Partners connected.', partner: invitation.senderId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/invitations/reject
const rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const invitation = await Invitation.findById(invitationId);
    if (!invitation || invitation.status !== 'pending')
      return res.status(404).json({ success: false, message: 'Invitation not found' });

    invitation.status = 'rejected';
    await invitation.save();

    res.json({ success: true, message: 'Invitation rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/invitations/pending
const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      receiverEmail: req.user.email.toLowerCase(),
      status: 'pending',
    }).populate('senderId', 'name email profileImage');

    res.json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/invitations/sent
const getSentInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ senderId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendInvitation, acceptInvitation, rejectInvitation, getPendingInvitations, getSentInvitations };
