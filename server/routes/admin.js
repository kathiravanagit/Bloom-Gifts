const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  req.session.adminId = user.id;
  req.session.adminUsername = user.username;
  res.json({ username: user.username });
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
router.get('/orders', requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  res.json(orders);
});

// GET /api/admin/orders/:id -> full order detail
router.get('/orders/:id', requireAdmin, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items: items.map((i) => ({ ...i, customizations: JSON.parse(i.customizations || '{}') })) });
});

// PATCH /api/admin/orders/:id/status -> update order status
router.patch('/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status value.' });

  const info = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.json({ ok: true, status });
});

// GET /api/admin/stats -> quick dashboard numbers
router.get('/stats', requireAdmin, (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount),0) AS s FROM orders').get().s;
  const pending = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'Pending'").get().c;
  const topCategory = db.prepare(`
    SELECT p.category AS category, COUNT(*) AS c
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    GROUP BY p.category
    ORDER BY c DESC
    LIMIT 1
  `).get();

  res.json({
    totalOrders,
    totalRevenue,
    pending,
    topCategory: topCategory ? topCategory.category : 'n/a',
  });
});

module.exports = router;
