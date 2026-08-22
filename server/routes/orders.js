const express = require('express');
const db = require('../db/database');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9+\-\s]{7,15}$/;

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

// POST /api/orders -> create a guest order
router.post('/', (req, res) => {
  const {
    guest_name, email, mobile, address, city, postal_code,
    gift_note, payment_method, items,
  } = req.body || {};

  if (!guest_name || !guest_name.trim()) return badRequest(res, 'Full name is required.');
  if (!email || !EMAIL_RE.test(email)) return badRequest(res, 'A valid email address is required.');
  if (!mobile || !MOBILE_RE.test(mobile)) return badRequest(res, 'A valid mobile number is required.');
  if (!address || !address.trim()) return badRequest(res, 'Delivery address is required.');
  if (!city || !city.trim()) return badRequest(res, 'City is required.');
  if (!postal_code || !postal_code.trim()) return badRequest(res, 'Postal code is required.');
  if (!Array.isArray(items) || items.length === 0) return badRequest(res, 'Your cart is empty.');

  for (const item of items) {
    if (!item.product_name || !item.quantity || !item.unit_price) {
      return badRequest(res, 'One of the items in your cart is invalid.');
    }
  }

  // Recompute the total server-side so a tampered client total can't be trusted.
  const rawTotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const computedTotal = Math.round(rawTotal * 100) / 100;

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, guest_name, email, mobile, address, city, postal_code, gift_note, payment_method, total_amount)
    VALUES ('TEMP', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const finalizeOrderNumber = db.prepare('UPDATE orders SET order_number = ? WHERE id = ?');
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, customizations, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const createOrder = db.transaction(() => {
    const info = insertOrder.run(
      guest_name.trim(), email.trim(), mobile.trim(), address.trim(), city.trim(),
      postal_code.trim(), (gift_note || '').trim(), payment_method || 'Cash on Delivery', computedTotal
    );
    const orderId = info.lastInsertRowid;
    const orderNumber = `BG${1000 + orderId}`;
    finalizeOrderNumber.run(orderNumber, orderId);

    items.forEach((item) => {
      insertItem.run(
        orderId,
        item.product_id || null,
        item.product_name,
        item.quantity,
        item.unit_price,
        JSON.stringify(item.customizations || {}),
        item.subtotal
      );
    });

    return { orderId, orderNumber };
  });

  const { orderId, orderNumber } = createOrder();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  res.status(201).json({
    ...order,
    order_number: orderNumber,
    items: orderItems.map((i) => ({ ...i, customizations: JSON.parse(i.customizations || '{}') })),
  });
});

// GET /api/orders/:orderNumber -> guest confirmation lookup
router.get('/:orderNumber', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items: items.map((i) => ({ ...i, customizations: JSON.parse(i.customizations || '{}') })) });
});

module.exports = router;
