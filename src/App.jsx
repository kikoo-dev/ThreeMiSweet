import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, User, Menu, Globe, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, X, Shield, CreditCard, Banknote, QrCode, CheckCircle2, Printer, Receipt } from 'lucide-react';
import './index.css';
import './MoneyDetector.css';
import QrisCode from './QrisCode';

// Lazy load MoneyDetector to avoid loading TF.js until needed
const MoneyDetector = lazy(() => import('./MoneyDetector'));

const produkKueData = [
  { id: 1, nama: "Double Chocolate Cake", kategori: "Whole Cake", harga: 385000, img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop", tags: ["Best Seller"] },
  { id: 2, nama: "Red Velvet Fantasy", kategori: "Whole Cake", harga: 350000, img: "/rv.jfif", tags: [] },
  { id: 3, nama: "Tiramisu Classic", kategori: "Whole Cake", harga: 395000, img: "/misu.jfif", tags: [] },
  { id: 4, nama: "Strawberry Shortcake", kategori: "Whole Cake", harga: 375000, img: "/str.jfif", tags: ["Best Seller"] },
  { id: 5, nama: "Lotus Biscoff Cheesecake", kategori: "Cheesecake", harga: 420000, img: "/lotus.jfif", tags: [] },
  { id: 6, nama: "Matcha Opera", kategori: "Premium Cake", harga: 410000, img: "https://plus.unsplash.com/premium_photo-1675716172607-b248eb3fb449?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 7, nama: "Mango Mousse Cake", kategori: "Seasonal", harga: 345000, img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 8, nama: "Choco Berry Layer", kategori: "Whole Cake", harga: 380000, img: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=600&auto=format&fit=crop", tags: ["Best Seller"] },
  { id: 9, nama: "Cake Bogel", kategori: "Bento Cake", harga: 95000, img: "/bogel.jfif", tags: [] },
  { id: 10, nama: "Bento Cake", kategori: "Bento Cake", harga: 85000, img: "/bento.jfif", tags: ["Best Seller"] },
  { id: 11, nama: "Korean Cake", kategori: "Custom Cake", harga: 150000, img: "/korean.jfif", tags: ["Best Seller"] },
  { id: 12, nama: "Whole Cake", kategori: "Whole Cake", harga: 300000, img: "/w.jfif", tags: [] },
  { id: 13, nama: "Big Whole Cake", kategori: "Whole Cake", harga: 450000, img: "/whole 2.jfif", tags: [] },
  { id: 14, nama: "Extra Tall Cake", kategori: "Custom Cake", harga: 550000, img: "/tall.jfif", tags: [] },
  { id: 15, nama: "2 Tier Cake", kategori: "Custom Cake", harga: 850000, img: "/2 tier.jfif", tags: [] },
  { id: 16, nama: "3 Tier Cake", kategori: "Custom Cake", harga: 1250000, img: "/3 tier.jfif", tags: [] },
  { id: 17, nama: "Burnt Cheesecake", kategori: "Cheesecake", harga: 250000, img: "/burn.jfif", tags: ["Best Seller"] },
  { id: 18, nama: "Mochi Burnt Cheesecake", kategori: "Cheesecake", harga: 280000, img: "/mochi.jfif", tags: [] },
];

const ProductCard = ({ kue, onAddToCart }) => {
  const [flavor, setFlavor] = useState('');
  const [cream, setCream] = useState('');
  const [filling, setFilling] = useState('');

  const handleAdd = () => {
    onAddToCart({
      id: Date.now() + Math.random(),
      cake: kue,
      flavor,
      cream,
      filling
    });
    setFlavor('');
    setCream('');
    setFilling('');
  };

  return (
    <div className="product-card">
      <div className="product-img-box">
        <img src={kue.img} alt={kue.nama} className="product-img" />
        {kue.tags.includes("Best Seller") && (
          <div className="badge">BEST SELLER</div>
        )}
      </div>

      <div className="product-info">
        <h4 className="product-title">{kue.nama}</h4>
        <p className="product-price">Rp {kue.harga.toLocaleString('id-ID')}</p>

        <div className="product-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', marginTop: '0.5rem', width: '100%' }}>
          <select value={flavor} onChange={e => setFlavor(e.target.value)} className="option-select" style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem', width: '100%' }}>
            <option value="">-- Pilih Cake Flavor --</option>
            <option value="vanilla butter">Vanilla Butter</option>
            <option value="redvelvet">Red Velvet</option>
            <option value="choco brownie">Choco Brownie</option>
          </select>
          <select value={cream} onChange={e => setCream(e.target.value)} className="option-select" style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem', width: '100%' }}>
            <option value="">-- Pilih Cream --</option>
            <option value="cream vanilla">Cream Vanilla</option>
            <option value="cream cheese">Cream Cheese</option>
            <option value="cream chocolate">Cream Chocolate</option>
          </select>
          <select value={filling} onChange={e => setFilling(e.target.value)} className="option-select" style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem', width: '100%' }}>
            <option value="">-- Pilih Filling --</option>
            <option value="strawberry jam">Strawberry Jam</option>
            <option value="choco spread">Choco Spread</option>
            <option value="cookies & cream">Cookies & Cream</option>
          </select>
        </div>

        <button onClick={handleAdd} className="btn-add-cart">
          ADD TO CART
        </button>
      </div>
    </div>
  );
};

// Admin Panel Component for editing products
const AdminPanel = ({ produkKue, handleChange, saveChanges }) => {
  return (
    <section className="admin-panel" style={{ padding: '2rem', background: '#fff', marginTop: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#333' }}>Admin: Manajemen Menu Kue</h2>
        <button className="btn-submit" onClick={saveChanges} style={{ width: 'auto', padding: '0.8rem 2rem' }}>SIMPAN PERUBAHAN KE DATABASE</button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem' }}>
        {produkKue.map(k => (
          <div key={k.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem', alignItems: 'center', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <img src={k.img} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
              <input
                type="text"
                value={k.nama}
                onChange={e => handleChange(k.id, 'nama', e.target.value)}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Nama Kue"
              />
            </div>
            <input
              type="number"
              value={k.harga}
              onChange={e => handleChange(k.id, 'harga', Number(e.target.value))}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="Harga"
            />
            <span style={{ fontSize: '0.8rem', color: '#888' }}>ID: {k.id}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

// Receipt Modal Component
const ReceiptModal = ({ receiptData, onClose }) => {
  if (!receiptData) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Pembayaran - Threemi Sweet</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Spectral:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'DM Sans', monospace, sans-serif;
            padding: 20px;
            max-width: 350px;
            margin: 0 auto;
            color: #1a1a1a;
          }
          .receipt-header { text-align: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px dashed #ccc; }
          .receipt-header h1 { font-family: 'Spectral', serif; font-size: 22px; margin-bottom: 4px; letter-spacing: 2px; }
          .receipt-header p { font-size: 11px; color: #666; line-height: 1.5; }
          .receipt-info { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #ddd; font-size: 12px; }
          .receipt-info .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .receipt-info .label { color: #888; }
          .receipt-items { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px dashed #ccc; }
          .receipt-items .item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
          .receipt-items .item-name { max-width: 60%; }
          .receipt-items .item-detail { font-size: 10px; color: #888; margin-top: 2px; }
          .receipt-total { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px dashed #ccc; }
          .receipt-total .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
          .receipt-total .row.grand { font-size: 16px; font-weight: 700; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; }
          .receipt-footer { text-align: center; font-size: 11px; color: #888; line-height: 1.6; }
          .receipt-footer .thanks { font-size: 13px; font-weight: 700; color: #C7A07A; margin-bottom: 4px; }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <h1>THREEMI SWEET</h1>
          <p>Jl. Mekar 1, Kp Gantungan No.8<br/>Pasirlayung, Kec. Cimenyan<br/>Kab. Bandung, Jawa Barat 40197</p>
        </div>
        <div class="receipt-info">
          <div class="row"><span class="label">No. Transaksi</span><span>${receiptData.transactionId}</span></div>
          <div class="row"><span class="label">Tanggal</span><span>${receiptData.date}</span></div>
          <div class="row"><span class="label">Waktu</span><span>${receiptData.time}</span></div>
          <div class="row"><span class="label">Kasir / Pembeli</span><span>${receiptData.username}</span></div>
          <div class="row"><span class="label">Metode Bayar</span><span>${receiptData.paymentLabel}</span></div>
        </div>
        <div class="receipt-items">
          ${receiptData.items.map(item => `
            <div class="item">
              <div class="item-name">
                ${item.cake.nama}
                ${item.flavor ? '<div class="item-detail">Flavor: ' + item.flavor + '</div>' : ''}
                ${item.cream ? '<div class="item-detail">Cream: ' + item.cream + '</div>' : ''}
                ${item.filling ? '<div class="item-detail">Filling: ' + item.filling + '</div>' : ''}
              </div>
              <div>Rp ${item.cake.harga.toLocaleString('id-ID')}</div>
            </div>
          `).join('')}
        </div>
        <div class="receipt-total">
          <div class="row"><span>Subtotal (${receiptData.items.length} item)</span><span>Rp ${receiptData.totalPrice.toLocaleString('id-ID')}</span></div>
          <div class="row grand"><span>TOTAL</span><span>Rp ${receiptData.totalPrice.toLocaleString('id-ID')}</span></div>
        </div>
        <div class="receipt-footer">
          <p class="thanks">✦ Terima Kasih ✦</p>
          <p>Pesanan Anda sedang diproses.<br/>Hubungi kami di WA: 0895404957926<br/>Instagram: @threemisweet</p>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const paymentLabels = { cash: 'Tunai (Cash)', debit: 'Transfer Debit (BCA)', qris: 'QRIS' };

  return (
    <div className="modal-overlay" style={{ zIndex: 200 }}>
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="modal-box receipt-modal"
        style={{ width: '420px', maxWidth: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '0', textAlign: 'left' }}
      >
        {/* Receipt Header with success banner */}
        <div className="receipt-success-banner">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <CheckCircle2 size={48} style={{ color: '#fff' }} />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginTop: '0.5rem' }}
          >
            Pembayaran Berhasil!
          </motion.h3>
        </div>

        {/* Receipt Body */}
        <div style={{ padding: '1.5rem 2rem' }}>
          {/* Store Info */}
          <div style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px dashed #e5e7eb' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', letterSpacing: '0.1em', color: '#1a1a1a', marginBottom: '0.25rem' }}>THREEMI SWEET</h2>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: 1.5 }}>
              Jl. Mekar 1, Kp Gantungan No.8, Pasirlayung<br />
              Kec. Cimenyan, Kab. Bandung, Jawa Barat 40197
            </p>
          </div>

          {/* Transaction Info */}
          <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed #e5e7eb' }}>
            {[
              { label: 'No. Transaksi', value: receiptData.transactionId },
              { label: 'Tanggal', value: receiptData.date },
              { label: 'Waktu', value: receiptData.time },
              { label: 'Pembeli', value: receiptData.username },
              { label: 'Metode Bayar', value: receiptData.paymentLabel },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
                <span style={{ color: '#9ca3af' }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Items */}
          <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px dashed #e5e7eb' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '0.75rem' }}>Detail Pesanan</p>
            {receiptData.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.82rem' }}>
                <div style={{ maxWidth: '65%' }}>
                  <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{item.cake.nama}</div>
                  {item.flavor && <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>Flavor: {item.flavor}</div>}
                  {item.cream && <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Cream: {item.cream}</div>}
                  {item.filling && <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Filling: {item.filling}</div>}
                </div>
                <div style={{ fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Rp {item.cake.harga.toLocaleString('id-ID')}</div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>
              <span>Subtotal ({receiptData.items.length} item)</span>
              <span>Rp {receiptData.totalPrice.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#1a1a1a', paddingTop: '0.5rem', borderTop: '1px solid #f3f4f6' }}>
              <span>TOTAL</span>
              <span style={{ color: '#d9232d' }}>Rp {receiptData.totalPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Footer message */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem', padding: '0.75rem', background: '#fefce8', borderRadius: '8px', border: '1px solid #fef08a' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#C7A07A', marginBottom: '0.2rem' }}>✦ Terima Kasih ✦</p>
            <p style={{ fontSize: '0.7rem', color: '#92400e', lineHeight: 1.5 }}>
              Pesanan Anda sedang diproses.<br />
              Hubungi kami di WA: 0895404957926
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrint}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.9rem', borderRadius: '50px', cursor: 'pointer',
                background: 'linear-gradient(135deg, #C7A07A, #a98973)', color: 'white',
                border: 'none', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em',
                fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(199,160,122,0.35)', transition: 'all 0.2s'
              }}
            >
              <Printer size={16} />
              CETAK STRUK
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.9rem', borderRadius: '50px', cursor: 'pointer',
                background: '#fff', color: '#374151',
                border: '2px solid #e5e7eb', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em',
                fontFamily: 'inherit', transition: 'all 0.2s'
              }}
            >
              <X size={16} />
              TUTUP
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function App() {
  const [produkKue, setProdukKue] = useState(produkKueData);
  const [filter, setFilter] = useState("SEMUA PRODUK");
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const cartCount = cartItems.length;
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ username: '' });
  const [role, setRole] = useState('buyer');
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [showMoneyDetector, setShowMoneyDetector] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [qrisScanned, setQrisScanned] = useState(false);
  const [qrisCountdown, setQrisCountdown] = useState(0);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisUseFallback, setQrisUseFallback] = useState(false);
  const [pakasirData, setPakasirData] = useState(null); // { order_id, amount, payment_url, ... }
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const qrisTimerRef = useRef(null);
  const qrisPollingRef = useRef(null);

  const productsRef = useRef(null);
  const categories = ["SEMUA PRODUK", "PRODUK TERLARIS", "WHOLE CAKE", "CHEESECAKE", "BENTO CAKE", "CUSTOM CAKE"];
  const filteredCakes = produkKue.filter(k => k.nama.toLowerCase().includes(searchQuery.toLowerCase()));

  // Handle input changes in AdminPanel
  const handleChange = (id, field, value) => {
    setProdukKue(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Save changes to backend (placeholder endpoint)
  const saveChanges = async () => {
    try {
      const response = await fetch('http://localhost:5000/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: produkKue })
      });
      if (response.ok) {
        alert('Perubahan berhasil disimpan');
      } else {
        const data = await response.json();
        alert(data.message || 'Gagal menyimpan perubahan');
      }
    } catch (error) {
      console.error(error);
      alert('Error menghubungi server');
    }
  };
  const displayedGroups = filter === "SEMUA PRODUK"
    ? categories.filter(c => c !== "SEMUA PRODUK" && c !== "PRODUK TERLARIS").map(cat => ({
      title: cat,
      cakes: filteredCakes.filter(k => k.kategori.toUpperCase() === cat)
    })).filter(g => g.cakes.length > 0)
    : filter === "PRODUK TERLARIS"
      ? [{ title: "PRODUK TERLARIS", cakes: filteredCakes.filter(k => k.tags.includes("Best Seller")) }].filter(g => g.cakes.length > 0)
      : [{ title: filter, cakes: filteredCakes.filter(k => k.kategori.toUpperCase() === filter) }].filter(g => g.cakes.length > 0);

  useEffect(() => {
    const handleScroll = () => setShowTopButton(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // QRIS countdown timer (fallback / simulasi mode)
  useEffect(() => {
    if (qrisScanned && qrisCountdown > 0) {
      qrisTimerRef.current = setTimeout(() => {
        setQrisCountdown(prev => prev - 1);
      }, 1000);
    }
    if (qrisScanned && qrisCountdown === 0 && qrisTimerRef.current !== null) {
      // Auto-submit payment (for both fallback and pakasir confirmed)
      (async () => {
        try {
          const totalPrice = cartItems.reduce((acc, item) => acc + item.cake.harga, 0);
          const response = await fetch('http://localhost:5000/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: user.username,
              totalPrice: totalPrice,
              cartItems: cartItems,
              paymentMethod: 'qris'
            })
          });
          const data = await response.json();
          if (response.ok) {
            const now = new Date();
            setReceiptData({
              transactionId: 'TMS-' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + String(now.getSeconds()).padStart(2,'0'),
              date: now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
              time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              username: user.username,
              paymentMethod: 'qris',
              paymentLabel: 'QRIS',
              items: [...cartItems],
              totalPrice: totalPrice
            });
            setShowReceipt(true);
            setCartItems([]);
            setShowCheckout(false);
            setPaymentMethod('');
            setQrisScanned(false);
            setQrisCountdown(0);
            setPakasirData(null);
            setQrisUseFallback(false);
          } else {
            alert(data.message || 'Gagal melakukan checkout.');
          }
        } catch (error) {
          alert('Gagal menghubungi server. Pastikan backend menyala.');
        }
      })();
    }
    return () => clearTimeout(qrisTimerRef.current);
  }, [qrisScanned, qrisCountdown]);

  // Pakasir: polling cek status pembayaran setiap 3 detik
  useEffect(() => {
    if (pakasirData && !qrisScanned) {
      qrisPollingRef.current = setInterval(async () => {
        try {
          const res = await fetch('http://localhost:5000/qris/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: pakasirData.order_id,
              amount: pakasirData.amount
            })
          });
          const data = await res.json();
          if (data.status === 'success' && data.data.payment_status === 'completed') {
            // Pembayaran berhasil via Pakasir!
            clearInterval(qrisPollingRef.current);
            setQrisScanned(true);
            setQrisCountdown(3);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
    }
    return () => clearInterval(qrisPollingRef.current);
  }, [pakasirData, qrisScanned]);

  // Reset QRIS state helper
  const resetQrisState = useCallback(() => {
    setQrisScanned(false);
    setQrisCountdown(0);
    setQrisLoading(false);
    setQrisUseFallback(false);
    setPakasirData(null);
    clearTimeout(qrisTimerRef.current);
    clearInterval(qrisPollingRef.current);
  }, []);

  // Create QRIS payment via Pakasir
  const createQrisPayment = useCallback(async () => {
    setQrisLoading(true);
    setPakasirData(null);
    setQrisUseFallback(false);

    try {
      const totalPrice = cartItems.reduce((acc, item) => acc + item.cake.harga, 0);
      const res = await fetch('http://localhost:5000/qris/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          cartItems,
          totalPrice
        })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setPakasirData(data.data);
        console.log('Pakasir QRIS created:', data.data);
      } else if (data.useFallback) {
        // Pakasir belum dikonfigurasi, gunakan QR code lokal
        setQrisUseFallback(true);
      } else {
        alert(data.message || 'Gagal membuat QRIS');
        setQrisUseFallback(true);
      }
    } catch (err) {
      console.error('QRIS create error:', err);
      setQrisUseFallback(true);
    } finally {
      setQrisLoading(false);
    }
  }, [cartItems, user.username]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToProducts = () => productsRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (loginInput.trim() === '' || passwordInput.trim() === '') {
      setAuthError('Username dan password tidak boleh kosong');
      return;
    }

    const endpoint = isRegisterMode ? 'http://localhost:5000/register' : 'http://localhost:5000/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginInput,
          password: passwordInput,
          role: 'buyer' // Setiap pendaftaran dari web otomatis menjadi pembeli
        })
      });
      const data = await response.json();

      if (response.ok) {
        if (isRegisterMode) {
          setAuthSuccess('Registrasi berhasil! Silakan login.');
          setIsRegisterMode(false);
          setPasswordInput('');
        } else {
          setUser({ username: data.user.username });
          setRole(data.user.role || (data.user.username === 'admin' ? 'admin' : 'buyer'));
          setIsLoggedIn(true);
          setShowLoginModal(false);
          setLoginInput('');
          setPasswordInput('');
          setAuthSuccess('');
        }
      } else {
        setAuthError(data.message || 'Terjadi kesalahan pada input.');
      }
    } catch (error) {
      console.error(error);
      setAuthError('Gagal menghubungi server. Pastikan backend menyala.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser({ username: '' });
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo" onClick={scrollToTop}>Threemi Sweet</div>

          <div className="nav-links">
            <span className="nav-link" onClick={scrollToTop}>APA YANG BARU</span>
            <span className="nav-link" onClick={scrollToProducts}>PRODUK</span>
            <a href="https://www.google.com/maps?q=Threemisweet+by+Mila,+Jl.+Mekar+1,+Kp+Gantungan+No.8,+RT.02/RW.22,+Pasirlayung,+Kec.+Cimenyan,+Kabupaten+Bandung,+Jawa+Barat+40197&ftid=0x2e68e737ee00929f:0x7d31bb6442f3edb1&entry=gps&lucs=,94242511,47071704,47069508,94218641,94203019,47084304,94208458,94208447&g_ep=CAISEjI0LjUwLjAuNzA0NDI3ODkxMBgAINeCAypILDk0MjQyNTExLDQ3MDcxNzA0LDQ3MDY5NTA4LDk0MjE4NjQxLDk0MjAzMDE5LDQ3MDg0MzA0LDk0MjA4NDU4LDk0MjA4NDQ3QgJJRA%3D%3D&g_st=ic" target="_blank" rel="noreferrer" className="nav-link" style={{ textDecoration: 'none' }}>LOKASI</a>
            <span className="nav-link">HUBUNGI KAMI</span>
          </div>

          <div className="nav-icons">
            {/* Hanya tampilkan keranjang jika BUKAN admin */}
            {role !== 'admin' && (
              <>
                <div className="nav-icon-group">
                  ID <Globe size={16} strokeWidth={1.5} />
                </div>

                <div className="search-container" style={{ display: 'flex', alignItems: 'center' }}>
                  <AnimatePresence>
                    {showSearchInput && (
                      <motion.input
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 150, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        type="text"
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          border: 'none',
                          borderBottom: '1px solid var(--color-gold)',
                          background: 'transparent',
                          padding: '4px',
                          outline: 'none',
                          marginRight: '8px',
                          fontSize: '0.85rem',
                          fontFamily: 'inherit',
                          color: 'var(--color-text)'
                        }}
                        autoFocus
                      />
                    )}
                  </AnimatePresence>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setShowSearchInput(!showSearchInput);
                      if (!showSearchInput) {
                        scrollToProducts();
                        setFilter("SEMUA PRODUK");
                      } else {
                        setSearchQuery('');
                      }
                    }}
                  >
                    <Search size={20} strokeWidth={1.5} />
                  </button>
                </div>
              </>
            )}

            <div className="user-menu" onClick={() => !isLoggedIn && setShowLoginModal(true)}>
              <button className={`icon-btn ${isLoggedIn && role === 'admin' ? 'admin-active' : ''}`}>
                <User size={20} strokeWidth={1.5} />
                {isLoggedIn && role === 'admin' && <span style={{ fontSize: '10px', position: 'absolute', top: '-5px', right: '-10px', background: 'red', color: 'white', padding: '2px 4px', borderRadius: '4px' }}>ADMIN</span>}
              </button>
              {isLoggedIn && (
                <div className="dropdown">
                  <span className="dropdown-name">{user.username} ({role})</span>
                  <span className="dropdown-logout" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>LOGOUT</span>
                </div>
              )}
            </div>

            {role !== 'admin' && (
              <div className="cart-wrapper" onClick={() => setShowCart(true)} style={{ cursor: 'pointer' }}>
                <button className="icon-btn" style={{ pointerEvents: 'none' }}>
                  <ShoppingBag size={20} strokeWidth={1.5} />
                </button>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="cart-badge"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </div>
            )}

            <button className="icon-btn menu-burger">
              <Menu size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="modal-overlay">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="modal-box"
            >
              <button onClick={() => setShowLoginModal(false)} className="btn-close">
                <X size={20} strokeWidth={1.5} />
              </button>

              <h2 className="modal-title">{isRegisterMode ? "Sign Up" : "Sign In"}</h2>
              <p className="modal-subtitle">
                {isRegisterMode ? "Buat akun untuk melanjutkan." : "Akses produk kue custom kami."}
              </p>

              {authError && <p style={{ color: 'red', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{authError}</p>}
              {authSuccess && <p style={{ color: 'green', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{authSuccess}</p>}

              <form onSubmit={handleAuth} className="form-group">
                <input
                  type="text"
                  placeholder="Username"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  className="input-field"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="input-field"
                  required
                />
                <button type="submit" className="btn-submit">
                  {isRegisterMode ? "DAFTAR SEKARANG" : "SIGN IN"}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#666' }}>
                  {isRegisterMode ? "Sudah punya akun? " : "Belum punya akun? "}
                </span>
                <span
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  style={{ color: 'var(--color-gold)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {isRegisterMode ? "Sign In" : "Sign Up"}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <div className="modal-overlay" style={{ zIndex: 100 }}>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="modal-box"
              style={{ width: '450px', maxWidth: '90%' }}
            >
              <button onClick={() => setShowCart(false)} className="btn-close">
                <X size={20} strokeWidth={1.5} />
              </button>

              <h2 className="modal-title">Keranjang Belanja</h2>
              {cartItems.length === 0 ? (
                <p style={{ textAlign: 'center', marginTop: '2rem' }}>Keranjang Anda masih kosong.</p>
              ) : (
                <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {cartItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <img src={item.cake.img} alt={item.cake.nama} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{item.cake.nama}</h4>
                          {item.flavor && <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Flavor: {item.flavor}</p>}
                          {item.cream && <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Cream: {item.cream}</p>}
                          {item.filling && <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Filling: {item.filling}</p>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Rp {item.cake.harga.toLocaleString('id-ID')}</p>
                        <button onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>Hapus</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #eee' }}>
                    <h3 style={{ margin: 0 }}>Total</h3>
                    <h3 style={{ margin: 0 }}>Rp {cartItems.reduce((acc, item) => acc + item.cake.harga, 0).toLocaleString('id-ID')}</h3>
                  </div>
                  <button
                    className="btn-submit"
                    style={{ marginTop: '1.5rem', width: '100%' }}
                    onClick={() => {
                      if (!isLoggedIn) {
                        setShowCart(false);
                        setShowLoginModal(true);
                      } else {
                        setShowCart(false);
                        setShowCheckout(true);
                      }
                    }}
                  >
                    LANJUT KE CHECKOUT
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal - Multi Payment */}
      <AnimatePresence>
        {showCheckout && (
          <div className="modal-overlay" style={{ zIndex: 100 }}>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="modal-box"
              style={{ width: '500px', maxWidth: '92%', maxHeight: '90vh', overflowY: 'auto', textAlign: 'left' }}
            >
              <button onClick={() => { setShowCheckout(false); setPaymentMethod(''); setShowMoneyDetector(false); resetQrisState(); }} className="btn-close">
                <X size={20} strokeWidth={1.5} />
              </button>

              <h2 className="modal-title" style={{ textAlign: 'center' }}>Checkout & Pembayaran</h2>
              <p className="modal-subtitle" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                Pilih metode pembayaran Anda.
              </p>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: '#f9f9f9', borderRadius: '10px', border: '1px solid #eee' }}>
                <h4 style={{ margin: 0, color: '#333', fontSize: '0.95rem' }}>Total Pembayaran</h4>
                <h4 style={{ margin: 0, color: '#d9232d', fontSize: '1.3rem', fontWeight: 800 }}>Rp {cartItems.reduce((acc, item) => acc + item.cake.harga, 0).toLocaleString('id-ID')}</h4>
              </div>

              {/* Payment Method Selection */}
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '0.75rem' }}>Metode Pembayaran</p>
              <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
                {[
                  { key: 'cash', label: 'Cash', icon: <Banknote size={20} /> },
                  { key: 'debit', label: 'Debit', icon: <CreditCard size={20} /> },
                  { key: 'qris', label: 'QRIS', icon: <QrCode size={20} /> },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => {
                      setPaymentMethod(m.key);
                      setShowMoneyDetector(false);
                      resetQrisState();
                      if (m.key === 'qris') {
                        // Automatically try to create Pakasir QRIS payment
                        setTimeout(() => createQrisPayment(), 100);
                      }
                    }}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                      padding: '1rem 0.5rem', borderRadius: '10px', cursor: 'pointer',
                      border: paymentMethod === m.key ? '2px solid var(--color-gold)' : '2px solid #e5e7eb',
                      background: paymentMethod === m.key ? 'rgba(199,160,122,0.08)' : '#fff',
                      color: paymentMethod === m.key ? 'var(--color-gold)' : '#555',
                      transition: 'all 0.2s', fontFamily: 'inherit'
                    }}
                  >
                    {m.icon}
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* === CASH PAYMENT === */}
              {paymentMethod === 'cash' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1rem' }}>
                  <div style={{ background: '#fffbeb', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #fde68a', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Banknote size={18} style={{ color: '#d97706' }} />
                      <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>Pembayaran Tunai (Cash)</span>
                    </div>
                    <p style={{ color: '#78716c', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                      Siapkan uang tunai sesuai total. Pembayaran dilakukan saat pesanan diantar atau diambil di toko.
                    </p>
                  </div>

                  {/* Cek Uang Palsu button */}
                  <button
                    onClick={() => setShowMoneyDetector(true)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      padding: '0.8rem', borderRadius: '10px', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                      border: 'none', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em',
                      fontFamily: 'inherit', marginBottom: '1rem',
                      boxShadow: '0 4px 14px rgba(99,102,241,0.25)', transition: 'all 0.2s'
                    }}
                  >
                    <Shield size={16} />
                    CEK KEASLIAN UANG ANDA
                  </button>
                </motion.div>
              )}

              {/* === DEBIT PAYMENT === */}
              {paymentMethod === 'debit' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1rem' }}>
                  <div style={{ background: '#eff6ff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #bfdbfe', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <CreditCard size={18} style={{ color: '#2563eb' }} />
                      <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem' }}>Pembayaran Debit</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                      Transfer ke rekening berikut dan konfirmasi setelah transfer berhasil.
                    </p>
                  </div>
                  <div style={{ background: '#f8f8f8', padding: '1.5rem', borderRadius: '10px', textAlign: 'center', border: '1px dashed #ccc', marginBottom: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.4rem 0', color: 'var(--color-gold)', fontSize: '1.2rem' }}>Bank BCA</h3>
                    <p style={{ margin: '0 0 0.3rem 0', fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '2px' }}>7772712742</p>
                    <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>a.n Mila Nur Fitriya</p>
                  </div>
                </motion.div>
              )}

              {/* === QRIS PAYMENT === */}
              {paymentMethod === 'qris' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1rem' }}>
                  <div style={{ background: '#f0fdf4', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <QrCode size={18} style={{ color: '#16a34a' }} />
                      <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>Transfer via QRIS</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                      {qrisScanned
                        ? '✅ Pembayaran terdeteksi! Pesanan akan otomatis dikonfirmasi.'
                        : qrisLoading
                          ? 'Sedang membuat transaksi QRIS...'
                          : pakasirData
                            ? 'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda. Status pembayaran dicek otomatis.'
                            : 'Scan kode QR di bawah menggunakan aplikasi e-wallet atau mobile banking Anda.'}
                    </p>
                  </div>

                  {/* Loading State */}
                  {qrisLoading && (
                    <div style={{ background: '#fff', padding: '3rem 1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                      <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '1rem' }}>Membuat transaksi QRIS...</p>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                  )}

                  {/* QR Code Display */}
                  {!qrisLoading && (pakasirData || qrisUseFallback) && (
                    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e5e7eb', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
                      {/* Success overlay after scan/payment */}
                      <AnimatePresence>
                        {qrisScanned && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                              position: 'absolute', inset: 0, zIndex: 2,
                              background: 'rgba(255,255,255,0.95)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '12px'
                            }}
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                            >
                              <CheckCircle2 size={64} style={{ color: '#16a34a' }} />
                            </motion.div>
                            <motion.p
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              style={{ fontWeight: 700, color: '#166534', fontSize: '1.1rem', marginTop: '0.75rem', marginBottom: '0.25rem' }}
                            >
                              Pembayaran Berhasil!
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.6 }}
                              style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}
                            >
                              Mengkonfirmasi pesanan dalam {qrisCountdown} detik...
                            </motion.p>
                            {/* Circular progress */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              style={{ marginTop: '1rem' }}
                            >
                              <svg width="48" height="48" viewBox="0 0 48 48">
                                <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                <circle
                                  cx="24" cy="24" r="20" fill="none" stroke="#16a34a" strokeWidth="4"
                                  strokeDasharray={`${(2 * Math.PI * 20)}`}
                                  strokeDashoffset={`${(2 * Math.PI * 20) * (1 - qrisCountdown / 5)}`}
                                  strokeLinecap="round"
                                  style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                />
                                <text x="24" y="28" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#166534">{qrisCountdown}</text>
                              </svg>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Pakasir Mode: Show payment page via iframe or link */}
                      {pakasirData && pakasirData.payment_url && (
                        <div>
                          <iframe
                            src={`${pakasirData.payment_url}${pakasirData.payment_url.includes('?') ? '&' : '?'}qris_only=1`}
                            style={{
                              width: '100%', height: '400px', border: 'none', borderRadius: '8px',
                              background: '#fafafa'
                            }}
                            title="QRIS Payment"
                          />
                          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', animation: 'pulse 1.5s ease-in-out infinite' }} />
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Menunggu pembayaran... (auto-detect)</span>
                          </div>
                          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
                          <a
                            href={pakasirData.payment_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-gold)', textDecoration: 'underline' }}
                          >
                            Buka halaman pembayaran di tab baru ↗
                          </a>
                          {pakasirData.expired_at && (
                            <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.5rem' }}>
                              Berlaku hingga: {new Date(pakasirData.expired_at).toLocaleString('id-ID')}
                            </p>
                          )}
                          {pakasirData.fee > 0 && (
                            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                              Biaya layanan: Rp {pakasirData.fee.toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Pakasir Mode tanpa payment_url: show payment_number sebagai QR */}
                      {pakasirData && !pakasirData.payment_url && (
                        <div>
                          <QrisCode
                            amount={cartItems.reduce((acc, item) => acc + item.cake.harga, 0)}
                            size={200}
                          />
                          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', animation: 'pulse 1.5s ease-in-out infinite' }} />
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Menunggu pembayaran... (auto-detect)</span>
                          </div>
                          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
                        </div>
                      )}

                      {/* Fallback Mode: QR code lokal */}
                      {qrisUseFallback && (
                        <div>
                          <div style={{
                            background: '#fffbeb', padding: '0.5rem 0.75rem', borderRadius: '6px',
                            border: '1px solid #fde68a', marginBottom: '1rem', fontSize: '0.72rem', color: '#92400e'
                          }}>
                            ⚠️ Mode Simulasi — Pakasir belum dikonfigurasi
                          </div>
                          <QrisCode
                            amount={cartItems.reduce((acc, item) => acc + item.cake.harga, 0)}
                            size={200}
                          />
                        </div>
                      )}

                      {/* Supported e-wallets */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                        {['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'].map(wallet => (
                          <span key={wallet} style={{
                            fontSize: '0.65rem', fontWeight: 600, color: '#64748b',
                            background: '#f1f5f9', padding: '0.25rem 0.6rem', borderRadius: '20px'
                          }}>{wallet}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scan Button: only in fallback mode (simulasi) */}
                  {!qrisScanned && qrisUseFallback && !qrisLoading && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setQrisScanned(true);
                        setQrisCountdown(5);
                      }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.9rem', borderRadius: '10px', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white',
                        border: 'none', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em',
                        fontFamily: 'inherit',
                        boxShadow: '0 4px 14px rgba(22,163,74,0.3)', transition: 'all 0.2s'
                      }}
                    >
                      <QrCode size={18} />
                      SIMULASI: SAYA SUDAH SCAN QRIS
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* Confirm Button (only for cash & debit, QRIS auto-confirms after scan) */}
              {paymentMethod && paymentMethod !== 'qris' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <button
                    className="btn-submit"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    onClick={async () => {
                      try {
                        const totalPrice = cartItems.reduce((acc, item) => acc + item.cake.harga, 0);
                        const currentPaymentMethod = paymentMethod;
                        const currentCartItems = [...cartItems];
                        const response = await fetch('http://localhost:5000/checkout', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            username: user.username,
                            totalPrice: totalPrice,
                            cartItems: cartItems,
                            paymentMethod: currentPaymentMethod
                          })
                        });
                        const data = await response.json();
                        if (response.ok) {
                          const paymentLabels = { cash: 'Tunai (Cash)', debit: 'Transfer Debit (BCA)', qris: 'QRIS' };
                          const now = new Date();
                          setReceiptData({
                            transactionId: 'TMS-' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + String(now.getSeconds()).padStart(2,'0'),
                            date: now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                            time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            username: user.username,
                            paymentMethod: currentPaymentMethod,
                            paymentLabel: paymentLabels[currentPaymentMethod] || currentPaymentMethod,
                            items: currentCartItems,
                            totalPrice: totalPrice
                          });
                          setShowReceipt(true);
                          setCartItems([]);
                          setShowCheckout(false);
                          setPaymentMethod('');
                          resetQrisState();
                        } else {
                          alert(data.message || 'Gagal melakukan checkout.');
                        }
                      } catch (error) {
                        alert('Gagal menghubungi server. Pastikan backend menyala.');
                      }
                    }}
                  >
                    {paymentMethod === 'cash' ? 'KONFIRMASI BAYAR TUNAI' : 'SAYA SUDAH TRANSFER'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Money Detector Modal (triggered from cash payment) */}
      {showMoneyDetector && (
        <Suspense fallback={
          <div className="money-detector-overlay">
            <div style={{ color: 'white', textAlign: 'center' }}>
              <p>Memuat Detektor...</p>
            </div>
          </div>
        }>
          <MoneyDetector onClose={() => setShowMoneyDetector(false)} />
        </Suspense>
      )}

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && receiptData && (
          <ReceiptModal
            receiptData={receiptData}
            onClose={() => {
              setShowReceipt(false);
              setReceiptData(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* KONTEN UTAMA: Berbeda Berdasarkan Role */}
      {isLoggedIn && role === 'admin' ? (
        <main style={{ padding: '80px 5% 2rem', background: '#f4f4f4', minHeight: '100vh' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ borderBottom: '2px solid #eee', marginBottom: '2rem', paddingBottom: '1rem' }}>
              <h1 style={{ fontSize: '2rem', color: '#333' }}>Dashboard Admin</h1>
              <p style={{ color: '#666' }}>Selamat datang, {user.username}. Kelola katalog produk Anda di sini.</p>
            </div>

            <AdminPanel
              produkKue={produkKue}
              handleChange={handleChange}
              saveChanges={saveChanges}
            />
          </div>
        </main>
      ) : (
        <>
          {/* Hero Section */}
          <section className="hero">
            <img
              src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=2000&auto=format&fit=crop"
              alt="Clairmont Hero"
              className="hero-img"
            />
            <div className="hero-overlay"></div>

            <button className="hero-slider-btn hero-slider-left">
              <ChevronLeft size={40} strokeWidth={1} />
            </button>
            <button className="hero-slider-btn hero-slider-right">
              <ChevronRight size={40} strokeWidth={1} />
            </button>

            <div className="hero-cta">
              <button onClick={scrollToProducts} className="btn-hero">
                TEMUKAN LEBIH BANYAK
              </button>
            </div>
          </section>

          {/* About Section */}
          <section className="about">
            <h2>Kenali kami lebih dekat..</h2>
            <p className="about-text">
              Threemi Sweet menghadirkan berbagai pilihan kue yang dibuat khusus sesuai keinginan pelanggan. Dengan mengutamakan kualitas bahan, cita rasa, dan desain yang menarik.
            </p>

            <AnimatePresence>
              {!isAboutExpanded ? (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAboutExpanded(true)}
                  className="btn-read-more"
                >
                  BACA SELENGKAPNYA
                  <ChevronDown size={16} strokeWidth={1.5} className="icon-down" />
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="about-text" style={{ marginTop: '1rem' }}>
                    Threemi Sweet berkomitmen untuk menciptakan momen spesial melalui setiap kue yang dibuat, baik untuk ulang tahun, pernikahan, maupun berbagai perayaan lainnya.
                  </p>
                  <button
                    onClick={() => setIsAboutExpanded(false)}
                    className="btn-read-more"
                    style={{ marginTop: '2rem' }}
                  >
                    TUTUP
                    <ChevronDown size={16} strokeWidth={1.5} className="icon-down" style={{ transform: 'rotate(180deg)' }} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Product Grid */}
          <main className="products-section" ref={productsRef}>
            <div className="filter-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`tab ${filter === cat ? 'active' : ''}`}
                >
                  {cat}
                  {filter === cat && (
                    <motion.div layoutId="tab-underline" className="tab-underline" />
                  )}
                </button>
              ))}
            </div>

            <div className="products-groups" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {displayedGroups.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'normal' }}>Produk tidak ditemukan. Coba kata kunci lain.</h3>
                </div>
              ) : (
                displayedGroups.map((group) => (
                  <div key={group.title} className="category-section">
                    <h3 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '2rem', color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                      {group.title}
                    </h3>
                    <div className="grid-products">
                      {group.cakes.map((kue) => (
                        <ProductCard key={kue.id} kue={kue} onAddToCart={(item) => setCartItems(prev => [...prev, item])} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <h3>THREEMI SWEET</h3>
          <p className="desc" style={{ marginBottom: '1rem' }}>
            Jl. Mekar 1, Kp Gantungan No.8, RT.02/RW.22, Pasirlayung, Kec. Cimenyan, Kabupaten Bandung, Jawa Barat 40197
          </p>
          <a href="https://www.google.com/maps?q=Threemisweet+by+Mila,+Jl.+Mekar+1,+Kp+Gantungan+No.8,+RT.02/RW.22,+Pasirlayung,+Kec.+Cimenyan,+Kabupaten+Bandung,+Jawa+Barat+40197&ftid=0x2e68e737ee00929f:0x7d31bb6442f3edb1&entry=gps&lucs=,94242511,47071704,47069508,94218641,94203019,47084304,94208458,94208447&g_ep=CAISEjI0LjUwLjAuNzA0NDI3ODkxMBgAINeCAypILDk0MjQyNTExLDQ3MDcxNzA0LDQ3MDY5NTA4LDk0MjE4NjQxLDk0MjAzMDE5LDQ3MDg0MzA0LDk0MjA4NDU4LDk0MjA4NDQ3QgJJRA%3D%3D&g_st=ic" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--color-gold)', fontSize: '0.875rem', marginBottom: '3rem', fontWeight: 600 }}>
            Lihat di Google Maps
          </a>

          <div className="newsletter">
            <input type="email" placeholder="Your email address" />
            <button>OK</button>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} CLAIRMONT PATISSERIE.</p>
            <div className="footer-links">
              <span>INSTAGRAM</span>
              <span>FACEBOOK</span>
              <span>FAQ</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Buttons */}
      <AnimatePresence>
        {showTopButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <button onClick={scrollToTop} className="btn-floating-top">
              <ArrowUp size={20} strokeWidth={1.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <a href="https://wa.me/62895404957926" target="_blank" rel="noreferrer" className="btn-whatsapp">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.99 2C6.47 2 2 6.48 2 12c0 1.76.45 3.42 1.25 4.89L2 22l5.22-1.22C8.65 21.57 10.3 22 11.99 22 17.51 22 22 17.52 22 12S17.51 2 11.99 2zm0 18.25c-1.5 0-2.95-.38-4.25-1.07l-.3-.16-3.16.74.75-3.08-.18-.3C4.19 14.99 3.75 13.53 3.75 12c0-4.55 3.7-8.25 8.24-8.25 4.54 0 8.25 3.71 8.25 8.25s-3.71 8.25-8.25 8.25zm4.56-6.19c-.25-.13-1.48-.73-1.71-.82-.23-.08-.4-.13-.56.13-.17.25-.65.82-.8 1-.14.17-.29.19-.54.06-1.54-.78-2.67-1.42-3.69-2.78-.11-.15-.01-.23.11-.35.12-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.02 2.6c.13.17 1.77 2.7 4.29 3.78 1.4.6 2.05.65 2.8.55.84-.11 1.48-.6 1.69-1.18.21-.58.21-1.07.15-1.18-.07-.11-.23-.17-.48-.3z" />
        </svg>
      </a>
    </>
  );
}

export default App;
