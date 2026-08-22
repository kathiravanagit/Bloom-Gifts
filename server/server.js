const path = require('path');
const express = require('express');
const session = require('express-session');

require('./db/database'); // ensures schema exists on boot

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
  secret: 'bloom-gifts-final-project-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 }, // 4 hours
}));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Bloom & Gifts server running at http://localhost:${PORT}`);
});
