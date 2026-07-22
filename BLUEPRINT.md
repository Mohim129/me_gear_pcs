# MEG PCs Store – Blueprint

## 1. Pages & Sections

### Public Pages (no login required)
| Route | Page | Key Sections / Components |
|-------|------|---------------------------|
| `/` | Home | Hero slider, Categories bento‑grid, New Arrivals (4 cards), Best Sellers (4 cards), Features (4 icons), Statistics, Testimonials carousel, Newsletter + FAQ, Footer |
| `/products` | Shop / Explore | Search bar, Filter sidebar (category, price range, brand, rating), Sort, Product grid (4 cols), Pagination, Skeleton loaders |
| `/products/[id]` | Product Detail | Image gallery, Specifications table, Add to Cart, Add to Wishlist, Tabs (Description, Reviews, Shipping), Related Products |
| `/pc-builder` | PC Builder | Core Components slots, Peripherals slots, Budget input, Recommend PC button, Sidebar summary, Finalize & Add to Cart |
| `/about` | About | Hero, Story, Mission, Team, CTA |
| `/contact` | Contact | Form, Company info, Social links |
| `/login` | Login | Split‑screen, email/password, Demo Login, Demo Admin, Google sign‑in |
| `/register` | Register | Split‑screen, name/email/password/confirm, Google sign‑up |

### Protected Pages (user role)
| Route | Page | Key Features |
|-------|------|--------------|
| `/profile` | User Profile | Sidebar (Profile, Orders, Wishlist, Settings, Logout), Edit profile, Change password, Avatar upload |
| `/orders` | Order History | Filter pills, Orders table, Order detail (status timeline, items, shipping) |
| `/wishlist` | Wishlist | Product grid, Move to Cart, Remove |
| `/cart` | Cart | Item list, Quantity controls, Custom build expandable, Summary sidebar, Proceed to Checkout |
| `/checkout` | Checkout | Shipping form, Order summary, Cash on Delivery, Place Order |
| `/order-confirmation/[id]` | Confirmation | Order details, Total, Continue Shopping |

### Protected Pages (admin role)
| Route | Page | Key Features |
|-------|------|--------------|
| `/admin` | Dashboard | Revenue/Orders/Products/Low‑Stock cards, Revenue chart, Category pie, Recent orders |
| `/admin/orders` | Orders | Status tabs, Search, Table, Status update dropdown (stock sync on cancel) |
| `/admin/transactions` | Transactions | Summary, Filters, Table |
| `/admin/customers` | Customers | Table, View Orders per customer |
| `/admin/inventory` | Inventory | Products table, Add Product page, Edit Product modal, Category management |
| `/admin/settings` | Settings | General, Security, Notifications, Regional, Danger zone |

**Category Click Behavior:** On the Homepage Categories section, each category card/button links to `/products?category=<category-slug>`. The Shop page reads the query parameter and auto‑applies the filter.

---

## 2. Data Models (MongoDB / Mongoose)

### User
- `name` String
- `email` String unique
- `password` String (hashed)
- `role` String (enum: 'user', 'admin')
- `avatar` String (URL)
- `phone` String
- `createdAt` Date

### Category
- `name` String
- `slug` String unique
- `icon` String (optional)

### Product
- `name` String
- `sku` String unique
- `category` ObjectId (ref: Category)
- `brand` String
- `shortDescription` String
- `fullDescription` String
- `price` Number (BDT)
- `stock` Number
- `images` [String] (imgbb URLs)
- `specifications` Mixed (e.g. { socket: "AM5", cores: 8, ... })
- `rating` Number (average, default 0)
- `numReviews` Number
- `createdAt` Date

### Review
- `product` ObjectId (ref: Product)
- `user` ObjectId (ref: User)
- `rating` Number (1‑5)
- `comment` String
- `createdAt` Date
- (Compound index: one review per user per product)

### Order
- `user` ObjectId (ref: User)
- `items` [OrderItem]
- `shippingAddress` { fullName, phone, street, city, state, zip }
- `paymentMethod` String (default "COD")
- `totalPrice` Number
- `status` String (enum: Pending, Confirmed, Shipped, Delivered, Cancelled)
- `createdAt` Date

### OrderItem (subdocument)
- `product` ObjectId (ref: Product, nullable for custom build parts)
- `name` String
- `quantity` Number
- `price` Number

### Build (saved PC builds)
- `user` ObjectId (ref: User)
- `components` Map of slot -> ProductId (cpu, motherboard, ram, storage, gpu, psu, casing, cooler)
- `peripherals` Map of slot -> ProductId (monitor, mouse, keyboard, speaker, headphone)
- `totalPrice` Number
- `createdAt` Date

### Conversation (AI chat)
- `user` ObjectId (ref: User)
- `messages` [ { role: String, content: String, timestamp: Date } ]

---

## 3. API Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/products` | List products (query: search, category, brand, minPrice, maxPrice, rating, sort, page, limit) |
| GET | `/api/products/[id]` | Single product |
| POST | `/api/products` | Add product (admin) |
| PUT | `/api/products/[id]` | Update product (admin) |
| DELETE | `/api/products/[id]` | Delete product (admin) |
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Add category (admin) |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/[...all]` | Better Auth handlers |
| GET | `/api/user/profile` | Get current user profile |
| PUT | `/api/user/profile` | Update profile |
| POST | `/api/orders` | Create order (deducts stock) |
| GET | `/api/orders` | Get user’s orders (or all for admin) |
| GET | `/api/orders/[id]` | Single order details |
| PUT | `/api/orders/[id]/status` | Update order status (admin, stock sync) |
| POST | `/api/reviews` | Add review (purchased users only) |
| PUT/DELETE | `/api/reviews/[id]` | Edit/delete own review |
| GET | `/api/builds` | Get user’s saved builds |
| POST | `/api/builds` | Save build |
| DELETE | `/api/builds/[id]` | Delete build |
| POST | `/api/ai/recommend` | PC Builder recommendation (budget, selected parts, use‑case) |
| POST | `/api/chat` | AI Chat Assistant (streaming) |

---

## 4. AI Features Summary

### AI Smart Recommendation Engine
- Trigger: PC Builder "Recommend PC" button.
- Input: budget (BDT), useCase, already selected component IDs.
- Process: Backend filters compatible products from DB, builds a prompt, sends to Gemini, parses structured JSON response.
- Output: recommended product IDs for empty core slots, plus reasons.
- UI: Recommendations get RGB animated border until user confirms.

### AI Chat Assistant (TechBuddy)
- Floating button on all pages.
- Context‑aware (current page/product ID sent with each message).
- Streaming responses (typing indicator).
- Suggested follow‑up prompts.
- Conversation history stored for logged‑in users.