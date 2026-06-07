-- Run this SQL in Supabase SQL Editor to set up your database

-- 1. Products table
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Whole Cake',
  harga INTEGER NOT NULL DEFAULT 0,
  img TEXT,
  tags TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username TEXT,
  total_price INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  pakasir_order_id TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  cake_name TEXT NOT NULL,
  flavor TEXT,
  cream TEXT,
  filling TEXT,
  price INTEGER NOT NULL
);

-- 4. Customer contracts table
CREATE TABLE IF NOT EXISTS customer_contracts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nama_pelanggan TEXT NOT NULL,
  nomor_telepon TEXT NOT NULL,
  username TEXT,
  agreement_accepted BOOLEAN DEFAULT FALSE,
  agreement_text TEXT,
  ip_address TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Profiles table (for user roles, linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'buyer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: products (anyone can read, only admin can write)
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT USING (true);

CREATE POLICY "Admin can insert products"
  ON products FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- RLS: orders
CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    OR username = (SELECT username FROM profiles WHERE id = auth.uid())
  );

-- RLS: order_items
CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT WITH CHECK (true);

-- RLS: customer_contracts
CREATE POLICY "Anyone can insert contracts"
  ON customer_contracts FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view contracts"
  ON customer_contracts FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admin can update contracts"
  ON customer_contracts FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admin can delete contracts"
  ON customer_contracts FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- RLS: profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    'buyer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Seed default products (run after table is created)
INSERT INTO products (nama, kategori, harga, img, tags) VALUES
  ('Double Chocolate Cake', 'Whole Cake', 385000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop', 'Best Seller'),
  ('Red Velvet Fantasy', 'Whole Cake', 350000, 'https://images.unsplash.com/photo-1616541823729-00a70231cfb5?q=80&w=600&auto=format&fit=crop', ''),
  ('Tiramisu Classic', 'Whole Cake', 395000, 'https://images.unsplash.com/photo-1571115177098-24de4cc7c4be?q=80&w=600&auto=format&fit=crop', ''),
  ('Strawberry Shortcake', 'Whole Cake', 375000, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=600&auto=format&fit=crop', 'Best Seller'),
  ('Lotus Biscoff Cheesecake', 'Cheesecake', 420000, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop', ''),
  ('Matcha Opera', 'Premium Cake', 410000, 'https://plus.unsplash.com/premium_photo-1675716172607-b248eb3fb449?q=80&w=600&auto=format&fit=crop', ''),
  ('Mango Mousse Cake', 'Seasonal', 345000, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600&auto=format&fit=crop', ''),
  ('Choco Berry Layer', 'Whole Cake', 380000, 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=600&auto=format&fit=crop', 'Best Seller'),
  ('Cake Bogel', 'Bento Cake', 95000, 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=600&auto=format&fit=crop', ''),
  ('Bento Cake', 'Bento Cake', 85000, 'https://images.unsplash.com/photo-1557925923-33b251d5b4d6?q=80&w=600&auto=format&fit=crop', 'Best Seller'),
  ('Korean Cake', 'Custom Cake', 150000, 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=600&auto=format&fit=crop', 'Best Seller'),
  ('Whole Cake', 'Whole Cake', 300000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop', ''),
  ('Big Whole Cake', 'Whole Cake', 450000, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=600&auto=format&fit=crop', ''),
  ('Extra Tall Cake', 'Custom Cake', 550000, 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=600&auto=format&fit=crop', ''),
  ('2 Tier Cake', 'Custom Cake', 850000, 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=600&auto=format&fit=crop', ''),
  ('3 Tier Cake', 'Custom Cake', 1250000, 'https://images.unsplash.com/photo-1505977404378-3a0e28bec6cb?q=80&w=600&auto=format&fit=crop', ''),
  ('Burnt Cheesecake', 'Cheesecake', 250000, 'https://images.unsplash.com/photo-1525203135335-7485e13bef18?q=80&w=600&auto=format&fit=crop', 'Best Seller'),
  ('Mochi Burnt Cheesecake', 'Cheesecake', 280000, 'https://images.unsplash.com/photo-1605807646983-377bc5a76493?q=80&w=600&auto=format&fit=crop', '')
ON CONFLICT DO NOTHING;

-- ─── ADMIN SETUP ─────────────────────────────────────
-- Set admin role:
-- 1. Sign up with username "admin" via the web app.
-- 2. Run query below to upgrade your role (replace USER_ID with your auth.users id):
--
--    UPDATE profiles SET role = 'admin' WHERE username = 'admin';
