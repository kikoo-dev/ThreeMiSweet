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

  const { order_id, amount } = req.body

  if (!order_id || !amount) {
    return res.status(400).json({ status: 'error', message: 'order_id dan amount diperlukan' })
  }

  const slug = process.env.PAKASIR_SLUG
  const apikey = process.env.PAKASIR_API_KEY

  if (!slug || !apikey || slug === 'your-project-slug' || apikey === 'your-api-key') {
    return res.status(503).json({ status: 'error', message: 'Pakasir belum dikonfigurasi' })
  }

  try {
    const pakasir = new Pakasir({ slug, apikey })

    const detail = await pakasir.detailPayment(order_id, amount)

    if (detail.status === 'completed') {
      await supabase
        .from('orders')
        .update({ status: 'Completed' })
        .eq('pakasir_order_id', order_id)
    }

    return res.status(200).json({
      status: 'success',
      data: {
        order_id: detail.order_id || order_id,
        amount: detail.amount || amount,
        payment_status: detail.status || 'pending',
        completed_at: detail.completed_at || null
      }
    })
  } catch (err) {
    console.error('❌ QRIS Status Error:', err.message || err)
    return res.status(500).json({
      status: 'error',
      message: 'Gagal cek status: ' + (err.message || 'Unknown error')
    })
  }
}
