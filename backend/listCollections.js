const mongoose = require('mongoose');
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Blooms-Gift';
(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    // Show sample docs from products and orders
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const prodCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    console.log('Product count:', prodCount);
    console.log('Order count:', orderCount);
    const sampleProduct = await Product.findOne();
    console.log('Sample product:', sampleProduct);
  } catch (e) { console.error('Error:', e); }
  finally { mongoose.disconnect(); }
})();
