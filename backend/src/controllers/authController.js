const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${verificationToken}&email=${email}`;
    try {
      await sendVerificationEmail(email, name, verificationUrl);
    } catch (e) {
      console.error('[Auth] Email send failed:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Account created! Please verify your email.',
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, isEmailVerified: user.isEmailVerified },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        partnerId: user.partnerId,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { idToken, name, email, profileImage } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        provider: 'google',
        profileImage,
        isEmailVerified: true,
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        partnerId: user.partnerId,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/verify-email
const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;
    const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user || user.emailVerificationToken !== token) {
      return res.status(400).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f0a1e;color:#f1f5f9;">
          <h1 style="color:#ef4444;">❌ Invalid Link</h1>
          <p style="color:#94a3b8;">This verification link is invalid or has already been used.</p>
        </body></html>`);
    }

    if (user.emailVerificationExpires < Date.now()) {
      return res.status(400).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f0a1e;color:#f1f5f9;">
          <h1 style="color:#f59e0b;">⏰ Link Expired</h1>
          <p style="color:#94a3b8;">This verification link has expired. Please register again.</p>
        </body></html>`);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f0a1e;color:#f1f5f9;">
        <div style="max-width:400px;margin:0 auto;background:#1a1330;border-radius:20px;padding:40px;border:1px solid #2d2050;">
          <div style="font-size:56px;margin-bottom:20px;">✅</div>
          <h1 style="color:#10b981;margin:0 0 12px;">Email Verified!</h1>
          <p style="color:#94a3b8;margin:0 0 8px;">Hi <strong style="color:#f1f5f9;">${user.name}</strong>!</p>
          <p style="color:#94a3b8;">Your Spenda account is now verified. You can log in to the app.</p>
          <div style="margin-top:24px;font-size:24px;">💰 Spenda</div>
        </div>
      </body></html>`);
  } catch (error) {
    res.status(500).send(`<html><body style="text-align:center;padding:60px;">
      <h1>Server Error</h1><p>${error.message}</p></body></html>`);
  }
};


// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'No account found with that email' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `spenda://reset-password?token=${resetToken}&email=${email}`;
    await sendPasswordResetEmail(email, user.name, resetUrl);

    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');

    if (!user || user.passwordResetToken !== token)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });

    if (user.passwordResetExpires < Date.now())
      return res.status(400).json({ success: false, message: 'Reset link has expired' });

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('partnerId', 'name email profileImage');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/update-fcm-token
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, googleAuth, verifyEmail, forgotPassword, resetPassword, getMe, updateFcmToken };
