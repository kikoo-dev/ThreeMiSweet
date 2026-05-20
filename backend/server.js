require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// IMAGE UPLOAD SETUP (Multer)
// ============================================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Hanya file gambar (jpg, png, gif, webp) yang diperbolehkan'));
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// ============================================================
// PAKASIR QRIS INTEGRATION
// ============================================================
let pakasir = null;

async function initPakasir() {
  try {
    const { Pakasir } = await import('pakasir-sdk');
    const slug = process.env.PAKASIR_SLUG;
    const apikey = process.env.PAKASIR_API_KEY;

    if (!slug || slug === 'your-project-slug' || !apikey || apikey === 'your-api-key') {
      console.warn('⚠️  Pakasir belum dikonfigurasi. Isi PAKASIR_SLUG dan PAKASIR_API_KEY di backend/.env');
      console.warn('   QRIS akan menggunakan mode simulasi (QR code lokal).');
      return;
    }

    pakasir = new Pakasir({ slug, apikey });
    console.log('✅ Pakasir SDK berhasil diinisialisasi');
  } catch (err) {
    console.error('❌ Gagal menginisialisasi Pakasir SDK:', err.message);
  }
}

initPakasir();

// ============================================================
// DATABASE
// ============================================================
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Biasanya 'root' di XAMPP
  password: '',      // Biasanya kosong ('') di XAMPP
  database: 'threemi_sweet'
});

