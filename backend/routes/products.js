const express = require('express');
const Product = require('../models/Product');
const HamperComponent = require('../models/HamperComponent');

const router = express.Router();

// GET /api/products?category=bouquets  -> list products (optionally filtered)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let products;
    if (category && category !== 'all') {
      products = await Product.find({ category }).sort({ _id: 1 }).lean();
    } else {
      products = await Product.find().sort({ _id: 1 }).lean();
    }
    products = products.map(p => {
      p.id = p._id.toString();
      return p;
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/meta/hamper-components -> grouped list for the Build Your Own Hamper page
// NOTE: This must be defined before /:slug so "meta" isn't treated as a slug.
router.get('/meta/hamper-components', async (req, res) => {
  try {
    const rows = await HamperComponent.find().sort({ category: 1, sort_order: 1 }).lean();
    const groups = new Map();
    rows.forEach((row) => {
      if (!groups.has(row.category)) groups.set(row.category, []);
      groups.get(row.category).push({
        id: row._id.toString(),
        name: row.name,
        price: row.price,
        description: row.description,
      });
    });
    res.json(Object.fromEntries(groups));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:slug -> single product + its options
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.id = product._id.toString();

    const groups = new Map();
    if (product.options) {
      product.options.forEach((row) => {
        if (!groups.has(row.group_name)) {
          groups.set(row.group_name, { name: row.group_name, type: row.group_type, options: [] });
        }
        groups.get(row.group_name).options.push({
          id: row._id ? row._id.toString() : row.id,
          name: row.option_name,
          extra_price: row.extra_price,
          is_default: !!row.is_default,
        });
      });
    }

    res.json({ ...product, option_groups: Array.from(groups.values()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
