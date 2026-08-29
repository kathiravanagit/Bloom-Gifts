const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');

function requireUser(req, res, next) {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  next();
}

// POST /api/user/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hash, phone });
    req.session.userId = user._id.toString();
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.userPhone = user.phone;
    res.status(201).json({ ok: true, user: { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });
    req.session.userId = user._id.toString();
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.userPhone = user.phone;
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }
    res.json({ ok: true, user: { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => { res.json({ ok: true }); });
});

// GET /api/user/session
router.get('/session', (req, res) => {
  if (!req.session || !req.session.userId) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, userId: req.session.userId, userName: req.session.userName, userEmail: req.session.userEmail || '', userPhone: req.session.userPhone || '' });
});

// GET /api/user/orders
router.get('/orders', requireUser, async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.session.userId }).sort({ created_at: -1 }).lean();
    res.json(orders.map(o => ({ ...o, id: o._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/wishlist
router.get('/wishlist', requireUser, async (req, res) => {
  try {
    const items = await Wishlist.find({ user_id: req.session.userId }).sort({ created_at: -1 }).lean();
    res.json(items.map(w => ({ ...w, id: w._id.toString(), product_id: w.product_id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/wishlist
router.post('/wishlist', requireUser, async (req, res) => {
  try {
    const { product_id, product_name, slug, image } = req.body || {};
    if (!product_id || !product_name) return res.status(400).json({ error: 'product_id and product_name are required.' });
    const existing = await Wishlist.findOne({ user_id: req.session.userId, product_id });
    if (existing) return res.status(409).json({ error: 'Already in wishlist.' });
    const item = await Wishlist.create({ user_id: req.session.userId, product_id, product_name, slug, image });
    res.status(201).json({ ok: true, id: item._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/user/wishlist/:productId
router.delete('/wishlist/:productId', requireUser, async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ user_id: req.session.userId, product_id: req.params.productId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