db.connect((err) => {
  if (err) {
    console.error('Kesalahan koneksi ke MySQL:', err);
  } else {
    console.log('Berhasil terhubung ke database MySQL [threemi_sweet]');

    // --- Orders Table ---
    const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NULL,
      total_price INT NOT NULL,
      payment_method VARCHAR(255) NOT NULL,
      pakasir_order_id VARCHAR(255) NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    db.query(createOrdersTable, (err) => {
      if (err) console.error("Gagal membuat tabel orders:", err);
      else console.log("Tabel orders siap");
    });

    // Tambah kolom pakasir_order_id jika belum ada (untuk database lama)
    db.query("SHOW COLUMNS FROM orders LIKE 'pakasir_order_id'", (err, results) => {
      if (!err && results.length === 0) {
        db.query("ALTER TABLE orders ADD COLUMN pakasir_order_id VARCHAR(255) NULL AFTER payment_method");
      }
    });

    // --- Order Items Table ---
    const createOrderItemsTable = `
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      cake_name VARCHAR(255) NOT NULL,
      flavor VARCHAR(255),
      cream VARCHAR(255),
      filling VARCHAR(255),
      price INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`;
    db.query(createOrderItemsTable, (err) => {
      if(err) console.error("Gagal membuat tabel order_items:", err);
      else console.log("Tabel order_items siap");
    });

    // --- Products Table ---
    const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      kategori VARCHAR(100) NOT NULL DEFAULT 'Whole Cake',
      harga INT NOT NULL DEFAULT 0,
      img TEXT NULL,
      tags VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`;
    db.query(createProductsTable, (err) => {
      if (err) console.error("Gagal membuat tabel products:", err);
      else {
        console.log("Tabel products siap");
        // Seed default products jika tabel kosong
        seedDefaultProducts();
      }
    });

    // --- Users: Add role column if not exists ---
    db.query("SHOW COLUMNS FROM users LIKE 'role'", (err, results) => {
      if (!err && results.length === 0) {
        db.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'buyer'", (err2) => {
          if (!err2) {
            console.log("Kolom 'role' ditambahkan ke tabel users");
            seedAdminUser();
          }
        });
      } else {
        seedAdminUser();
      }
    });

    // --- Customer Contracts Table ---
    const createContractsTable = `
    CREATE TABLE IF NOT EXISTS customer_contracts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama_pelanggan VARCHAR(255) NOT NULL,
      nomor_telepon VARCHAR(50) NOT NULL,
      username VARCHAR(255) NULL,
      agreement_accepted TINYINT(1) DEFAULT 0,
      agreement_text TEXT NULL,
      ip_address VARCHAR(100) NULL,
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`;
    db.query(createContractsTable, (err) => {
      if (err) console.error("Gagal membuat tabel customer_contracts:", err);
      else console.log("Tabel customer_contracts siap");
    });
  }
});

// Seed admin user
function seedAdminUser() {
  db.query("SELECT * FROM users WHERE username = 'admin'", (err, results) => {
    if (!err && results.length === 0) {
      db.query("INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')", (err2) => {
        if (!err2) console.log("✅ Admin user dibuat (admin / admin123)");
      });
    } else if (!err && results.length > 0) {
      // Update role & password jika admin sudah ada tapi belum di-set
      db.query("UPDATE users SET role = 'admin', password = 'admin123' WHERE username = 'admin'", () => {});
    }
  });
}

// Seed default products
function seedDefaultProducts() {
  db.query("SELECT COUNT(*) as count FROM products", (err, results) => {
    if (err || results[0].count > 0) return;

    const defaultProducts = [
      [1, 'Double Chocolate Cake', 'Whole Cake', 385000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop', 'Best Seller'],
      [2, 'Red Velvet Fantasy', 'Whole Cake', 350000, 'https://images.unsplash.com/photo-1616541823729-00a70231cfb5?q=80&w=600&auto=format&fit=crop', ''],
      [3, 'Tiramisu Classic', 'Whole Cake', 395000, 'https://images.unsplash.com/photo-1571115177098-24de4cc7c4be?q=80&w=600&auto=format&fit=crop', ''],
      [4, 'Strawberry Shortcake', 'Whole Cake', 375000, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=600&auto=format&fit=crop', 'Best Seller'],
      [5, 'Lotus Biscoff Cheesecake', 'Cheesecake', 420000, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop', ''],
      [6, 'Matcha Opera', 'Premium Cake', 410000, 'https://plus.unsplash.com/premium_photo-1675716172607-b248eb3fb449?q=80&w=600&auto=format&fit=crop', ''],
      [7, 'Mango Mousse Cake', 'Seasonal', 345000, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600&auto=format&fit=crop', ''],
      [8, 'Choco Berry Layer', 'Whole Cake', 380000, 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=600&auto=format&fit=crop', 'Best Seller'],
      [9, 'Cake Bogel', 'Bento Cake', 95000, 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=600&auto=format&fit=crop', ''],
      [10, 'Bento Cake', 'Bento Cake', 85000, 'https://images.unsplash.com/photo-1557925923-33b251d5b4d6?q=80&w=600&auto=format&fit=crop', 'Best Seller'],
      [11, 'Korean Cake', 'Custom Cake', 150000, 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=600&auto=format&fit=crop', 'Best Seller'],
      [12, 'Whole Cake', 'Whole Cake', 300000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop', ''],
      [13, 'Big Whole Cake', 'Whole Cake', 450000, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=600&auto=format&fit=crop', ''],
      [14, 'Extra Tall Cake', 'Custom Cake', 550000, 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=600&auto=format&fit=crop', ''],
      [15, '2 Tier Cake', 'Custom Cake', 850000, 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=600&auto=format&fit=crop', ''],
      [16, '3 Tier Cake', 'Custom Cake', 1250000, 'https://images.unsplash.com/photo-1505977404378-3a0e28bec6cb?q=80&w=600&auto=format&fit=crop', ''],
      [17, 'Burnt Cheesecake', 'Cheesecake', 250000, 'https://images.unsplash.com/photo-1525203135335-7485e13bef18?q=80&w=600&auto=format&fit=crop', 'Best Seller'],
      [18, 'Mochi Burnt Cheesecake', 'Cheesecake', 280000, 'https://images.unsplash.com/photo-1605807646983-377bc5a76493?q=80&w=600&auto=format&fit=crop', ''],
    ];

    const insertQuery = 'INSERT INTO products (id, nama, kategori, harga, img, tags) VALUES ?';
    db.query(insertQuery, [defaultProducts], (err2) => {
      if (err2) console.error("Gagal seed products:", err2);
      else console.log("✅ Default products berhasil di-seed ke database");
    });
  });
}

// ============================================================
// AUTH ENDPOINTS
// ============================================================

// Endpoint untuk Sign Up / Register
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username dan Password tidak boleh kosong!' });
  }

  // Cek apakah username sudah ada
  const checkQuery = 'SELECT * FROM users WHERE username = ?';
  db.query(checkQuery, [username], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Database error' });

    if (results.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Username sudah digunakan!' });
    }

    // Insert user baru (default role = buyer)
    const insertQuery = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    db.query(insertQuery, [username, password, 'buyer'], (err, result) => {
      if (err) return res.status(500).json({ status: 'error', message: 'Gagal membuat akun' });
      res.status(201).json({ status: 'success', message: 'Akun berhasil dibuat! Silakan login.' });
    });
  });
});

// Endpoint untuk Sign In / Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username dan Password tidak boleh kosong!' });
  }

  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Database error' });

    if (results.length > 0) {
      const user = results[0];
      res.status(200).json({
        status: 'success',
        message: 'Login berhasil!',
        user: {
          id: user.id,
          username: user.username,
          role: user.role || (user.username === 'admin' ? 'admin' : 'buyer')
        }
      });
    } else {
      res.status(401).json({ status: 'error', message: 'Username, Password salah atau belum punya akun' });
    }
  });
});

// ============================================================
// PRODUCTS CRUD ENDPOINTS
// ============================================================

/**
 * GET /products
 * Ambil semua produk dari database
 */
app.get('/products', (req, res) => {
  db.query('SELECT * FROM products ORDER BY id ASC', (err, results) => {
    if (err) {
      console.error('GET /products error:', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil data produk' });
    }
    // Transform tags string -> array for frontend compatibility
    const products = results.map(p => ({
      ...p,
      tags: p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    }));
    res.status(200).json({ status: 'success', data: products });
  });
});

/**
 * POST /products
 * Tambah produk baru (dengan upload gambar opsional)
 */
app.post('/products', upload.single('image'), (req, res) => {
  const { nama, kategori, harga, img, tags } = req.body;

  if (!nama || !harga) {
    return res.status(400).json({ status: 'error', message: 'Nama dan Harga produk wajib diisi' });
  }

  // Use uploaded image path or provided URL
  let imageUrl = img || '';
  if (req.file) {
    imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
  }

  const tagsStr = tags || '';
  const insertQuery = 'INSERT INTO products (nama, kategori, harga, img, tags) VALUES (?, ?, ?, ?, ?)';
  db.query(insertQuery, [nama, kategori || 'Whole Cake', Number(harga), imageUrl, tagsStr], (err, result) => {
    if (err) {
      console.error('POST /products error:', err);
      return res.status(500).json({ status: 'error', message: 'Gagal menambahkan produk' });
    }
    res.status(201).json({
      status: 'success',
      message: 'Produk berhasil ditambahkan',
      data: { id: result.insertId, nama, kategori: kategori || 'Whole Cake', harga: Number(harga), img: imageUrl, tags: tagsStr }
    });
  });
});

/**
 * PUT /products/:id
 * Update produk berdasarkan ID (dengan upload gambar opsional)
 */
app.put('/products/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { nama, kategori, harga, img, tags } = req.body;

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (nama !== undefined) { updates.push('nama = ?'); values.push(nama); }
  if (kategori !== undefined) { updates.push('kategori = ?'); values.push(kategori); }
  if (harga !== undefined) { updates.push('harga = ?'); values.push(Number(harga)); }
  if (tags !== undefined) { updates.push('tags = ?'); values.push(tags); }

  // Handle image: uploaded file takes priority, then URL
  if (req.file) {
    const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
    updates.push('img = ?');
    values.push(imageUrl);
  } else if (img !== undefined) {
    updates.push('img = ?');
    values.push(img);
  }

  if (updates.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Tidak ada data yang diubah' });
  }

  values.push(id);
  const updateQuery = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error('PUT /products error:', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengupdate produk' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', message: 'Produk berhasil diupdate' });
  });
});

/**
 * DELETE /products/:id
 * Hapus produk berdasarkan ID
 */
app.delete('/products/:id', (req, res) => {
  const { id } = req.params;

  // Get image path first to delete file if it's a local upload
  db.query('SELECT img FROM products WHERE id = ?', [id], (err, results) => {
    if (!err && results.length > 0) {
      const imgPath = results[0].img;
      if (imgPath && imgPath.includes('/uploads/')) {
        const filename = imgPath.split('/uploads/').pop();
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    db.query('DELETE FROM products WHERE id = ?', [id], (err2, result) => {
      if (err2) {
        console.error('DELETE /products error:', err2);
        return res.status(500).json({ status: 'error', message: 'Gagal menghapus produk' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
      }
      res.status(200).json({ status: 'success', message: 'Produk berhasil dihapus' });
    });
  });
});

/**
 * POST /products/upload-image
 * Upload gambar saja (return URL)
 */
app.post('/products/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'Tidak ada file yang diupload' });
  }
  const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
  res.status(200).json({ status: 'success', url: imageUrl });
});

// ============================================================
// CUSTOMER CONTRACTS ENDPOINTS
// ============================================================

/**
 * POST /contracts
 * Simpan kontrak pelanggan baru
 * Body: { nama_pelanggan, nomor_telepon, username, agreement_accepted, agreement_text }
 */
app.post('/contracts', (req, res) => {
  const { nama_pelanggan, nomor_telepon, username, agreement_accepted, agreement_text } = req.body;

  if (!nama_pelanggan || !nomor_telepon) {
    return res.status(400).json({ status: 'error', message: 'Nama dan Nomor Telepon wajib diisi' });
  }

  if (!agreement_accepted) {
    return res.status(400).json({ status: 'error', message: 'Anda harus menyetujui syarat dan ketentuan' });
  }

  // Get IP address from request
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || 'unknown';

  const insertQuery = `INSERT INTO customer_contracts 
    (nama_pelanggan, nomor_telepon, username, agreement_accepted, agreement_text, ip_address, status) 
    VALUES (?, ?, ?, ?, ?, ?, 'Active')`;

  db.query(insertQuery, [
    nama_pelanggan, 
    nomor_telepon, 
    username || null, 
    agreement_accepted ? 1 : 0, 
    agreement_text || 'Menyetujui syarat dan ketentuan penggunaan website Threemi Sweet',
    ipAddress
  ], (err, result) => {
    if (err) {
      console.error('POST /contracts error:', err);
      return res.status(500).json({ status: 'error', message: 'Gagal menyimpan kontrak pelanggan' });
    }
    res.status(201).json({
      status: 'success',
      message: 'Kontrak pelanggan berhasil disimpan',
      data: { 
        id: result.insertId, 
        nama_pelanggan, 
        nomor_telepon, 
        agreement_accepted: true,
        created_at: new Date().toISOString()
      }
    });
  });
});

/**
 * GET /contracts
 * Ambil semua kontrak pelanggan (untuk admin dashboard)
 */
app.get('/contracts', (req, res) => {
  db.query('SELECT * FROM customer_contracts ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('GET /contracts error:', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil data kontrak' });
    }
    res.status(200).json({ status: 'success', data: results });
  });
});

/**
 * PUT /contracts/:id/status
 * Update status kontrak (Active, Suspended, Terminated)
 */
app.put('/contracts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Active', 'Suspended', 'Terminated'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ status: 'error', message: 'Status tidak valid' });
  }

  db.query('UPDATE customer_contracts SET status = ? WHERE id = ?', [status, id], (err, result) => {
    if (err) {
      console.error('PUT /contracts/:id/status error:', err);
      return res.status(500).json({ status: 'error', message: 'Gagal mengupdate status kontrak' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Kontrak tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', message: 'Status kontrak berhasil diupdate' });
  });
});

/**
 * DELETE /contracts/:id
 * Hapus kontrak pelanggan
 */
app.delete('/contracts/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM customer_contracts WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('DELETE /contracts/:id error:', err);
      return res.status(500).json({ status: 'error', message: 'Gagal menghapus kontrak' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Kontrak tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', message: 'Kontrak berhasil dihapus' });
  });
});

// ============================================================
// CHECKOUT ENDPOINT (Cash / Debit)
// ============================================================
app.post('/checkout', (req, res) => {
  const { username, cartItems, totalPrice, paymentMethod } = req.body;
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Cart kosong' });
  }

  const method = paymentMethod || 'cash';
  const orderQuery = 'INSERT INTO orders (username, total_price, payment_method, status) VALUES (?, ?, ?, ?)';
  db.query(orderQuery, [username || 'Guest', totalPrice, method, 'Completed'], (err, result) => {
    if (err) {
       console.error(err);
       return res.status(500).json({ status: 'error', message: 'Gagal membuat order' });
    }
    
    const orderId = result.insertId;
    const itemsQuery = 'INSERT INTO order_items (order_id, cake_name, flavor, cream, filling, price) VALUES ?';
    const values = cartItems.map(item => [orderId, item.cake.nama, item.flavor || '', item.cream || '', item.filling || '', item.cake.harga]);
    
    db.query(itemsQuery, [values], (err2) => {
       if (err2) {
          console.error(err2);
          return res.status(500).json({ status: 'error', message: 'Gagal menyimpan detail order' });
       }
       res.status(201).json({ status: 'success', message: 'Pesanan berhasil dibuat.', orderId });
    });
  });
});

// ============================================================
// QRIS PAKASIR ENDPOINTS
// ============================================================

/**
 * POST /qris/create
 * Buat transaksi QRIS via Pakasir
 * Body: { username, cartItems, totalPrice }
 * Response: { qr_string, payment_url, order_id, amount, expired_at }
 */
app.post('/qris/create', async (req, res) => {
  const { username, cartItems, totalPrice } = req.body;

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Cart kosong' });
  }

  if (!pakasir) {
    return res.status(503).json({
      status: 'error',
      message: 'Pakasir belum dikonfigurasi. Isi PAKASIR_SLUG dan PAKASIR_API_KEY di backend/.env',
      useFallback: true
    });
  }

  try {
    // Generate unique order ID
    const orderId = `TMS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const amount = Math.max(totalPrice, 500); // Minimum Rp500 di Pakasir

    // Buat transaksi QRIS di Pakasir
    const payment = await pakasir.createPayment('qris', orderId, amount);

    console.log('📱 QRIS Payment created:', { orderId, amount, status: payment.status });

    // Simpan order ke database dengan status Pending
    const orderQuery = 'INSERT INTO orders (username, total_price, payment_method, pakasir_order_id, status) VALUES (?, ?, ?, ?, ?)';
    db.query(orderQuery, [username || 'Guest', totalPrice, 'qris', orderId, 'Pending'], (err, result) => {
      if (err) {
        console.error('DB Error:', err);
        // Tetap return payment data meskipun DB error
      } else {
        // Simpan cart items
        const dbOrderId = result.insertId;
        const itemsQuery = 'INSERT INTO order_items (order_id, cake_name, flavor, cream, filling, price) VALUES ?';
        const values = cartItems.map(item => [dbOrderId, item.cake.nama, item.flavor || '', item.cream || '', item.filling || '', item.cake.harga]);
        db.query(itemsQuery, [values], () => {});
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        order_id: orderId,
        amount: payment.amount || amount,
        total_payment: payment.total_payment || amount,
        fee: payment.fee || 0,
        payment_url: payment.payment_url || null,
        payment_number: payment.payment_number || null,
        status: payment.status || 'pending',
        expired_at: payment.expired_at || null
      }
    });

  } catch (err) {
    console.error('❌ Pakasir Error:', err.message || err);
    res.status(500).json({
      status: 'error',
      message: 'Gagal membuat transaksi QRIS: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * POST /qris/status
 * Cek status pembayaran QRIS
 * Body: { order_id, amount }
 */
app.post('/qris/status', async (req, res) => {
  const { order_id, amount } = req.body;

  if (!order_id || !amount) {
    return res.status(400).json({ status: 'error', message: 'order_id dan amount diperlukan' });
  }

  if (!pakasir) {
    return res.status(503).json({ status: 'error', message: 'Pakasir belum dikonfigurasi' });
  }

  try {
    const detail = await pakasir.detailPayment(order_id, amount);
    
    // Update database jika status berubah ke completed
    if (detail.status === 'completed') {
      db.query(
        'UPDATE orders SET status = ? WHERE pakasir_order_id = ?',
        ['Completed', order_id],
        () => {}
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        order_id: detail.order_id || order_id,
        amount: detail.amount || amount,
        payment_status: detail.status || 'pending',
        completed_at: detail.completed_at || null
      }
    });
  } catch (err) {
    console.error('❌ Status check error:', err.message || err);
    res.status(500).json({
      status: 'error',
      message: 'Gagal cek status: ' + (err.message || 'Unknown error')
    });
  }
});

/**
 * POST /qris/webhook
 * Webhook dari Pakasir saat pembayaran berhasil
 */
app.post('/qris/webhook', (req, res) => {
  const { order_id, status, amount } = req.body;

  console.log('🔔 Webhook diterima:', { order_id, status, amount });

  if (status === 'completed') {
    db.query(
      'UPDATE orders SET status = ? WHERE pakasir_order_id = ?',
      ['Completed', order_id],
      (err) => {
        if (err) console.error('Webhook DB Error:', err);
        else console.log(`✅ Order ${order_id} updated to Completed`);
      }
    );
  }

  res.status(200).json({ status: 'ok' });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(port, () => {
  console.log(`Backend server berjalan di http://localhost:${port}`);
  if (!pakasir) {
    console.log('ℹ️  Mode: Simulasi QRIS (tanpa Pakasir)');
    console.log('   Untuk QRIS asli, isi PAKASIR_SLUG & PAKASIR_API_KEY di .env');
  } else {
    console.log('ℹ️  Mode: Pakasir QRIS Aktif ✅');
  }
});
