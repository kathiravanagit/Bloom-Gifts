const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.Mixed }, // ref: 'Product'
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  customizations: mongoose.Schema.Types.Mixed, // Can store JSON string or Object
  subtotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  order_number: { type: String, unique: true, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guest_name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  postal_code: { type: String },
  gift_note: String,
  payment_method: { type: String, default: 'Pay on Delivery' },
  status: { type: String, default: 'Pending' },
  total_amount: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  items: [orderItemSchema]
});

module.exports = mongoose.model('Order', orderSchema);
