const mongoose = require('mongoose');

const hamperComponentSchema = new mongoose.Schema({
  category: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  sort_order: { type: Number, default: 0 }
});

module.exports = mongoose.model('HamperComponent', hamperComponentSchema);
