const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloomgifts';

mongoose.connect(MONGODB_URI)
  .then(() => console.log(`[Bloom & Gifts] Connected to MongoDB at ${MONGODB_URI}`))
  .catch(err => {
    console.error('\n[Bloom & Gifts] Failed to connect to MongoDB');
    console.error(err);
    process.exit(1);
  });

module.exports = mongoose;
