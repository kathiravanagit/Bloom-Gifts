const express = require('express');
const db = require('../db/database');

const router = express.Router();

// GET /api/products?category=bouquets  -> list products (optionally filtered)
router.get('/', (req, res) => {
  const { category } = req.query;
  let rows;
  if (category && category !== 'all') {
    rows = db.prepare('SELECT * FROM products WHERE category = ? ORDER BY id').all(category);
  } else {
    rows = db.prepare('SELECT * FROM products ORDER BY id').all();
  }
  res.json(rows);
});

// GET /api/products/:slug -> single product + its options
router.get('/:slug', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const optionRows = db.prepare(
    'SELECT * FROM product_options WHERE product_id = ? ORDER BY id ASC'
  ).all(product.id);

  const groups = new Map();
  optionRows.forEach((row) => {
    if (!groups.has(row.group_name)) {
      groups.set(row.group_name, { name: row.group_name, type: row.group_type, options: [] });
    }
    groups.get(row.group_name).options.push({
      id: row.id,
      name: row.option_name,
      extra_price: row.extra_price,
      is_default: !!row.is_default,
    });
  });

  res.json({ ...product, option_groups: Array.from(groups.values()) });
});

// GET /api/products/meta/hamper-components -> grouped list for the Build Your Own Hamper page
router.get('/meta/hamper-components', (req, res) => {
  const rows = db.prepare('SELECT * FROM hamper_components ORDER BY category, sort_order').all();
  const groups = new Map();
  rows.forEach((row) => {
    if (!groups.has(row.category)) groups.set(row.category, []);
    groups.get(row.category).push({
      id: row.id,
      name: row.name,
      price: row.price,
      description: row.description,
    });
  });
  res.json(Object.fromEntries(groups));
});

module.exports = router;
