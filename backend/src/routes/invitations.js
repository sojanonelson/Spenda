const express = require('express');
const router = express.Router();
const { sendInvitation, acceptInvitation, rejectInvitation, getPendingInvitations, getSentInvitations } = require('../controllers/invitationController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/send', sendInvitation);
router.post('/accept', acceptInvitation);
router.post('/reject', rejectInvitation);
router.get('/pending', getPendingInvitations);
router.get('/sent', getSentInvitations);

module.exports = router;
