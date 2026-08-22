require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const mongoose = require('mongoose');

require('./db/database'); // connect to MongoDB

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const adminProductsRouter = require('./routes/adminProducts');
const hamperComponentsRouter = require('./routes/hamperComponents');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Allow both local dev and the deployed Vercel frontend
const allowedOrigins = [
  'http://localhost:3001',
  'https://bloomgifts.vercel.app',
  process.env.FRONTEND_URL, // e.g. https://bloom-gifts.vercel.app
].filter(Boolean);

app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'bloom-gifts-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 4, // 4 hours
    secure: true,
    sameSite: 'none',
  },
}));

// Health Check & Root Route for Render / Uptime Monitoring
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Bloom & Gifts API', timestamp: new Date() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/hamper-components', hamperComponentsRouter);

app.listen(PORT, () => {
  console.log(`Bloom & Gifts server running at http://localhost:${PORT}`);
});
