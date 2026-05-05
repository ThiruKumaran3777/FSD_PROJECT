const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/User');

const TOKEN_COOKIE_NAME = 'token';
const TOKEN_EXPIRES_IN_DAYS = 7;

const createToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'default_secret_change_in_production';
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET not set, using default. Set JWT_SECRET in .env for production!');
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn: `${TOKEN_EXPIRES_IN_DAYS}d`,
  });
};

const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  });
};

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    console.log('Signup request received:', { body: { ...req.body, password: '***' } });
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      console.log('Signup validation failed: missing fields');
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'Student',
    });

    const token = createToken(user._id);
    setTokenCookie(res, token);

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log('Signup successful:', { userId: user._id, email: user.email, role: user.role });
    return res.status(201).json({ user: safeUser, token });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('Login validation failed: missing fields');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: user not found', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log('Login failed: password mismatch', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user._id);
    setTokenCookie(res, token);

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log('Login successful:', { userId: user._id, email: user.email, role: user.role });
    return res.json({ user: safeUser, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie(TOKEN_COOKIE_NAME);
  return res.json({ message: 'Logged out' });
};

// DELETE /api/auth/me
// Delete the current user's account and related data
const deleteMe = async (req, res) => {
  try {
    const userId = req.user._id;

    // For now, just delete the user; course and feedback cleanup
    // is handled separately via admin tools or can be extended here.
    await User.findByIdAndDelete(userId);

    res.clearCookie(TOKEN_COOKIE_NAME);
    return res.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('deleteMe error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/auth/me
const updateMe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, bio } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('updateMe error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  logout,
  deleteMe,
  updateMe,
};

