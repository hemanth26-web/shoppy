# 🛒 ShopLux – Full-Stack E-Commerce Website

A clean, production-quality e-commerce app with a **Node.js/Express backend** and a **vanilla HTML/CSS/JS frontend**.

---

## 📁 Project Structure

```
ecommerce/
├── backend/
│   ├── server.js       ← Express REST API (all backend logic)
│   └── package.json    ← Node dependencies
└── frontend/
    └── index.html      ← Complete frontend (HTML + CSS + JS)
```

---

## ✨ Features

| Feature           | Details                                       |
|-------------------|-----------------------------------------------|
| 🔐 Authentication  | Register / Login with JWT tokens             |
| 🛍️ Products        | Browse, search, filter by category           |
| 🛒 Cart            | Add, update quantity, remove items           |
| 📦 Orders          | Checkout with shipping address, order history |
| 🔒 Protected APIs  | Cart & orders require a valid JWT            |
| 💾 Persistence     | Passwords hashed with bcrypt                 |

---

## 🚀 Setup & Run

### 1. Backend

```bash
cd backend
npm install
npm start
# API running at http://localhost:3001
```

### 2. Frontend

Just open `frontend/index.html` in your browser.  
*(No build step needed — pure HTML/CSS/JS)*

---

## 🌐 API Reference

### Auth
| Method | Endpoint             | Body                          | Auth? |
|--------|----------------------|-------------------------------|-------|
| POST   | /api/auth/register   | `{name, email, password}`     | ✗     |
| POST   | /api/auth/login      | `{email, password}`           | ✗     |

### Products
| Method | Endpoint             | Query Params                  | Auth? |
|--------|----------------------|-------------------------------|-------|
| GET    | /api/products        | `?category=` `?search=`       | ✗     |
| GET    | /api/products/:id    | —                             | ✗     |

### Cart
| Method | Endpoint             | Body                          | Auth? |
|--------|----------------------|-------------------------------|-------|
| GET    | /api/cart            | —                             | ✅    |
| POST   | /api/cart            | `{productId, quantity}`       | ✅    |
| PUT    | /api/cart/:productId | `{quantity}`                  | ✅    |
| DELETE | /api/cart/:productId | —                             | ✅    |

### Orders
| Method | Endpoint             | Body                          | Auth? |
|--------|----------------------|-------------------------------|-------|
| POST   | /api/orders          | `{shippingAddress}`           | ✅    |
| GET    | /api/orders          | —                             | ✅    |

---

## 🔧 Upgrade Path

| Current (Demo)        | Production Replacement              |
|-----------------------|-------------------------------------|
| In-memory `db` object | MongoDB / PostgreSQL                |
| In-memory sessions    | Redis for cart sessions             |
| Local bcrypt          | Same (bcrypt is production-ready)   |
| `JWT_SECRET` hardcoded| `.env` file with `dotenv`           |
| No payments           | Integrate Razorpay / Stripe         |

---

## 🧪 Demo Login

```
Email:    demo@shop.com
Password: password123
```

---

## 📦 Tech Stack

- **Backend**: Node.js, Express, JWT, bcryptjs
- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables, Grid, Flexbox), JavaScript (ES6+)
- **No framework required** on the frontend — runs in any browser
