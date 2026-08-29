require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');

const mongoose = require('mongoose');

require('./db/database'); // connect to MongoDB

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const adminProductsRouter = require('./routes/adminProducts');
const hamperComponentsRouter = require('./routes/hamperComponents');
const contactRoutes = require('./routes/contact');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Allow both local dev and the deployed Vercel frontend
const allowedOrigins = [
  'http://localhost:3001',
  'https://bloomgifts.vercel.app',
  process.env.FRONTEND_URL, // e.g. https://bloom-gifts.vercel.app
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

if (!process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET is not set. Using insecure dev fallback. Set SESSION_SECRET in production.');
}
app.use(session({
  secret: process.env.SESSION_SECRET || 'bloom-gifts-dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    clientPromise: mongoose.connection.asPromise().then(conn => conn.getClient()),
    collectionName: 'sessions',
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 4, // 4 hours
    secure: true,
    sameSite: 'none',
  },
}));

// Health Check & Root Route for Render / Uptime Monitoring
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'G_giftrees API', timestamp: new Date() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/hamper-components', hamperComponentsRouter);
app.use('/api/admin/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/user', userRoutes);

app.listen(PORT, () => {
  console.log(`G_giftrees server running at http://localhost:${PORT}`);
});
