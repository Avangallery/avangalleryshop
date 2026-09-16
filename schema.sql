PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 phone TEXT NOT NULL UNIQUE,
 email TEXT DEFAULT '',
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'customer',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions(
 id TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL,
 expires_at TEXT NOT NULL,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 slug TEXT UNIQUE NOT NULL,
 image TEXT DEFAULT '',
 sort_order INTEGER DEFAULT 0,
 active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 category_id INTEGER,
 brand TEXT NOT NULL,
 name TEXT NOT NULL,
 slug TEXT UNIQUE NOT NULL,
 description TEXT DEFAULT '',
 price INTEGER NOT NULL DEFAULT 0,
 compare_price INTEGER,
 stock INTEGER NOT NULL DEFAULT 0,
 sku TEXT DEFAULT '',
 image TEXT DEFAULT '',
 gallery TEXT DEFAULT '[]',
 featured INTEGER DEFAULT 0,
 active INTEGER DEFAULT 1,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS addresses(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 title TEXT DEFAULT 'آدرس',
 receiver TEXT NOT NULL,
 phone TEXT NOT NULL,
 province TEXT NOT NULL,
 city TEXT NOT NULL,
 address TEXT NOT NULL,
 postal_code TEXT DEFAULT '',
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carts(
 user_id INTEGER PRIMARY KEY,
 items TEXT NOT NULL DEFAULT '[]',
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER,
 order_number TEXT UNIQUE NOT NULL,
 status TEXT DEFAULT 'pending',
 payment_status TEXT DEFAULT 'unpaid',
 total INTEGER DEFAULT 0,
 receiver TEXT NOT NULL,
 phone TEXT NOT NULL,
 province TEXT NOT NULL,
 city TEXT NOT NULL,
 address TEXT NOT NULL,
 postal_code TEXT DEFAULT '',
 note TEXT DEFAULT '',
 tracking_code TEXT DEFAULT '',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 order_id INTEGER NOT NULL,
 product_id INTEGER,
 product_name TEXT NOT NULL,
 brand TEXT NOT NULL,
 price INTEGER NOT NULL,
 qty INTEGER NOT NULL,
 image TEXT DEFAULT '',
 FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
 FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS favorites(
 user_id INTEGER NOT NULL,
 product_id INTEGER NOT NULL,
 PRIMARY KEY(user_id,product_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coupons(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 code TEXT UNIQUE NOT NULL,
 type TEXT DEFAULT 'percent',
 value INTEGER NOT NULL,
 min_order INTEGER DEFAULT 0,
 max_uses INTEGER,
 used_count INTEGER DEFAULT 0,
 expires_at TEXT,
 active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

INSERT OR IGNORE INTO categories(name,slug,image,sort_order) VALUES
('ساعت مردانه','men','https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=85',1),
('ساعت زنانه','women','https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=85',2),
('ساعت لوکس','luxury','https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1000&q=85',3);