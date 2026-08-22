const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloomgifts';

mongoose.connect(MONGODB_URI)
  .then(() => console.log(`[Bloom & Gifts] Connected to MongoDB successfully!`))
  .catch(err => {
    console.error('[Bloom & Gifts] MongoDB connection error:', err.message);
  });

module.exports = mongoose;
