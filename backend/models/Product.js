const mongoose = require('mongoose');

const productOptionSchema = new mongoose.Schema({
  group_name: { type: String, required: true },
  group_type: { type: String, required: true, enum: ['single', 'multi'] },
  option_name: { type: String, required: true },
  extra_price: { type: Number, default: 0 },
  is_default: { type: Boolean, default: false },
  sort_order: { type: Number, default: 0 }
});

const productSchema = new mongoose.Schema({
  category: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  tagline: String,
  description: String,
  base_price: { type: Number, required: true },
  image: String,
  is_customizable: { type: Boolean, default: true },
  badge: String,
  options: [productOptionSchema]
});

module.exports = mongoose.model('Product', productSchema);
