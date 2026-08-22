const express = require('express');
const HamperComponent = require('../models/HamperComponent');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(requireAdmin);

// GET /api/admin/hamper-components - list all components
router.get('/', async (req, res) => {
  try {
    const comps = await HamperComponent.find().sort({ sort_order: 1 }).lean();
    res.json(comps.map(c => ({ ...c, id: c._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/hamper-components - create new component
router.post('/', async (req, res) => {
  const { category, name, price, description, sort_order } = req.body || {};
  if (!category || !name || price == null) {
    return res.status(400).json({ error: 'category, name, and price are required.' });
  }
  try {
    const comp = await HamperComponent.create({
      category,
      name,
      price,
      description: description || '',
      sort_order: sort_order || 0
    });
    res.status(201).json({ ...comp.toObject(), id: comp._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/hamper-components/:id - update component
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { category, name, price, description, sort_order } = req.body || {};
  try {
    const updated = await HamperComponent.findByIdAndUpdate(
      id,
      { category, name, price, description, sort_order },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Component not found' });
    res.json({ ...updated, id: updated._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/hamper-components/:id - delete component
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const del = await HamperComponent.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ error: 'Component not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
