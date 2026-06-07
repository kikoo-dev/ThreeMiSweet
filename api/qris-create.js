import { createClient } from '@supabase/supabase-js'
import { Pakasir } from 'pakasir-sdk'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  const { username, cartItems, totalPrice } = req.body

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Cart kosong' })
  }

  const slug = process.env.PAKASIR_SLUG
  const apikey = process.env.PAKASIR_API_KEY

  if (!slug || slug === 'your-project-slug' || !apikey || apikey === 'your-api-key') {
    return res.status(503).json({
      status: 'error',
      message: 'Pakasir belum dikonfigurasi. Isi PAKASIR_SLUG dan PAKASIR_API_KEY di Vercel env.',
      useFallback: true
    })
  }

  try {
    const pakasir = new Pakasir({ slug, apikey })

    const orderId = `TMS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    const amount = Math.max(totalPrice, 500)

    const payment = await pakasir.createPayment('qris', orderId, amount)

    const { error: dbError } = await supabase
      .from('orders')
      .insert([{
        username: username || 'Guest',
        total_price: totalPrice,
        payment_method: 'qris',
        pakasir_order_id: orderId,
        status: 'Pending'
      }])

    if (!dbError && cartItems.length > 0) {
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('pakasir_order_id', orderId)
        .single()

      if (order) {
        const items = cartItems.map(item => ({
          order_id: order.id,
          cake_name: item.cake.nama,
          flavor: item.flavor || '',
          cream: item.cream || '',
          filling: item.filling || '',
          price: item.cake.harga
        }))
        await supabase.from('order_items').insert(items)
      }
    }

    return res.status(200).json({
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
    })
  } catch (err) {
    console.error('❌ QRIS Create Error:', err.message || err)
    return res.status(500).json({
      status: 'error',
      message: 'Gagal membuat transaksi QRIS: ' + (err.message || 'Unknown error')
    })
  }
}
