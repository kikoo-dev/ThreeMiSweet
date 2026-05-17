require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
  }
});

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

    // Insert user baru
    const insertQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(insertQuery, [username, password], (err, result) => {
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
      // Login berhasil
      res.status(200).json({ status: 'success', message: 'Login berhasil!', user: { id: results[0].id, username: results[0].username } });
    } else {
      // Login gagal
      res.status(401).json({ status: 'error', message: 'Username, Password salah atau belum punya akun' });
    }
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
