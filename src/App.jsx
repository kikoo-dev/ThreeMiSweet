import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, User, Menu, Globe, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, X } from 'lucide-react';
import './index.css';

const produkKue = [
  { id: 1, nama: "Double Chocolate Cake", kategori: "Whole Cake", harga: 385000, img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop", tags: ["Best Seller"] },
  { id: 2, nama: "Red Velvet Fantasy", kategori: "Whole Cake", harga: 350000, img: "https://images.unsplash.com/photo-1616541823729-00a70231cfb5?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 3, nama: "Tiramisu Classic", kategori: "Whole Cake", harga: 395000, img: "https://images.unsplash.com/photo-1571115177098-24de4cc7c4be?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 4, nama: "Strawberry Shortcake", kategori: "Whole Cake", harga: 375000, img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=600&auto=format&fit=crop", tags: ["Best Seller"] },
  { id: 5, nama: "Lotus Biscoff Cheesecake", kategori: "Cheesecake", harga: 420000, img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 6, nama: "Matcha Opera", kategori: "Premium Cake", harga: 410000, img: "https://plus.unsplash.com/premium_photo-1675716172607-b248eb3fb449?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 7, nama: "Mango Mousse Cake", kategori: "Seasonal", harga: 345000, img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 8, nama: "Choco Berry Layer", kategori: "Whole Cake", harga: 380000, img: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=600&auto=format&fit=crop", tags: ["Best Seller"] },
  { id: 9, nama: "Cake Bogel", kategori: "Bento Cake", harga: 95000, img: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 10, nama: "Bento Cake", kategori: "Bento Cake", harga: 85000, img: "https://images.unsplash.com/photo-1557925923-33b251d5b4d6?q=80&w=600&auto=format&fit=crop", tags: ["Best Seller"] },
  { id: 11, nama: "Korean Cake", kategori: "Custom Cake", harga: 150000, img: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=600&auto=format&fit=crop", tags: ["Best Seller"] },
  { id: 12, nama: "Whole Cake", kategori: "Whole Cake", harga: 300000, img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 13, nama: "Big Whole Cake", kategori: "Whole Cake", harga: 450000, img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 14, nama: "Extra Tall Cake", kategori: "Custom Cake", harga: 550000, img: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 15, nama: "2 Tier Cake", kategori: "Custom Cake", harga: 850000, img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 16, nama: "3 Tier Cake", kategori: "Custom Cake", harga: 1250000, img: "https://images.unsplash.com/photo-1505977404378-3a0e28bec6cb?q=80&w=600&auto=format&fit=crop", tags: [] },
  { id: 17, nama: "Burnt Cheesecake", kategori: "Cheesecake", harga: 250000, img: "https://images.unsplash.com/photo-1525203135335-7485e13bef18?q=80&w=600&auto=format&fit=crop", tags: ["Best Seller"] },
  { id: 18, nama: "Mochi Burnt Cheesecake", kategori: "Cheesecake", harga: 280000, img: "https://images.unsplash.com/photo-1605807646983-377bc5a76493?q=80&w=600&auto=format&fit=crop", tags: [] },
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

function App() {
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
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  const productsRef = useRef(null);

  const categories = ["SEMUA PRODUK", "PRODUK TERLARIS", "WHOLE CAKE", "CHEESECAKE", "BENTO CAKE", "CUSTOM CAKE"];
  const filteredCakes = produkKue.filter(k => k.nama.toLowerCase().includes(searchQuery.toLowerCase()));

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
        body: JSON.stringify({ username: loginInput, password: passwordInput })
      });
      const data = await response.json();

      if (response.ok) {
        if (isRegisterMode) {
          setAuthSuccess('Registrasi berhasil! Silakan login.');
          setIsRegisterMode(false);
          setPasswordInput('');
        } else {
          setUser({ username: data.user.username });
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

            <div className="user-menu" onClick={() => !isLoggedIn && setShowLoginModal(true)}>
              <button className="icon-btn">
                <User size={20} strokeWidth={1.5} />
              </button>
              {isLoggedIn && (
                <div className="dropdown">
                  <span className="dropdown-name">{user.username}</span>
                  <span className="dropdown-logout" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>LOGOUT</span>
                </div>
              )}
            </div>

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

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="modal-overlay" style={{ zIndex: 100 }}>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="modal-box"
              style={{ width: '450px', maxWidth: '90%' }}
            >
              <button onClick={() => setShowCheckout(false)} className="btn-close">
                <X size={20} strokeWidth={1.5} />
              </button>

              <h2 className="modal-title">Checkout & Pembayaran</h2>
              <p className="modal-subtitle" style={{ marginBottom: '1.5rem' }}>
                Selesaikan pembayaran Anda untuk memproses pesanan.
              </p>

              <div style={{ background: '#f8f8f8', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', border: '1px dashed #ccc' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-gold)', fontSize: '1.4rem' }}>Bank BCA</h3>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 'bold', letterSpacing: '2px' }}>7772712742</p>
                <p style={{ margin: 0, color: '#555', fontSize: '1rem' }}>a.n Mila Nur Fitriya</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem' }}>
                <h4 style={{ margin: 0, color: '#333' }}>Total Pembayaran:</h4>
                <h4 style={{ margin: 0, color: '#d9232d', fontSize: '1.4rem' }}>Rp {cartItems.reduce((acc, item) => acc + item.cake.harga, 0).toLocaleString('id-ID')}</h4>
              </div>

              <button
                className="btn-submit"
                style={{ width: '100%' }}
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:5000/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        username: user.username,
                        totalPrice: cartItems.reduce((acc, item) => acc + item.cake.harga, 0),
                        cartItems: cartItems
                      })
                    });
                    const data = await response.json();
                    if (response.ok) {
                      alert('Pembayaran berhasil dikonfirmasi dan pesanan sedang diproses!');
                      setCartItems([]);
                      setShowCheckout(false);
                    } else {
                      alert(data.message || 'Gagal melakukan checkout.');
                    }
                  } catch (error) {
                    alert('Gagal menghubungi server. Pastikan backend menyala.');
                  }
                }}
              >
                SAYA SUDAH TRANSFER
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


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
