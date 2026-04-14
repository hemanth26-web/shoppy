/**
 * ============================================================
 *  E-Commerce Backend – Express.js REST API
 *  Features: Products, Cart, Orders, Auth (JWT), Middleware
 * ============================================================
 */

const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'supersecret_change_in_production';

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());               // Allow cross-origin requests
app.use(express.json());       // Parse JSON request bodies

// ─── In-Memory "Database" (replace with MongoDB/PostgreSQL) ──
const db = {
  users: [
    {
      id: 1,
      name: 'Demo User',
      email: 'demo@shop.com',
      // bcrypt hash of "password123"
      password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      createdAt: new Date().toISOString(),
    },
  ],
  products: [
    { id: 1, name: 'Wireless Headphones', price: 2499, category: 'Electronics', stock: 15, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', description: 'Premium noise-cancelling wireless headphones with 30hr battery.' },
    { id: 2, name: 'Running Shoes',        price: 3299, category: 'Footwear',    stock: 30, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', description: 'Lightweight running shoes with responsive cushioning.' },
    { id: 3, name: 'Smart Watch',          price: 7999, category: 'Electronics', stock: 8,  image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', description: 'Feature-rich smartwatch with health tracking & GPS.' },
    { id: 4, name: 'Leather Backpack',     price: 1899, category: 'Bags',        stock: 20, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', description: 'Genuine leather backpack with laptop sleeve.' },
    { id: 5, name: 'Sunglasses',           price: 999,  category: 'Accessories', stock: 50, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', description: 'UV400 polarised sunglasses in titanium frame.' },
    { id: 6, name: 'Coffee Maker',         price: 4299, category: 'Home',        stock: 12, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', description: 'Programmable drip coffee maker with thermal carafe.' },
  ],
  carts: {},    // { userId: [{ productId, quantity }] }
  orders: [],   // Array of order objects
  nextOrderId: 1,
};

// ─── Auth Middleware ──────────────────────────────────────────
/**
 * Protect routes by verifying JWT token.
 * Usage: add `authMiddleware` as a route handler before your handler.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET); // decoded payload
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─────────────────────────────────────────────────────────────
//  AUTH ROUTES
// ─────────────────────────────────────────────────────────────

/** POST /api/auth/register – Create a new user */
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });

  if (db.users.find(u => u.email === email))
    return res.status(409).json({ error: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: db.users.length + 1, name, email, password: hashedPassword, createdAt: new Date().toISOString() };
  db.users.push(user);

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

/** POST /api/auth/login – Authenticate user, return JWT */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// ─────────────────────────────────────────────────────────────
//  PRODUCT ROUTES
// ─────────────────────────────────────────────────────────────

/** GET /api/products – List products (optional ?category= & ?search=) */
app.get('/api/products', (req, res) => {
  let products = [...db.products];

  if (req.query.category)
    products = products.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());

  if (req.query.search)
    products = products.filter(p =>
      p.name.toLowerCase().includes(req.query.search.toLowerCase()) ||
      p.description.toLowerCase().includes(req.query.search.toLowerCase())
    );

  res.json(products);
});

/** GET /api/products/:id – Get single product */
app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// ─────────────────────────────────────────────────────────────
//  CART ROUTES  (protected – require login)
// ─────────────────────────────────────────────────────────────

/** GET /api/cart – Get current user's cart */
app.get('/api/cart', authMiddleware, (req, res) => {
  const cartItems = db.carts[req.user.id] || [];

  // Enrich cart items with product details
  const enriched = cartItems
    .map(item => {
      const product = db.products.find(p => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean);

  res.json(enriched);
});

/** POST /api/cart – Add item to cart */
app.post('/api/cart', authMiddleware, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  if (!db.carts[req.user.id]) db.carts[req.user.id] = [];
  const cart = db.carts[req.user.id];
  const existing = cart.find(i => i.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  res.json({ message: 'Added to cart' });
});

/** PUT /api/cart/:productId – Update quantity */
app.put('/api/cart/:productId', authMiddleware, (req, res) => {
  const { quantity } = req.body;
  const productId = Number(req.params.productId);
  const cart = db.carts[req.user.id] || [];
  const item = cart.find(i => i.productId === productId);

  if (!item) return res.status(404).json({ error: 'Item not in cart' });
  if (quantity <= 0) {
    db.carts[req.user.id] = cart.filter(i => i.productId !== productId);
  } else {
    item.quantity = quantity;
  }
  res.json({ message: 'Cart updated' });
});

/** DELETE /api/cart/:productId – Remove item from cart */
app.delete('/api/cart/:productId', authMiddleware, (req, res) => {
  const productId = Number(req.params.productId);
  db.carts[req.user.id] = (db.carts[req.user.id] || []).filter(i => i.productId !== productId);
  res.json({ message: 'Removed from cart' });
});

// ─────────────────────────────────────────────────────────────
//  ORDER ROUTES  (protected)
// ─────────────────────────────────────────────────────────────

/** POST /api/orders – Place order from cart */
app.post('/api/orders', authMiddleware, (req, res) => {
  const { shippingAddress } = req.body;
  const cartItems = db.carts[req.user.id] || [];

  if (cartItems.length === 0)
    return res.status(400).json({ error: 'Cart is empty' });

  // Build order items & calculate total
  const items = [];
  let total = 0;

  for (const item of cartItems) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product || product.stock < item.quantity)
      return res.status(400).json({ error: `Insufficient stock for ${product?.name}` });

    items.push({ productId: product.id, name: product.name, price: product.price, quantity: item.quantity });
    total += product.price * item.quantity;
    product.stock -= item.quantity; // deduct stock
  }

  const order = {
    id: db.nextOrderId++,
    userId: req.user.id,
    items,
    total,
    shippingAddress,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  db.orders.push(order);
  db.carts[req.user.id] = []; // clear cart

  res.status(201).json(order);
});

/** GET /api/orders – Get all orders for current user */
app.get('/api/orders', authMiddleware, (req, res) => {
  const userOrders = db.orders.filter(o => o.userId === req.user.id);
  res.json(userOrders);
});

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => console.log(`🛒  API running at http://localhost:${PORT}`));