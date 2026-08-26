const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Product = require('../models/Product');
const HamperComponent = require('../models/HamperComponent');
const AdminUser = require('../models/AdminUser');
const Order = require('../models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloomgifts';

const products = [
  // ---- AllCustomized Bouquets ----
  {
    category: 'bouquets', name: 'Rose Romance Bouquet', slug: 'rose-romance-bouquet',
    tagline: 'Hand-tied red roses for the ones you love',
    description: 'A romantic hand-tied bouquet of velvety red roses, finished with eucalyptus and a satin ribbon — perfect for anniversaries, proposals, and heartfelt surprises.',
    base_price: 39.90, image: 'assets/images/pr1.jpeg', badge: 'Bestseller',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small (9 stems)', 0, 1], ['Medium (15 stems)', 8, 0], ['Large (24 stems)', 18, 0]] },
      { group_name: 'Ribbon Color', group_type: 'single', items: [['Classic Red', 0, 1], ['Blush Pink', 0, 0], ['Lavender', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Box of Chocolates', 12, 0], ['Add a Vase', 10, 0]] },
    ],
  },
  {
    category: 'bouquets', name: 'Sunshine Tulip Bouquet', slug: 'sunshine-tulip-bouquet',
    tagline: 'Bright tulips to say good morning',
    description: 'Bright seasonal tulips wrapped in recycled kraft paper, bringing a cheerful burst of colour and a little sunshine to any doorstep.',
    base_price: 34.90, image: 'assets/images/pr2.jpeg', badge: null,
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small (10 stems)', 0, 1], ['Medium (18 stems)', 7, 0], ['Large (28 stems)', 15, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Vase', 10, 0], ['Add a Personalized Card', 3, 0]] },
    ],
  },
  {
    category: 'bouquets', name: 'Lavender Dream Bouquet', slug: 'lavender-dream-bouquet',
    tagline: 'Our signature, in the shop’s own colour',
    description: 'Our signature bouquet of fresh lavender layered with white lisianthus and silver foliage — calming, elegant, and unmistakably ours.',
    base_price: 42.90, image: 'assets/images/pr5.jpeg', badge: 'Signature',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 9, 0], ['Large', 20, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0], ['Add a Vase', 10, 0]] },
    ],
  },
  {
    category: 'bouquets', name: 'Peony Blush Bouquet', slug: 'peony-blush-bouquet',
    tagline: 'Soft, full blooms in the gentlest pink',
    description: 'Full, ruffled peonies in blush and cream, wrapped in white paper for a soft, romantic finish — a favourite for anniversaries and "just because" days.',
    base_price: 44.90, image: 'assets/images/pr6.jpeg', badge: 'New',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small (7 stems)', 0, 1], ['Medium (12 stems)', 10, 0], ['Large (20 stems)', 22, 0]] },
      { group_name: 'Ribbon Color', group_type: 'single', items: [['Blush Pink', 0, 1], ['Ivory', 0, 0], ['Lavender', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0], ['Add a Vase', 10, 0]] },
    ],
  },

  // ---- Gift Hampers ----
  {
    category: 'hampers', name: 'Deluxe Gift Hamper', slug: 'deluxe-gift-hamper',
    tagline: 'Our most-loved hamper, built your way',
    description: 'A generous woven hamper of gourmet snacks, candles, and treats — start with the base and build it out with the add-ons you like.',
    base_price: 69.90, image: 'assets/images/pr3.jpeg', badge: 'Popular',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 15, 0], ['Large', 30, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Wine Bottle', 18, 0], ['Teddy Bear', 15, 0], ['Extra Chocolates', 10, 0], ['Scented Candle', 8, 0]] },
    ],
  },
  {
    category: 'hampers', name: 'Cozy Comfort Hamper', slug: 'cozy-comfort-hamper',
    tagline: 'A warm hug, boxed up',
    description: 'Tea, cookies, and softness for someone who needs a slow, comforting afternoon — a thoughtful pick for get-well and thinking-of-you moments.',
    base_price: 54.90, image: 'assets/images/pr7.jpeg', badge: null,
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 12, 0], ['Large', 25, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Tea Selection', 9, 0], ['Cookies', 7, 0], ['Soft Throw Blanket', 20, 0]] },
    ],
  },
  {
    category: 'hampers', name: 'Celebration Gift Hamper', slug: 'celebration-gift-hamper',
    tagline: 'For milestones worth toasting',
    description: 'An elegant hamper built around a bottle and a box of chocolates, finished with gold ribbon detailing for milestones worth celebrating.',
    base_price: 74.90, image: 'assets/images/pr8.jpeg', badge: 'Popular',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 16, 0], ['Large', 32, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Wine Bottle', 18, 0], ['Chocolate Box', 14, 0], ['Personalized Card', 3, 0], ['Scented Candle', 8, 0]] },
    ],
  },

  // ---- Chocolate Hampers ----
  {
    category: 'chocolate', name: 'Belgian Chocolate Box', slug: 'belgian-chocolate-box',
    tagline: 'Classic pralines, always a yes',
    description: 'A curated box of Belgian-style pralines and truffles, packed by hand in a satin-lined box for a classic, always-welcome treat.',
    base_price: 32.90, image: 'assets/images/pr4.jpeg', badge: 'Bestseller',
    options: [
      { group_name: 'Box Size', group_type: 'single', items: [['12 pieces', 0, 1], ['24 pieces', 14, 0], ['36 pieces', 26, 0]] },
      { group_name: 'Assortment', group_type: 'single', items: [['Dark Chocolate', 0, 1], ['Milk Chocolate', 0, 0], ['Mixed Selection', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0]] },
    ],
  },
  {
    category: 'chocolate', name: 'Truffle Delight Hamper', slug: 'truffle-delight-hamper',
    tagline: 'Truffles, wrapped up with a little sparkle',
    description: 'Rich hand-rolled truffles paired with a bottle of sparkling juice, arranged in a keepsake gift box with a little sparkle.',
    base_price: 45.90, image: 'assets/images/pr9.jpeg', badge: null,
    options: [
      { group_name: 'Box Size', group_type: 'single', items: [['16 pieces', 0, 1], ['28 pieces', 16, 0]] },
      { group_name: 'Assortment', group_type: 'single', items: [['Dark Chocolate', 0, 1], ['Mixed Selection', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Sparkling Juice', 14, 0]] },
    ],
  },
  {
    category: 'chocolate', name: 'Cocoa Lovers Hamper', slug: 'cocoa-lovers-hamper',
    tagline: 'For the person who never says no to chocolate',
    description: 'A heart-shaped box of foil-wrapped chocolates paired with cocoa treats and a ribbon finish, built for the true chocolate lover.',
    base_price: 52.90, image: 'assets/images/pr10.jpeg', badge: null,
    options: [
      { group_name: 'Box Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 14, 0], ['Large', 28, 0]] },
      { group_name: 'Assortment', group_type: 'single', items: [['Dark Chocolate', 0, 1], ['Milk Chocolate', 0, 0], ['Mixed Selection', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0], ['Sparkling Juice', 14, 0]] },
    ],
  },

  // ---- Extra bouquets (ha1, ha2) ----
  {
    category: 'bouquets', name: 'Garden Rose Bouquet', slug: 'garden-rose-bouquet',
    tagline: 'Lush mixed roses, hand-tied',
    description: 'A lush gather of mixed roses and seasonal blooms, hand-tied and ribboned for a timeless gift.',
    base_price: 39.90, image: 'assets/images/ha1.jpeg', badge: 'New',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 8, 0], ['Large', 16, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Vase', 10, 0], ['Add a Personalized Card', 3, 0]] },
    ],
  },
  {
    category: 'bouquets', name: 'Wildflower Bouquet', slug: 'wildflower-bouquet',
    tagline: 'A loose, just-picked mix',
    description: 'A loose, just-picked mix of wildflowers in soft pastels — bright and effortless.',
    base_price: 36.90, image: 'assets/images/ha2.jpeg', badge: null,
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 7, 0], ['Large', 15, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0]] },
    ],
  },

  // ---- Extra gift hampers (ha3, ha4) ----
  {
    category: 'hampers', name: 'Sweet Treat Hamper', slug: 'sweet-treat-hamper',
    tagline: 'A basket full of goodies',
    description: 'A generous basket filled with sweet treats and goodies, ready to gift as-is or build out.',
    base_price: 64.90, image: 'assets/images/ha3.jpeg', badge: 'New',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 15, 0], ['Large', 30, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Wine Bottle', 18, 0], ['Teddy Bear', 15, 0], ['Extra Chocolates', 10, 0]] },
    ],
  },
  {
    category: 'hampers', name: 'Tea Time Hamper', slug: 'tea-time-hamper',
    tagline: 'Cosy treats for tea lovers',
    description: 'A cosy hamper of tea, cookies, and soft touches for a slow, comforting afternoon.',
    base_price: 54.90, image: 'assets/images/ha4.jpeg', badge: null,
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 12, 0], ['Large', 25, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Tea Selection', 9, 0], ['Cookies', 7, 0], ['Scented Candle', 8, 0]] },
    ],
  },

  // ---- Extra chocolate hampers (ha5, ha6) ----
  {
    category: 'chocolate', name: 'Chocolate Indulgence Box', slug: 'chocolate-indulgence-box',
    tagline: 'A rich assortment of chocolates',
    description: 'A rich assortment of fine chocolates in a satin-lined box — a classic treat.',
    base_price: 32.90, image: 'assets/images/ha5.jpeg', badge: 'Bestseller',
    options: [
      { group_name: 'Box Size', group_type: 'single', items: [['12 pieces', 0, 1], ['24 pieces', 14, 0], ['36 pieces', 26, 0]] },
      { group_name: 'Assortment', group_type: 'single', items: [['Dark Chocolate', 0, 1], ['Milk Chocolate', 0, 0], ['Mixed Selection', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0]] },
    ],
  },
  {
    category: 'chocolate', name: 'Chocolate Celebration Hamper', slug: 'chocolate-celebration-hamper',
    tagline: 'For sweet milestones',
    description: 'A celebration-worthy chocolate hamper paired with sparkling juice for sweet milestones.',
    base_price: 45.90, image: 'assets/images/ha6.jpeg', badge: null,
    options: [
      { group_name: 'Box Size', group_type: 'single', items: [['16 pieces', 0, 1], ['28 pieces', 16, 0]] },
      { group_name: 'Assortment', group_type: 'single', items: [['Dark Chocolate', 0, 1], ['Mixed Selection', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Sparkling Juice', 14, 0]] },
    ],
  },

  // ---- Albums (ha7, ha8) — TEMPORARY listings, real products coming later ----
  {
    category: 'albums', name: 'Photo Memory Album', slug: 'photo-memory-album',
    tagline: 'Temporary listing — real product coming soon.',
    description: 'Placeholder album listing. The real product will be added soon.',
    base_price: 24.90, image: 'assets/images/ha7.jpeg', badge: 'Coming Soon', options: [],
  },
  {
    category: 'albums', name: 'Keepsake Scrapbook', slug: 'keepsake-scrapbook',
    tagline: 'Temporary listing — real product coming soon.',
    description: 'Placeholder album listing. The real product will be added soon.',
    base_price: 29.90, image: 'assets/images/ha8.jpeg', badge: 'Coming Soon', options: [],
  },

  // ---- Greeting Cards (ha9, ha10) — TEMPORARY listings, real products coming later ----
  {
    category: 'cards', name: 'Floral Greeting Card', slug: 'floral-greeting-card',
    tagline: 'Temporary listing — real product coming soon.',
    description: 'Placeholder greeting card listing. The real product will be added soon.',
    base_price: 5.90, image: 'assets/images/ha9.jpeg', badge: 'Coming Soon', options: [],
  },
  {
    category: 'cards', name: 'Script Greeting Card', slug: 'script-greeting-card',
    tagline: 'Temporary listing — real product coming soon.',
    description: 'Placeholder greeting card listing. The real product will be added soon.',
    base_price: 5.90, image: 'assets/images/ha10.jpeg', badge: 'Coming Soon', options: [],
  },
];

const hamperComponents = [
  // Base containers (choose one)
  { category: 'base', name: 'Woven Wicker Basket', price: 24.90, description: 'Classic handwoven basket, holds a generous mix of items.' },
  { category: 'base', name: 'Kraft Gift Box', price: 16.90, description: 'Clean, modern box lined with tissue paper.' },
  { category: 'base', name: 'Rustic Wooden Crate', price: 32.90, description: 'A sturdy little crate that doubles as a keepsake.' },

  // Flowers
  { category: 'flowers', name: 'Mini Rose Posy', price: 14.90, description: 'A small hand-tied bunch of roses tucked into the hamper.' },
  { category: 'flowers', name: 'Lavender Sprig Bundle', price: 9.90, description: 'Fragrant dried lavender sprigs, tied with twine.' },
  { category: 'flowers', name: 'Single Stem Sunflower', price: 6.90, description: 'One bright sunflower for a pop of colour.' },

  // Sweets
  { category: 'sweets', name: 'Assorted Truffles Pouch', price: 12.90, description: 'A small drawstring pouch of hand-rolled truffles.' },
  { category: 'sweets', name: 'Belgian Chocolate Bar Trio', price: 10.90, description: 'Three Belgian-style bars: dark, milk, and hazelnut.' },
  { category: 'sweets', name: 'Shortbread Cookie Tin', price: 8.90, description: 'Buttery shortbread in a reusable tin.' },

  // Drinks
  { category: 'drinks', name: 'Sparkling Grape Juice', price: 13.90, description: 'A celebratory non-alcoholic sparkling juice, 750ml.' },
  { category: 'drinks', name: 'Herbal Tea Tin', price: 9.90, description: 'A tin of loose-leaf herbal tea blends.' },
  { category: 'drinks', name: 'Rose Wine Bottle', price: 22.90, description: 'A light, fruity rosé, 750ml.' },

  // Extras
  { category: 'extras', name: 'Scented Soy Candle', price: 11.90, description: 'A small-batch soy candle in a calming scent.' },
  { category: 'extras', name: 'Teddy Bear', price: 15.90, description: 'A soft plush bear, a nice touch for any occasion.' },
  { category: 'extras', name: 'Soft Plush Blanket', price: 19.90, description: 'A cozy throw blanket, folded neatly into the hamper.' },

  // Cards
  { category: 'cards', name: 'Personalized Message Card', price: 3.90, description: 'A handwritten note in your own words, tucked inside.' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[G_giftrees] Connected to MongoDB at ${MONGODB_URI}`);

    // Seed Products (refresh: clear then insert so duplicates/edits are replaced)
    await Product.deleteMany({});
    console.log('Cleared existing products.');
    const productDocs = products.map(p => {
      const options = [];
      p.options.forEach(group => {
        group.items.forEach((item, idx) => {
          options.push({
            group_name: group.group_name,
            group_type: group.group_type,
            option_name: item[0],
            extra_price: item[1],
            is_default: !!item[2],
            sort_order: idx
          });
        });
      });
      return { ...p, options };
    });
    await Product.insertMany(productDocs);
    console.log(`Seeded ${products.length} products.`);

    // Seed Hamper Components (only if empty)
    const componentRow = await HamperComponent.countDocuments();
    if (componentRow > 0) {
      console.log('Hamper components already seeded, skipping.');
    } else {
      const componentDocs = hamperComponents.map((c, idx) => ({ ...c, sort_order: idx }));
      await HamperComponent.insertMany(componentDocs);
      console.log(`Seeded ${hamperComponents.length} hamper components.`);
    }

    // Ensure the credentials shown on the login page are usable.
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';
    const hash = bcrypt.hashSync(adminPassword, 10);
    const admin = await AdminUser.findOneAndUpdate(
      { username: adminUsername },
      { username: adminUsername, password_hash: hash },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Ensured admin user -> username: ${admin.username}`);

  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
