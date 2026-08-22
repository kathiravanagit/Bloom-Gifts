const express = require('express');
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

// GET /api/admin/products - list all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ sort_order: 1 }).lean();
    res.json(products.map(p => ({ ...p, id: p._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/products - create new product
router.post('/', async (req, res) => {
  const { category, name, slug, tagline, description, base_price, image, badge, options } = req.body || {};
  if (!category || !name || !slug || base_price == null) {
    return res.status(400).json({ error: 'category, name, slug, and base_price are required.' });
  }
  try {
    const product = await Product.create({
      category,
      name,
      slug,
      tagline: tagline || '',
      description: description || '',
      base_price,
      image: image || '',
      badge: badge || null,
      options: options || []
    });
    res.status(201).json({ ...product.toObject(), id: product._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/products/:id - update product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { category, name, slug, tagline, description, base_price, image, badge, options } = req.body || {};
  try {
    const updated = await Product.findByIdAndUpdate(
      id,
      { category, name, slug, tagline, description, base_price, image, badge, options },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json({ ...updated, id: updated._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/products/:id - delete product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const del = await Product.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
