const express = require('express');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

// POST /api/contact -> store a client message in MongoDB
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }
    const doc = await ContactMessage.create({ name, email, message });
    res.json({ ok: true, id: doc._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
