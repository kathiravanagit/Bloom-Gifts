const express = require('express');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ContactMessage = require('../models/ContactMessage');
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
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Session save failed' });
      res.json({ username: user.username });
    });
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

// PATCH /api/admin/orders/:id/status -> update order status (and optional confirmed amount)
router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, amount } = req.body || {};
    const allowed = ['Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status value.' });

    const update = { status };
    if (amount !== undefined && amount !== null && amount !== '') {
      const amt = Number(amount);
      if (isNaN(amt) || amt < 0) return res.status(400).json({ error: 'Invalid amount.' });
      update.total_amount = Math.round(amt * 100) / 100;
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ ok: true, status: order.status, total_amount: order.total_amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/orders/:id -> permanently remove an order
router.delete('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/messages -> list client contact messages (newest first)
router.get('/messages', requireAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ created_at: -1 }).lean();
    res.json(messages.map(m => ({ ...m, id: m._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/messages/:id -> mark a message as read
router.patch('/messages/:id', requireAdmin, async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats -> quick dashboard numbers
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ['Confirmed', 'Out for Delivery', 'Delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;
    
    const pending = await Order.countDocuments({ status: 'Pending' });
    
    const unreadMessages = await ContactMessage.countDocuments({ read: false });
    
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
      unreadMessages,
      topCategory,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
