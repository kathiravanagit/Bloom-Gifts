const express = require('express');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

    const user = await AdminUser.findOne({ username: username.trim() });
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.adminId = user._id.toString();
    req.session.adminUsername = user.username;
    res.json({ username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/admin/session -> check if logged in (for dashboard guard)
router.get('/session', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({ loggedIn: true, username: req.session.adminUsername });
  }
  res.json({ loggedIn: false });
});

// GET /api/admin/orders -> list all orders (newest first)
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ _id: -1 }).lean();
    res.json(orders.map(o => ({ ...o, id: o._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/orders/:id -> full order detail
router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.id = order._id.toString();
    if (order.items) {
      order.items = order.items.map(i => ({
        ...i,
        id: i._id.toString(),
        customizations: i.customizations || {}
      }));
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/orders/:id/status -> update order status
router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ['Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status value.' });

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ ok: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats -> quick dashboard numbers
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;
    
    const pending = await Order.countDocuments({ status: 'Pending' });
    
    const categoryAgg = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.product_id': { $ne: null } } },
      { $lookup: {
          from: 'products',
          localField: 'items.product_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $group: { _id: '$product.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    
    const topCategory = categoryAgg.length > 0 ? categoryAgg[0]._id : 'n/a';

    res.json({
      totalOrders,
      totalRevenue,
      pending,
      topCategory,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
