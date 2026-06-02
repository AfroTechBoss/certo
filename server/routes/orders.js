const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { sendOrderConfirmation, sendStatusUpdate, sendCancellationEmail, sendPaymentPendingEmail, sendPaymentPendingNairaEmail, sendNewOrderNotification, sendWhatsAppNotification } = require('../email');
const { adminAuth } = require('../adminAuth');
const logAdminAction = require('../logAdminAction');
const logOrderEvent  = require('../logAdminAction'); // same helper, aliased for clarity

function generateOrderId() {
  const now  = new Date();
  const mmdd = String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `CRT-${mmdd}${now.getFullYear().toString().slice(2)}-${rand}`;
}

// POST /api/orders  (create new order)
router.post('/', async (req, res) => {
  const {
    customer_name, customer_email, customer_phone,
    address, state,
    product_id, product_name, product_subtitle, product_image_url, apple_url,
    applecare,
    qty,
    usd_price, ngn_price, forex_rate,
    initial_status,
    payment_method,
    items,
    coupon_code, coupon_discount,
    variant_id, variant_color, variant_storage, variant_color_hex,
  } = req.body;

  if (!customer_name || !customer_email || !customer_phone || !address || !product_name || !usd_price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Only allow 'Payment Pending' as an explicit override (e.g. MoonPay/crypto orders awaiting confirmation)
  const orderStatus = initial_status === 'Payment Pending' ? 'Payment Pending' : 'Order Confirmed';

  const id = generateOrderId();

  try {
    const now = new Date().toISOString();
    const { rows } = await pool.queryR(`
      INSERT INTO orders (
        id, customer_name, customer_email, customer_phone,
        address, state,
        product_id, product_name, product_subtitle, product_image_url, apple_url,
        applecare, qty, usd_price, ngn_price, forex_rate, status, payment_method, items,
        coupon_code, coupon_discount,
        variant_id, variant_color, variant_storage, variant_color_hex,
        status_timeline
      ) VALUES (
        $1,$2,$3,$4,
        $5,$6,
        $7,$8,$9,$10,$11,
        $12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,
        $22,$23,$24,$25,
        $26::jsonb
      ) RETURNING *
    `, [
      id, customer_name, customer_email, customer_phone,
      address, state,
      product_id, product_name, product_subtitle, product_image_url, apple_url,
      applecare || 'none', qty || 1, usd_price, ngn_price, forex_rate, orderStatus,
      payment_method || 'Flutterwave',
      JSON.stringify(Array.isArray(items) ? items : []),
      coupon_code || null, coupon_discount || 0,
      variant_id || null, variant_color || null, variant_storage || null, variant_color_hex || null,
      JSON.stringify([{ status: orderStatus, timestamp: now }]),
    ]);

    const order = rows[0];

    // Await coupon increment before responding so it isn't dropped by Vercel on function exit
    if (coupon_code) {
      await pool.queryR('UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = UPPER($1)', [coupon_code])
        .catch(err => console.error('Coupon increment failed:', err.message));
    }

    // Await confirmation email before responding — fire-and-forget is killed by Vercel on function exit
    if (orderStatus !== 'Payment Pending') {
      try {
        await sendOrderConfirmation(order);
        await pool.queryR('UPDATE orders SET email_sent = true WHERE id = $1', [id]);
      } catch (emailErr) {
        console.error('Email send failed for', id, ':', emailErr.message);
        // Don't fail the order — email error is non-fatal
      }
    } else {
      // Pending payment — email varies by payment method
      const isWhatsApp = (order.payment_method || '').includes('WhatsApp');
      const pendingEmailFn = isWhatsApp ? sendPaymentPendingEmail : sendPaymentPendingNairaEmail;
      try {
        await pendingEmailFn(order);
        await pool.queryR('UPDATE orders SET email_sent = true WHERE id = $1', [id]);
      } catch (emailErr) {
        console.error('Pending payment email failed for', id, ':', emailErr.message);
        // Non-fatal — order still created
      }
    }

    // Internal notifications — both must be awaited so Vercel doesn't kill the function before they complete
    await sendNewOrderNotification(order).catch(err => console.error('[notify] new order email failed:', err.message));

    const waText = `🛍️ New Certo order!\n\nOrder: ${order.id}\nCustomer: ${order.customer_name}\nPhone: ${order.customer_phone}\nProduct: ${order.product_name}${order.product_subtitle ? ' ' + order.product_subtitle : ''}\nAmount: $${Number(order.usd_price).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD\nPayment: ${order.payment_method}\nStatus: ${order.status}`;
    await sendWhatsAppNotification(waText).catch(err => console.error('[notify] Telegram notification failed:', err.message));

    // Log new order (System actor so it stands out from admin actions)
    await logOrderEvent('System', 'New order placed', `${id} — ${customer_name} — ${product_name}${product_subtitle ? ' ' + product_subtitle : ''} — $${usd_price}`);

    res.status(201).json({ id: order.id, order });
  } catch (err) {
    console.error('POST /orders:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders  (admin — all orders)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, flagged, search, timeframe, limit = 200 } = req.query;
    let q = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      if (status === 'open') {
        q += ` AND status NOT IN ('Delivered', 'Cancelled', 'Payment Pending')`;
      } else {
        params.push(status);
        q += ` AND status = $${params.length}`;
      }
    }
    if (flagged === 'true') {
      q += ' AND flagged = true';
    }
    if (search) {
      params.push(`%${search}%`);
      const n = params.length;
      q += ` AND (id ILIKE $${n} OR customer_name ILIKE $${n} OR customer_phone ILIKE $${n} OR address ILIKE $${n} OR product_name ILIKE $${n})`;
    }
    if (timeframe && timeframe !== 'all') {
      const intervals = {
        today:  '1 day',
        week:   '7 days',
        month:  '30 days',
        year:   '365 days',
      };
      if (intervals[timeframe]) {
        q += ` AND created_at >= NOW() - INTERVAL '${intervals[timeframe]}'`;
      }
    }

    q += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const { rows } = await pool.queryR(q, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/stats  (admin revenue stats)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const { timeframe } = req.query;
    let where = '1=1';
    if (timeframe && timeframe !== 'all') {
      const intervals = { today: '1 day', week: '7 days', month: '30 days', year: '365 days' };
      if (intervals[timeframe]) where = `created_at >= NOW() - INTERVAL '${intervals[timeframe]}'`;
    }

    const { rows } = await pool.queryR(`
      SELECT
        COUNT(*)::int                                    AS total_orders,
        COUNT(*) FILTER (WHERE status != 'Delivered' AND status != 'Cancelled')::int AS active_orders,
        COUNT(*) FILTER (WHERE status = 'Delivered')::int AS delivered,
        COUNT(*) FILTER (WHERE flagged = true)::int      AS flagged,
        COALESCE(SUM(usd_price), 0)::numeric             AS revenue_usd,
        COALESCE(SUM(ngn_price), 0)::numeric             AS revenue_ngn,
        COALESCE(AVG(usd_price), 0)::numeric             AS avg_order_usd,
        COALESCE(AVG(ngn_price), 0)::numeric             AS avg_order_ngn
      FROM orders WHERE ${where}
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /orders/stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/orders/:id  (public — order tracking)
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `SELECT id, customer_name, product_name, product_subtitle, product_image_url,
              status, created_at, updated_at, applecare, qty, items,
              variant_color, variant_storage, variant_color_hex,
              COALESCE(status_timeline, '[]'::jsonb) AS status_timeline
       FROM orders WHERE id = $1`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /orders/:id:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders/:id/resend-email  (admin — resend confirmation email)
router.post('/:id/resend-email', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = rows[0];

    // Defensively parse `items` — Neon returns JSONB as objects, but TEXT columns
    // return raw strings; normalise both so the email template never throws
    if (typeof order.items === 'string') {
      try { order.items = JSON.parse(order.items); } catch(_) { order.items = []; }
    }
    if (!Array.isArray(order.items)) order.items = [];

    await sendOrderConfirmation(order);
    await pool.queryR('UPDATE orders SET email_sent = true, updated_at = NOW() WHERE id = $1', [req.params.id]);
    await logAdminAction(req.adminName, 'Resent confirmation email', `Order ${req.params.id} → ${order.customer_email}`);
    res.json({ ok: true, message: `Confirmation email sent to ${order.customer_email}` });
  } catch (err) {
    console.error('Resend email failed for', req.params.id, ':', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
});

// PATCH /api/orders/:id  (admin — update status, flag, notes)
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['status', 'flagged', 'flag_reason', 'notes', 'admin_hidden'];
    const fields  = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    // Fetch previous status before update (to detect status changes)
    const prevResult = await pool.queryR('SELECT status FROM orders WHERE id = $1', [req.params.id]);
    const prevStatus = prevResult.rows[0]?.status;

    let setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map(f => req.body[f]);

    // When status actually changes, append a timestamped entry to status_timeline
    if (req.body.status && req.body.status !== prevStatus) {
      values.push(req.body.status);
      setClauses += `, status_timeline = COALESCE(status_timeline, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('status', $${values.length}::text, 'timestamp', NOW()::text))`;
    }

    values.push(req.params.id);

    const { rows } = await pool.queryR(
      `UPDATE orders SET ${setClauses}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values,
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });

    const updated = rows[0];

    // Log the admin action (awaited before responding so Vercel doesn't kill it)
    if (req.body.status && req.body.status !== prevStatus) {
      await logAdminAction(req.adminName, 'Updated order status', `Order ${updated.id}: ${prevStatus} → ${req.body.status}`);
    } else if (req.body.flagged !== undefined) {
      const action = req.body.flagged ? 'Flagged order' : 'Unflagged order';
      await logAdminAction(req.adminName, action, `Order ${updated.id}${req.body.flag_reason ? ': ' + req.body.flag_reason : ''}`);
    } else if (req.body.notes !== undefined) {
      await logAdminAction(req.adminName, 'Updated order notes', `Order ${updated.id}`);
    } else if (req.body.admin_hidden !== undefined) {
      const action = req.body.admin_hidden ? 'Deleted order' : 'Restored hidden order';
      await logAdminAction(req.adminName, action, `Order ${updated.id}`);
    }

    // Await emails before responding — on Vercel serverless, fire-and-forget is killed when
    // the response closes. Each email is awaited individually but errors never cause a 500.
    const sendEmail = async (label, fn) => {
      try {
        await fn();
      } catch (err) {
        console.error(`[email] ${label} failed for ${updated.id}:`, err.message);
      }
    };

    // If a pending-payment order just got confirmed, send the confirmation email now
    if (req.body.status === 'Order Confirmed' && prevStatus === 'Payment Pending') {
      await sendEmail('confirmation', async () => {
        await sendOrderConfirmation(updated);
        await pool.queryR('UPDATE orders SET email_sent = true WHERE id = $1', [updated.id]);
      });
    }

    // Send status-change email for key milestones
    const emailStatuses = ['Arrived in Nigeria', 'Out for Delivery', 'Delivered'];
    if (req.body.status && req.body.status !== prevStatus && emailStatuses.includes(req.body.status)) {
      await sendEmail('status update', () => sendStatusUpdate(updated));
    }

    // Send cancellation email when an order is cancelled
    if (req.body.status === 'Cancelled' && prevStatus !== 'Cancelled') {
      console.log(`[email] Sending cancellation email for ${updated.id} to ${updated.customer_email}`);
      await sendEmail('cancellation', () => sendCancellationEmail(updated));
    }

    res.json(updated);
  } catch (err) {
    console.error('PATCH /orders/:id:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;
