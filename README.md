# G_giftrees

G_giftrees is a full-stack gift shop website for bouquets, gift hampers, chocolate hampers, photo albums, and greeting cards. Customers can browse products, customize selected items, build a hamper, manage a browser-based cart, and place a guest order with Cash on Delivery.

The project uses a static HTML/CSS/JavaScript frontend and an Express/MongoDB backend. The frontend is deployed on Vercel and the API is deployed separately on Render.

## Features

- Responsive storefront with home, product listing, product detail, about, and contact pages
- Product browsing by category with product data loaded from the API
- Product customization for sizes, ribbon colors, add-ons, and other options
- Build Your Own Hamper workflow with selectable hamper components
- Cart persistence in browser storage with quantity and item editing
- Guest checkout with delivery details and Cash on Delivery
- Order confirmation and order lookup by order number
- Admin login with session-based authentication
- Admin dashboard for statistics, orders, products, and hamper components
- Product and hamper component create, edit, and delete operations

## Technology

- Frontend: HTML5, CSS3, and vanilla JavaScript
- Backend: Node.js and Express
- Database: MongoDB with Mongoose
- Authentication: Express sessions with MongoDB session storage
- Deployment: Vercel for the frontend and Render for the backend API

## Requirements

- **Node.js 22.5.0 or newer**
- MongoDB running locally or a MongoDB Atlas connection string
- A modern browser

## Local setup

```bash
npm run install:all
npm run seed --prefix backend
npm start
```

Create `backend/.env` before seeding:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/bloomgifts
SESSION_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin@123
```

Open the storefront at [http://localhost:3001](http://localhost:3001). The API runs at [http://localhost:3000](http://localhost:3000). The frontend reads the API address from [frontend/config.js](frontend/config.js).

To run services separately, use `npm start --prefix backend` and `npm start --prefix frontend`.

Use a fresh MongoDB database to reset all records. The seed script is [backend/db/seed.js](backend/db/seed.js).

## Demo admin account

| Purpose | Value |
| --- | --- |
| Admin username | `admin` |
| Password | `admin@123` |

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` before seeding to use different credentials. Do not use demo credentials in production.

## Deployment

### Frontend on Vercel

Vercel serves the `frontend` directory using [vercel.json](vercel.json).

- Website: [https://bloomgifts.vercel.app](https://bloomgifts.vercel.app)
- Output directory: `frontend`
- Framework: static site

### Backend on Render

The backend service starts with `npm start` from the `backend` directory.

- API: [https://bloomgifts.onrender.com](https://bloomgifts.onrender.com)
- Health check: [https://bloomgifts.onrender.com/health](https://bloomgifts.onrender.com/health)

Configure `MONGODB_URI`, `SESSION_SECRET`, `FRONTEND_URL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` in Render. Set `FRONTEND_URL` to `https://bloomgifts.vercel.app`.

## Project structure

```text
bloom-giftsv2/
├─ package.json              # Root scripts for both services
├─ vercel.json               # Vercel static frontend configuration
├─ frontend/
│  ├─ *.html                 # Storefront, checkout, confirmation, and admin pages
│  ├─ config.js              # Local and deployed API base URL
│  ├─ css/style.css          # Shared site styles
│  ├─ js/                    # Page-specific and shared frontend logic
│  └─ assets/                # Images and videos
└─ backend/
   ├─ server.js              # Express API entry point
   ├─ db/                    # MongoDB connection and seed data
   ├─ models/                # Product, order, admin, and hamper schemas
   ├─ middleware/            # Admin authentication middleware
   └─ routes/                # Storefront, order, admin, and hamper APIs
```

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/products` | List products, optionally filtered by category |
| GET | `/api/products/:slug` | Get one product and its customization options |
| GET | `/api/products/meta/hamper-components` | Get public hamper component groups |
| POST | `/api/orders` | Create a guest order |
| GET | `/api/orders/:orderNumber` | Retrieve an order confirmation |
| POST | `/api/admin/login` | Sign in as an administrator |
| GET | `/api/admin/stats` | Get dashboard statistics |
| GET | `/api/admin/orders` | List orders for the dashboard |
| CRUD | `/api/admin/products` | Manage products; admin access required |
| CRUD | `/api/admin/hamper-components` | Manage hamper components; admin access required |

## Notes

- Payment is intentionally limited to Cash on Delivery.
- Checkout is guest-only; customer accounts are not implemented.
- Product images and homepage media are loaded from remote Pexels URLs.
- Admin sessions require MongoDB and a secure session secret in deployed environments.
