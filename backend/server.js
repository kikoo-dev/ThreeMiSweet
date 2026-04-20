const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Konfigurasi Database (Sesuaikan dengan setting MySQL Anda)
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
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    db.query(createOrdersTable, (err) => {
      if (err) console.error("Gagal membuat tabel orders:", err);
      else console.log("Tabel orders siap");
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

app.post('/checkout', (req, res) => {
  const { username, cartItems, totalPrice } = req.body;
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Cart kosong' });
  }

  const orderQuery = 'INSERT INTO orders (username, total_price, payment_method) VALUES (?, ?, ?)';
  db.query(orderQuery, [username || 'Guest', totalPrice, 'BCA Transfer'], (err, result) => {
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
       res.status(201).json({ status: 'success', message: 'Pesanan berhasil dibuat.' });
    });
  });
});

app.listen(port, () => {
  console.log(`Backend server berjalan di http://localhost:${port}`);
});
