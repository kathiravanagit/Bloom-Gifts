# Bloom & Gifts — Bouquet & Gift Hamper Store

A final-year capstone e-commerce prototype: bouquets, gift hampers, chocolate hampers, albums and greeting
cards, with a live product customizer, guest checkout, cash-on-delivery, and an admin dashboard —
built with **HTML, CSS, vanilla JavaScript, Node.js/Express, and SQLite3**.

## 1. Requirements

- **Node.js 22.5.0 or newer** (needed for Node's built-in `node:sqlite` module — check with `node -v`;
  if you're on an older version, install the latest from https://nodejs.org)
- A modern browser

This project deliberately uses Node's **built-in** SQLite support instead of a native npm package like
`better-sqlite3`. Native SQLite packages need to compile a C++ binary on install, which commonly fails
on locked-down school computers or Windows machines without build tools. The built-in module needs no
compilation at all — `npm install` only pulls in Express and bcrypt (both pure JavaScript). You'll see a
one-line `ExperimentalWarning: SQLite is an experimental feature` in the terminal — that's expected and
harmless, not an error.

## 2. Setup

```bash
# 1. Install dependencies (just Express, express-session and bcryptjs — no native builds)
npm install

# 2. Create the database and load sample products + the admin account
npm run seed

# 3. Start the server
npm start
```

Then open **http://localhost:3000** in your browser.

> Re-running `npm run seed` is safe — it skips seeding if products already exist.
> To start completely fresh, delete `server/db/bloomgifts.sqlite*` and run `npm run seed` again.

## 3. Demo accounts / test data

| Purpose | Value |
|---|---|
| Admin username | `admin` |
| Admin password | `admin123` |
| Payment method | Cash on Delivery (only option, by design) |
| Checkout | Guest only — no account required |

## 4. Project structure

```
bloom-gifts/
├─ server/
│  ├─ server.js              # Express entry point
│  ├─ db/
│  │  ├─ database.js         # SQLite connection + schema (CREATE TABLE ...)
│  │  └─ seed.js             # Sample products, options, admin user
│  ├─ routes/
│  │  ├─ products.js         # GET /api/products, /api/products/:slug
│  │  ├─ orders.js           # POST /api/orders, GET /api/orders/:orderNumber
│  │  └─ admin.js            # login/logout/session, orders, stats
│  └─ middleware/auth.js      # requireAdmin session guard
├─ public/                   # Everything served to the browser
│  ├─ index.html / products.html / product-detail.html
│  ├─ cart.html / checkout.html / confirmation.html
│  ├─ about.html / contact.html
│  ├─ admin-login.html / admin-dashboard.html
│  ├─ css/style.css          # Lavender design system
│  └─ js/                    # One script per page + shared.js (header/footer/cart helpers)
└─ package.json
```

## 5. Database schema

- **products** — category, name, slug, tagline, description, base_price, image, badge
- **product_options** — grouped, per-product customization choices (size, add-ons, ribbon color, etc.),
  each with its own `extra_price` and whether it's a single-select or multi-select group
- **orders** — guest contact + delivery info, payment method, status, total
- **order_items** — line items per order, including the exact customizations chosen, stored as JSON
- **admin_users** — one seeded admin account, password stored as a bcrypt hash

## 6. Key features and where to find them

| Feature | Where |
|---|---|
| Hero image slideshow + embedded video | `index.html` / `js/main.js` |
| Category browsing + filtering | `products.html` / `js/products.js` |
| Live hamper/bouquet customizer (options → price updates instantly) | `product-detail.html` / `js/customizer.js` |
| **Build Your Own Hamper** (combine a base + flowers + sweets + drinks + extras + a card into one custom hamper) | `custom-hamper.html` / `js/custom-hamper.js` / `hamper_components` table |
| Cart (add, edit quantity, remove) stored per browser session | `cart.html` / `js/cart.js` |
| Guest checkout with client + server-side validation | `checkout.html` / `js/checkout.js` + `server/routes/orders.js` |
| Cash on Delivery only | `checkout.html` (payment method is fixed) |
| Order confirmation rendered from the API response via JS | `confirmation.html` / `js/confirmation.js` |
| Admin login (bcrypt + session) | `admin-login.html` / `server/routes/admin.js` |
| Admin dashboard: stats, order list, order detail, status updates | `admin-dashboard.html` / `js/admin-dashboard.js` |

**Catalog:** 20 products across the 5 categories (4–5 per category), each customizable with its own option groups (size, ribbon, assortment, add-ons, etc.), plus 16 standalone components (3 base containers, 3 flower add-ins, 3 sweets, 3 drinks, 3 extras, 1 personalized card) for the hamper builder.

## 7. Design notes (for your project write-up)

- **Palette:** lavender primary `#B497D6`, deep plum `#6B4E8E`, pale lavender background `#F5F0FB`,
  blush pink `#F6D6E0`, soft gold accent `#C9A227` — chosen to match the brief's lavender theme while
  keeping enough contrast for accessibility.
- **Typography:** Fraunces (display/headings) paired with Manrope (body/UI) — a warmer, more
  characterful pairing than the default serif+sans combo, fitting a boutique gifting brand.
- **Signature motif:** a recurring "gift tag" detail (a small hanging hole-and-string) marks every
  product card, and the customizer's price panel is framed as a "gift tag tray" that fills with tag
  chips as you add options — tying the shop's visual identity to the act of gift-giving itself.
- **Images/video:** all sourced from Pexels (free to use, no attribution required).

## 8. Known simplifications (intentional scope choices for a class project)

- Payment is Cash on Delivery only — no real payment gateway integration.
- The contact form shows a confirmation toast but doesn't persist messages (no requirement to store them).
- Admin session uses an in-memory Express session (fine for a single-instance demo; a production app
  would use a persistent session store).
