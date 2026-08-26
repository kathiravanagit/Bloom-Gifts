const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9+\-\s]{7,15}$/;

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

// POST /api/orders -> create a guest order
router.post('/', async (req, res) => {
  try {
    const {
      guest_name, email, mobile,
      gift_note, payment_method, items,
    } = req.body || {};

    if (!guest_name || !guest_name.trim()) return badRequest(res, 'Full name is required.');
    if (!email || !EMAIL_RE.test(email)) return badRequest(res, 'A valid email address is required.');
    if (!mobile || !MOBILE_RE.test(mobile)) return badRequest(res, 'A valid mobile number is required.');
    if (!Array.isArray(items) || items.length === 0) return badRequest(res, 'Your cart is empty.');

    for (const item of items) {
      if (!item.product_name || !item.quantity || !item.unit_price) {
        return badRequest(res, 'One of the items in your cart is invalid.');
      }
    }

    // Generate a unique, collision-free order number (safe even after deletions)
    let savedOrder = null;
    for (let attempt = 0; attempt < 5 && !savedOrder; attempt++) {
      const lastOrder = await Order.findOne().sort({ order_number: -1 }).lean();
      let nextNum = 1001;
      if (lastOrder && lastOrder.order_number) {
        const m = parseInt(String(lastOrder.order_number).replace(/\D/g, ''), 10);
        if (!isNaN(m)) nextNum = m + 1;
      }
      const orderNumber = `BG${nextNum}`;

      const newOrder = new Order({
        order_number: orderNumber,
        guest_name: guest_name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        gift_note: (gift_note || '').trim(),
        payment_method: payment_method || 'Cash on Delivery',
        total_amount: 0,
        items: items.map(item => ({
          product_id: item.product_id || null,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          customizations: item.customizations || {},
          subtotal: item.subtotal
        }))
      });

      try {
        await newOrder.save();
        savedOrder = newOrder;
      } catch (saveErr) {
        if (saveErr.code !== 11000) throw saveErr; // duplicate order_number -> retry with next number
      }
    }
    if (!savedOrder) return res.status(500).json({ error: 'Could not generate a unique order number. Please try again.' });

    const orderObj = savedOrder.toObject();
    orderObj.id = orderObj._id.toString();
    if (orderObj.items) {
      orderObj.items = orderObj.items.map(i => {
        i.id = i._id.toString();
        return i;
      });
    }

    res.status(201).json(orderObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:orderNumber -> guest confirmation lookup
router.get('/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ order_number: req.params.orderNumber }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    order.id = order._id.toString();
    if (order.items) {
      order.items = order.items.map(i => {
        i.id = i._id.toString();
        return i;
      });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
