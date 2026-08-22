const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Product = require('../models/Product');
const HamperComponent = require('../models/HamperComponent');
const AdminUser = require('../models/AdminUser');
const Order = require('../models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloomgifts';

const img = (id, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const products = [
  // ---- Customized Bouquets ----
  {
    category: 'bouquets', name: 'Rose Romance Bouquet', slug: 'rose-romance-bouquet',
    tagline: 'Hand-tied garden roses for the ones you love',
    description: 'A lush, hand-tied bouquet of premium garden roses, finished with eucalyptus and a satin ribbon. Every stem is picked the morning of delivery.',
    base_price: 39.90, image: img(5894075), badge: 'Bestseller',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small (9 stems)', 0, 1], ['Medium (15 stems)', 8, 0], ['Large (24 stems)', 18, 0]] },
      { group_name: 'Ribbon Color', group_type: 'single', items: [['Classic Red', 0, 1], ['Blush Pink', 0, 0], ['Lavender', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Box of Chocolates', 12, 0], ['Add a Vase', 10, 0]] },
    ],
  },
  {
    category: 'bouquets', name: 'Sunshine Tulip Bouquet', slug: 'sunshine-tulip-bouquet',
    tagline: 'Bright tulips to say good morning',
    description: 'A cheerful mix of seasonal tulips in sunny tones, wrapped in recycled kraft paper. A little sunshine that arrives at the door.',
    base_price: 34.90, image: img(5894100), badge: null,
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small (10 stems)', 0, 1], ['Medium (18 stems)', 7, 0], ['Large (28 stems)', 15, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Vase', 10, 0], ['Add a Personalized Card', 3, 0]] },
    ],
  },
  {
    category: 'bouquets', name: 'Lavender Dream Bouquet', slug: 'lavender-dream-bouquet',
    tagline: 'Our signature, in the shop\u2019s own colour',
    description: 'The bouquet that started it all: fresh lavender stems layered with white lisianthus and silver foliage. Calming, elegant, unmistakably ours.',
    base_price: 42.90, image: img(2746155), badge: 'Signature',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 9, 0], ['Large', 20, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0], ['Add a Vase', 10, 0]] },
    ],
  },

  // ---- Gift Hampers ----
  {
    category: 'hampers', name: 'Deluxe Gift Hamper', slug: 'deluxe-gift-hamper',
    tagline: 'Our most-loved hamper, built your way',
    description: 'A generous woven hamper of gourmet snacks, candles and treats. Start with the base and build it out with the add-ons below.',
    base_price: 69.90, image: img(1666069), badge: 'Popular',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 15, 0], ['Large', 30, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Wine Bottle', 18, 0], ['Teddy Bear', 15, 0], ['Extra Chocolates', 10, 0], ['Scented Candle', 8, 0]] },
    ],
  },
  {
    category: 'hampers', name: 'Cozy Comfort Hamper', slug: 'cozy-comfort-hamper',
    tagline: 'A warm hug, boxed up',
    description: 'Tea, cookies and softness for someone who needs a slow afternoon. A thoughtful pick for get-well and thinking-of-you gifts.',
    base_price: 54.90, image: img(1303085), badge: null,
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 12, 0], ['Large', 25, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Tea Selection', 9, 0], ['Cookies', 7, 0], ['Soft Throw Blanket', 20, 0]] },
    ],
  },
  {
    category: 'hampers', name: 'New Baby Hamper', slug: 'new-baby-hamper',
    tagline: 'For the newest arrival',
    description: 'Soft essentials and sweet keepsakes for a new little one, wrapped and ready to welcome baby home.',
    base_price: 59.90, image: img(190930), badge: 'New',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 12, 0], ['Large', 24, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Baby Blanket', 15, 0], ['Plush Toy', 12, 0], ['Baby Milestone Book', 10, 0]] },
    ],
  },

  // ---- Chocolate Hampers ----
  {
    category: 'chocolate', name: 'Belgian Chocolate Box', slug: 'belgian-chocolate-box',
    tagline: 'Classic pralines, always a yes',
    description: 'A curated box of Belgian-style pralines and truffles, packed by hand in a satin-lined box.',
    base_price: 32.90, image: img(6716591), badge: 'Bestseller',
    options: [
      { group_name: 'Box Size', group_type: 'single', items: [['12 pieces', 0, 1], ['24 pieces', 14, 0], ['36 pieces', 26, 0]] },
      { group_name: 'Assortment', group_type: 'single', items: [['Dark Chocolate', 0, 1], ['Milk Chocolate', 0, 0], ['Mixed Selection', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0]] },
    ],
  },
  {
    category: 'chocolate', name: 'Truffle Delight Hamper', slug: 'truffle-delight-hamper',
    tagline: 'Truffles, wrapped up with a little sparkle',
    description: 'Rich hand-rolled truffles paired with a bottle of sparkling juice, arranged in a keepsake gift box.',
    base_price: 45.90, image: img(13831901), badge: null,
    options: [
      { group_name: 'Box Size', group_type: 'single', items: [['16 pieces', 0, 1], ['28 pieces', 16, 0]] },
      { group_name: 'Assortment', group_type: 'single', items: [['Dark Chocolate', 0, 1], ['Mixed Selection', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Sparkling Juice', 14, 0]] },
    ],
  },

  // ---- Albums ----
  {
    category: 'albums', name: 'Memory Lane Photo Album', slug: 'memory-lane-photo-album',
    tagline: 'A place for the photos worth keeping',
    description: 'A handbound photo album with thick acid-free pages, made to hold decades of prints without fading.',
    base_price: 28.90, image: img(9504516), badge: null,
    options: [
      { group_name: 'Cover', group_type: 'single', items: [['Leather', 0, 1], ['Linen', 0, 0], ['Wood', 6, 0]] },
      { group_name: 'Page Count', group_type: 'single', items: [['20 pages', 0, 1], ['40 pages', 8, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Name Engraving', 10, 0]] },
    ],
  },
  {
    category: 'albums', name: 'Vintage Scrapbook Album', slug: 'vintage-scrapbook-album',
    tagline: 'For the memory keepers and paper crafters',
    description: 'A blank-page scrapbook with a vintage cover, ready for tickets, notes and polaroids.',
    base_price: 24.90, image: img(32805946), badge: null,
    options: [
      { group_name: 'Cover', group_type: 'single', items: [['Linen', 0, 1], ['Leather', 5, 0]] },
      { group_name: 'Page Count', group_type: 'single', items: [['30 pages', 0, 1], ['50 pages', 9, 0]] },
    ],
  },

  // ---- Greeting Cards ----
  {
    category: 'cards', name: 'Elegant Greeting Card Set', slug: 'elegant-greeting-card-set',
    tagline: 'Set of 5, for every occasion on the calendar',
    description: 'A set of five letterpress-style cards with matching envelopes, blank inside for your own words.',
    base_price: 9.90, image: img(3358727), badge: null,
    options: [
      { group_name: 'Design', group_type: 'single', items: [['Floral', 0, 1], ['Minimal', 0, 0], ['Watercolor', 0, 0]] },
    ],
  },
  {
    category: 'cards', name: 'Birthday Wishes Card', slug: 'birthday-wishes-card',
    tagline: 'One card, one happy birthday',
    description: 'A single celebratory card with a matching envelope. Add your message at checkout and we\u2019ll tuck it into your order.',
    base_price: 6.90, image: img(11503480), badge: null,
    options: [
      { group_name: 'Design', group_type: 'single', items: [['Balloons', 0, 1], ['Confetti', 0, 0], ['Classic', 0, 0]] },
    ],
  },
  {
    category: 'bouquets', name: 'Peony Blush Bouquet', slug: 'peony-blush-bouquet',
    tagline: 'Soft, full blooms in the gentlest pink',
    description: 'Full, ruffled peonies in blush and cream, wrapped in white paper for a soft, romantic finish. A favourite for anniversaries and "just because" days.',
    base_price: 44.90, image: img(3392982), badge: 'New',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small (7 stems)', 0, 1], ['Medium (12 stems)', 10, 0], ['Large (20 stems)', 22, 0]] },
      { group_name: 'Ribbon Color', group_type: 'single', items: [['Blush Pink', 0, 1], ['Ivory', 0, 0], ['Lavender', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0], ['Add a Vase', 10, 0]] },
    ],
  },
  {
    category: 'bouquets', name: 'Wildflower Meadow Bouquet', slug: 'wildflower-meadow-bouquet',
    tagline: 'Loose, garden-picked, a little bit wild',
    description: 'An undone, meadow-style mix of seasonal wildflowers and grasses, tied loosely for a relaxed, just-picked look.',
    base_price: 31.90, image: img(17903880), badge: null,
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 8, 0], ['Large', 17, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0], ['Add a Vase', 10, 0]] },
    ],
  },

  {
    category: 'hampers', name: 'Anniversary Celebration Hamper', slug: 'anniversary-celebration-hamper',
    tagline: 'For milestones worth toasting',
    description: 'An elegant hamper built around a bottle and a box of chocolates, finished with gold ribbon detailing for anniversaries and celebrations.',
    base_price: 74.90, image: img(31496295), badge: 'Popular',
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 16, 0], ['Large', 32, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Wine Bottle', 18, 0], ['Chocolate Box', 14, 0], ['Personalized Card', 3, 0], ['Scented Candle', 8, 0]] },
    ],
  },
  {
    category: 'hampers', name: 'Thank You Hamper', slug: 'thank-you-hamper',
    tagline: 'A simple, generous way to say thanks',
    description: 'A tidy hamper of snacks and small treats, sized to say "thank you" without over-the-top formality.',
    base_price: 44.90, image: img(1718168), badge: null,
    options: [
      { group_name: 'Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 10, 0], ['Large', 20, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Cookies', 7, 0], ['Personalized Card', 3, 0], ['Tea Selection', 9, 0]] },
    ],
  },

  {
    category: 'chocolate', name: 'Cocoa Lovers Hamper', slug: 'cocoa-lovers-hamper',
    tagline: 'For the person who never says no to chocolate',
    description: 'A heart-shaped box of foil-wrapped chocolates paired with cocoa treats and a ribbon finish, built for the true chocolate lover.',
    base_price: 52.90, image: img(11716935), badge: null,
    options: [
      { group_name: 'Box Size', group_type: 'single', items: [['Small', 0, 1], ['Medium', 14, 0], ['Large', 28, 0]] },
      { group_name: 'Assortment', group_type: 'single', items: [['Dark Chocolate', 0, 1], ['Milk Chocolate', 0, 0], ['Mixed Selection', 0, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Add a Personalized Card', 3, 0], ['Sparkling Juice', 14, 0]] },
    ],
  },

  {
    category: 'albums', name: 'Newlywed Memory Album', slug: 'newlywed-memory-album',
    tagline: 'The first chapter, printed and bound',
    description: 'A keepsake album sized for wedding and engagement prints, with a ribbon tie and space for a handwritten dedication page.',
    base_price: 34.90, image: img(19679440), badge: 'New',
    options: [
      { group_name: 'Cover', group_type: 'single', items: [['Leather', 0, 1], ['Linen', 0, 0], ['Wood', 6, 0]] },
      { group_name: 'Page Count', group_type: 'single', items: [['30 pages', 0, 1], ['50 pages', 9, 0]] },
      { group_name: 'Add-ons', group_type: 'multi', items: [['Name Engraving', 10, 0]] },
    ],
  },

  {
    category: 'cards', name: 'Thank You Card', slug: 'thank-you-card',
    tagline: 'A single card that says it properly',
    description: 'A single thank-you card with a matching envelope, paired here with a lavender motif for a soft, grateful tone.',
    base_price: 6.90, image: img(2072168), badge: null,
    options: [
      { group_name: 'Design', group_type: 'single', items: [['Lavender', 0, 1], ['Minimal', 0, 0], ['Watercolor', 0, 0]] },
    ],
  },
  {
    category: 'cards', name: 'Celebration Card', slug: 'celebration-card',
    tagline: 'For graduations, new jobs, and good news',
    description: 'A bright, versatile card for life\u2019s wins big and small, with a matching envelope and room for your own words inside.',
    base_price: 6.90, image: img(2072165), badge: null,
    options: [
      { group_name: 'Design', group_type: 'single', items: [['Floral', 0, 1], ['Confetti', 0, 0], ['Classic', 0, 0]] },
    ],
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
    console.log(`[Bloom & Gifts] Connected to MongoDB at ${MONGODB_URI}`);

    // Seed Products
    const countRow = await Product.countDocuments();
    if (countRow > 0) {
      console.log('Products already seeded, skipping.');
    } else {
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
        return {
          ...p,
          options
        };
      });
      await Product.insertMany(productDocs);
      console.log(`Seeded ${products.length} products.`);
    }

    // Seed Hamper Components
    const componentRow = await HamperComponent.countDocuments();
    if (componentRow > 0) {
      console.log('Hamper components already seeded, skipping.');
    } else {
      const componentDocs = hamperComponents.map((c, idx) => ({ ...c, sort_order: idx }));
      await HamperComponent.insertMany(componentDocs);
      console.log(`Seeded ${hamperComponents.length} hamper components.`);
    }

    // Seed Admin User
    const adminRow = await AdminUser.countDocuments();
    if (adminRow === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await AdminUser.create({ username: 'admin', password_hash: hash });
      console.log('Created default admin user -> username: admin / password: admin123');
    } else {
      console.log('Admin user already exists, skipping.');
    }

  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
