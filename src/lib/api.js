import { supabase } from './supabase'

// ─── AUTH ─────────────────────────────────────────────
export async function signUp(usernameOrEmail, password) {
  // Jika input sudah mengandung '@', gunakan langsung sebagai email.
  // Jika hanya username biasa, konversikan ke domain tiruan .com.
  const targetEmail = usernameOrEmail.includes('@')
    ? usernameOrEmail.trim()
    : `${usernameOrEmail.trim()}@threemisweet.com`;

  // Ambil teks sebelum karakter '@' untuk dijadikan data username dasar
  const cleanUsername = usernameOrEmail.includes('@')
    ? usernameOrEmail.split('@')[0].trim()
    : usernameOrEmail.trim();

  const { data, error } = await supabase.auth.signUp({
    email: targetEmail,
    password,
    options: { data: { username: cleanUsername } }
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signIn(usernameOrEmail, password) {
  // Cek apakah user mengetik email penuh (@gmail.com) atau hanya username biasa.
  const targetEmail = usernameOrEmail.includes('@')
    ? usernameOrEmail.trim()
    : `${usernameOrEmail.trim()}@threemisweet.com`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: targetEmail,
    password
  })
  if (error) throw new Error(error.message)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', data.user.id)
    .maybeSingle()

  const fallbackUsername = usernameOrEmail.includes('@')
    ? usernameOrEmail.split('@')[0]
    : usernameOrEmail;

  let role = 'buyer';
  if (profile?.role) {
    role = profile.role;
  } else if (fallbackUsername === 'admin') {
    role = 'admin';
  }

  if (!profile) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      username: fallbackUsername,
      role
    })
  }

  return {
    user: {
      id: data.user.id,
      username: profile?.username || fallbackUsername,
      role
    }
  }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ─── PRODUCTS ─────────────────────────────────────────
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true })
  if (error) throw error
  return (data || []).map(p => ({
    ...p,
    tags: p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  }))
}

export async function createProduct(product) {
  const adminCheck = await checkAdmin()
  if (!adminCheck) throw new Error('Unauthorized: admin only')

  const { data, error } = await supabase
    .from('products')
    .insert([{
      nama: product.nama,
      kategori: product.kategori || 'Whole Cake',
      harga: Number(product.harga),
      img: product.img || '',
      tags: product.tags || ''
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduct(id, product) {
  const adminCheck = await checkAdmin()
  if (!adminCheck) throw new Error('Unauthorized: admin only')

  const { data, error } = await supabase
    .from('products')
    .update({
      nama: product.nama,
      kategori: product.kategori,
      harga: Number(product.harga),
      img: product.img,
      tags: product.tags || ''
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const adminCheck = await checkAdmin()
  if (!adminCheck) throw new Error('Unauthorized: admin only')

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── STORAGE (Image Upload) ─────────────────────────
export async function uploadProductImage(file) {
  const ext = file.name.split('.').pop()
  const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file)

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

// ─── ORDERS / CHECKOUT ──────────────────────────────
export async function createOrder({ username, cartItems, totalPrice, paymentMethod }) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      username: username || 'Guest',
      total_price: totalPrice,
      payment_method: paymentMethod,
      status: 'Completed'
    }])
    .select()
    .single()
  if (orderError) throw orderError

  const items = cartItems.map(item => ({
    order_id: order.id,
    cake_name: item.cake.nama,
    flavor: item.flavor || '',
    cream: item.cream || '',
    filling: item.filling || '',
    price: item.cake.harga
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(items)
  if (itemsError) throw itemsError

  return order
}

// ─── QRIS (via Vercel Serverless Function) ────────────
export async function createQrisTransaction({ username, cartItems, totalPrice }) {
  const res = await fetch('/api/qris-create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, cartItems, totalPrice })
  })
  return res.json()
}

export async function checkQrisStatus(order_id, amount) {
  const res = await fetch('/api/qris-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id, amount })
  })
  return res.json()
}

// ─── CONTRACTS ──────────────────────────────────────
export async function createContract(data) {
  const { error } = await supabase
    .from('customer_contracts')
    .insert([{
      nama_pelanggan: data.nama_pelanggan,
      nomor_telepon: data.nomor_telepon,
      username: data.username || null,
      agreement_accepted: true,
      agreement_text: data.agreement_text || 'Menyetujui syarat dan ketentuan penggunaan website Threemi Sweet',
      ip_address: data.ip_address || 'unknown'
    }])
  if (error) throw error
}

export async function getContracts() {
  const { data, error } = await supabase
    .from('customer_contracts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateContractStatus(id, status) {
  const { error } = await supabase
    .from('customer_contracts')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function deleteContract(id) {
  const { error } = await supabase
    .from('customer_contracts')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── HELPERS ─────────────────────────────────────────
async function checkAdmin() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return data?.role === 'admin'
}

export async function checkUserRole() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isLoggedIn: false, role: 'buyer', username: '' }

  const { data } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', user.id)
    .single()

  return {
    isLoggedIn: true,
    username: data?.username || user.email?.split('@')[0] || '',
    role: data?.role || 'buyer'
  }
}
