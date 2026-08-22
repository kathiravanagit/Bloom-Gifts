const path = require('path');

let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (err) {
  console.error('\n[Bloom & Gifts] This project uses Node\'s built-in SQLite support,');
  console.error('which requires Node.js 22.5.0 or newer. Your current version is', process.version + '.');
  console.error('Please install a newer Node.js (e.g. via https://nodejs.org or nvm) and try again.\n');
  process.exit(1);
}

const dbPath = path.join(__dirname, 'bloomgifts.sqlite');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// better-sqlite3 exposes db.transaction(fn); node:sqlite doesn't, so we provide
// the same convenience here: wrap a function so it runs inside BEGIN/COMMIT,
// rolling back automatically if it throws.
db.transaction = function transaction(fn) {
  return (...args) => {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
};

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT,
  base_price REAL NOT NULL,
  image TEXT,
  is_customizable INTEGER DEFAULT 1,
  badge TEXT
);

CREATE TABLE IF NOT EXISTS product_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  group_name TEXT NOT NULL,
  group_type TEXT NOT NULL CHECK (group_type IN ('single','multi')),
  option_name TEXT NOT NULL,
  extra_price REAL DEFAULT 0,
  is_default INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  guest_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  gift_note TEXT,
  payment_method TEXT DEFAULT 'Cash on Delivery',
  status TEXT DEFAULT 'Pending',
  total_amount REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  customizations TEXT,
  subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS hamper_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
`);

module.exports = db;
