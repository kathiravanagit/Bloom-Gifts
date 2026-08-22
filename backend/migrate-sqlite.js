const sqlite = require('node:sqlite');
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');
const HamperComponent = require('./models/HamperComponent');
const AdminUser = require('./models/AdminUser');
const Order = require('./models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloomgifts';
const dbPath = './db/bloomgifts.sqlite';

async function migrate() {
  let sqliteDb;
  try {
    sqliteDb = new sqlite.DatabaseSync(dbPath);
    console.log(`Connected to SQLite at ${dbPath}`);
  } catch (err) {
    console.error('Failed to open SQLite database. Make sure the file exists and you are on Node 22.5.0+');
    console.error(err.message);
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
    
    // Migrate Admin Users
    const admins = sqliteDb.prepare('SELECT * FROM admin_users').all();
    for (const admin of admins) {
      const exists = await AdminUser.findOne({ username: admin.username });
      if (!exists) {
        await AdminUser.create({ username: admin.username, password_hash: admin.password_hash });
        console.log(`Migrated admin user: ${admin.username}`);
      } else {
        console.log(`Admin user ${admin.username} already exists, skipping.`);
      }
    }

    // Migrate Hamper Components
    const hamperComponents = sqliteDb.prepare('SELECT * FROM hamper_components').all();
    for (const hc of hamperComponents) {
      const exists = await HamperComponent.findOne({ name: hc.name });
      if (!exists) {
        await HamperComponent.create({
          category: hc.category,
          name: hc.name,
          price: hc.price,
          description: hc.description,
          sort_order: hc.sort_order
        });
        console.log(`Migrated hamper component: ${hc.name}`);
      }
    }

    // Migrate Products & Options
    const products = sqliteDb.prepare('SELECT * FROM products').all();
    const productOptions = sqliteDb.prepare('SELECT * FROM product_options').all();
    
    for (const prod of products) {
      const exists = await Product.findOne({ slug: prod.slug });
      if (!exists) {
        const options = productOptions.filter(o => o.product_id === prod.id).map(o => ({
          group_name: o.group_name,
          group_type: o.group_type,
          option_name: o.option_name,
          extra_price: o.extra_price,
          is_default: !!o.is_default,
          sort_order: o.sort_order
        }));
        
        await Product.create({
          category: prod.category,
          name: prod.name,
          slug: prod.slug,
          tagline: prod.tagline,
          description: prod.description,
          base_price: prod.base_price,
          image: prod.image,
          is_customizable: !!prod.is_customizable,
          badge: prod.badge,
          options: options
        });
        console.log(`Migrated product: ${prod.name}`);
      } else {
        console.log(`Product ${prod.slug} already exists, skipping.`);
      }
    }

    // Migrate Orders & Items
    const orders = sqliteDb.prepare('SELECT * FROM orders').all();
    const orderItems = sqliteDb.prepare('SELECT * FROM order_items').all();
    
    for (const ord of orders) {
      const exists = await Order.findOne({ order_number: ord.order_number });
      if (!exists) {
        const items = orderItems.filter(i => i.order_id === ord.id).map(i => {
          let customizations = {};
          try { customizations = JSON.parse(i.customizations); } catch(e) {}
          return {
            product_id: null,
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            customizations: customizations,
            subtotal: i.subtotal
          };
        });
        
        await Order.create({
          order_number: ord.order_number,
          guest_name: ord.guest_name,
          email: ord.email,
          mobile: ord.mobile,
          address: ord.address,
          city: ord.city,
          postal_code: ord.postal_code,
          gift_note: ord.gift_note,
          payment_method: ord.payment_method,
          status: ord.status,
          total_amount: ord.total_amount,
          created_at: new Date(ord.created_at),
          items: items
        });
        console.log(`Migrated order: ${ord.order_number}`);
      } else {
        console.log(`Order ${ord.order_number} already exists, skipping.`);
      }
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    mongoose.disconnect();
    if (sqliteDb) sqliteDb.close();
  }
}

migrate();
