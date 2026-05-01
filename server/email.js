require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
  logger: true,
  debug:  true,
});

transporter.verify((err) => {
  if (err) console.error('[email] SMTP connection failed:', err.message);
  else console.log('[email] SMTP ready on', process.env.SMTP_HOST);
});

const WA_NUM = process.env.WHATSAPP_NUMBER || '2348000000000';
const SITE   = process.env.FRONTEND_URL    || 'https://certo.ng';

function orderConfirmationHtml(order) {
  const {
    id, customer_name, product_name, product_subtitle,
    usd_price, ngn_price, forex_rate,
    address, state, applecare, qty,
  } = order;

  const fmtNgn = (n) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  const fmtUsd = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const trackUrl = `${SITE}/track/${id}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Order Confirmed – ${id}</title>
<style>
  body { margin:0; padding:0; background:#f2f0ec; font-family:Inter,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
  a { color:#d97757; text-decoration:none; }
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0ec;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf9f7;border-radius:20px;overflow:hidden;border:1px solid #e5e2db;">

  <!-- Header -->
  <tr>
    <td style="background:#d97757;padding:32px 40px;text-align:center;">
      <div style="font-family:Georgia,serif;font-weight:700;font-size:28px;color:#fff;letter-spacing:-0.02em;">Certo</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Genuine Apple Products, Delivered to Nigeria</div>
    </td>
  </tr>

  <!-- Hero -->
  <tr>
    <td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #e5e2db;">
      <div style="width:56px;height:56px;border-radius:50%;background:#d9f7e8;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">✓</span>
      </div>
      <h1 style="font-size:24px;font-weight:700;color:#1a1714;margin:0 0 8px;letter-spacing:-0.02em;">Order Confirmed</h1>
      <p style="font-size:15px;color:#706b60;margin:0;line-height:1.6;">
        Hi ${customer_name}, your order has been received and payment confirmed.<br/>We're starting procurement within 24 hours.
      </p>
    </td>
  </tr>

  <!-- Order ID -->
  <tr>
    <td style="padding:28px 40px;text-align:center;border-bottom:1px solid #e5e2db;background:#f2f0ec;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#706b60;margin-bottom:8px;">Your Order ID</div>
      <div style="font-size:30px;font-weight:700;color:#1a1714;letter-spacing:0.04em;">${id}</div>
      <div style="font-size:13px;color:#706b60;margin-top:8px;">Save this — you'll use it to track your order</div>
    </td>
  </tr>

  <!-- Product -->
  <tr>
    <td style="padding:28px 40px;border-bottom:1px solid #e5e2db;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#706b60;margin-bottom:16px;">What you ordered</div>
      <div style="font-size:18px;font-weight:700;color:#1a1714;margin-bottom:4px;">${product_name}</div>
      ${product_subtitle ? `<div style="font-size:14px;color:#706b60;margin-bottom:16px;">${product_subtitle}</div>` : ''}
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e2db;font-size:14px;color:#706b60;">Quantity</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e2db;font-size:14px;color:#1a1714;text-align:right;font-weight:600;">${qty || 1}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e2db;font-size:14px;color:#706b60;">USD Price</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e2db;font-size:14px;color:#1a1714;text-align:right;font-weight:600;">${fmtUsd(usd_price)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e2db;font-size:14px;color:#706b60;">Forex Rate (locked)</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e2db;font-size:14px;color:#1a1714;text-align:right;font-weight:600;">₦${Number(forex_rate).toLocaleString()}/USD</td>
        </tr>
        ${applecare && applecare !== 'none' ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e2db;font-size:14px;color:#706b60;">AppleCare Coverage</td><td style="padding:10px 0;border-bottom:1px solid #e5e2db;font-size:14px;color:#d97757;text-align:right;font-weight:600;">${applecare}</td></tr>` : ''}
        <tr>
          <td style="padding:14px 0 0;font-size:16px;font-weight:700;color:#1a1714;">Total Paid</td>
          <td style="padding:14px 0 0;font-size:20px;font-weight:700;color:#d97757;text-align:right;">${fmtNgn(ngn_price)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Delivery -->
  <tr>
    <td style="padding:28px 40px;border-bottom:1px solid #e5e2db;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#706b60;margin-bottom:12px;">Delivery address</div>
      <div style="font-size:15px;color:#1a1714;line-height:1.6;">${address}${state ? `, ${state}` : ''}</div>
    </td>
  </tr>

  <!-- Track CTA -->
  <tr>
    <td style="padding:32px 40px;text-align:center;border-bottom:1px solid #e5e2db;">
      <div style="font-size:15px;color:#706b60;margin-bottom:20px;line-height:1.6;">Track your order in real time — no login needed.</div>
      <a href="${trackUrl}" style="display:inline-block;background:#d97757;color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">Track My Order →</a>
      <div style="font-size:13px;color:#706b60;margin-top:12px;">${trackUrl}</div>
    </td>
  </tr>

  <!-- What happens next -->
  <tr>
    <td style="padding:28px 40px;border-bottom:1px solid #e5e2db;background:#f2f0ec;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#706b60;margin-bottom:16px;">What happens next</div>
      ${[
        ['Within 2 hours', 'You\'ll receive a WhatsApp message confirming receipt with your order details.'],
        ['Within 24 hours', 'We purchase your exact device from Apple.com US and notify you.'],
        ['10–20 business days', 'Your device ships to Nigeria. All customs and duties are covered — no surprise charges.'],
        ['On delivery', 'Inspect your package before signing. If anything looks wrong, refuse it and contact us immediately.'],
      ].map(([t, d]) => `
        <div style="display:flex;gap:16px;margin-bottom:16px;">
          <div style="width:10px;height:10px;border-radius:50%;background:#d97757;margin-top:5px;flex-shrink:0;"></div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#1a1714;margin-bottom:2px;">${t}</div>
            <div style="font-size:14px;color:#706b60;line-height:1.6;">${d}</div>
          </div>
        </div>
      `).join('')}
    </td>
  </tr>

  <!-- Contact -->
  <tr>
    <td style="padding:28px 40px;border-bottom:1px solid #e5e2db;">
      <div style="font-size:15px;color:#1a1714;font-weight:700;margin-bottom:12px;">Need help?</div>
      <p style="font-size:14px;color:#706b60;line-height:1.7;margin:0 0 12px;">
        Reply to this email or reach us through either of these channels:
      </p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <a href="mailto:hello@certo.ng" style="font-size:14px;font-weight:600;color:#d97757;">✉ hello@certo.ng</a>
        <span style="color:#e5e2db;">|</span>
        <a href="https://wa.me/${WA_NUM}" style="font-size:14px;font-weight:600;color:#d97757;">💬 WhatsApp</a>
      </div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:24px 40px;text-align:center;">
      <div style="font-size:12px;color:#706b60;line-height:1.6;">
        This email was sent from <strong>noreply@certo.ng</strong> — please do not reply to this address.<br/>
        For all enquiries: <a href="mailto:hello@certo.ng">hello@certo.ng</a> or <a href="https://wa.me/${WA_NUM}">WhatsApp</a><br/><br/>
        © ${new Date().getFullYear()} Certo. All rights reserved.<br/>
        <a href="${SITE}">certo.ng</a>
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendOrderConfirmation(order) {
  const html = orderConfirmationHtml(order);

  const info = await transporter.sendMail({
    from:    '"Certo" <noreply@certo.ng>',
    to:      `${order.customer_name} <${order.customer_email}>`,
    subject: `Order Confirmed – ${order.id} | Certo`,
    html,
    text: `Hi ${order.customer_name},\n\nYour Certo order ${order.id} has been confirmed.\n\nProduct: ${order.product_name}\nTotal: ₦${Number(order.ngn_price).toLocaleString()}\n\nTrack your order: ${process.env.FRONTEND_URL}/track/${order.id}\n\nFor help: hello@certo.ng or WhatsApp: https://wa.me/${WA_NUM}\n\nThank you,\nCerto`,
  });

  return info;
}

// ─── Status update email ───────────────────────────────────────────────────

const STATUS_MESSAGES = {
  'Arrived in Nigeria': {
    emoji: '🇳🇬',
    headline: 'Your order has arrived in Nigeria!',
    body: 'Great news — your device has cleared customs and landed in Nigeria. Our delivery team is preparing it for dispatch. You\'ll hear from us shortly with a delivery window.',
    next: 'Expect delivery soon. Our team will call or WhatsApp you to confirm your delivery slot.',
  },
  'Out for Delivery': {
    emoji: '🚚',
    headline: 'Your order is out for delivery today!',
    body: 'Your device is on its way to you right now. Please make sure someone is available at your delivery address to receive it.',
    next: 'Keep your phone nearby — our delivery agent will call before arrival. At delivery, inspect the sealed box before signing.',
  },
  'Delivered': {
    emoji: '📦',
    headline: 'Your order has been delivered!',
    body: 'Your Certo order has been delivered. We hope everything arrived in perfect condition. Remember to verify your serial number on Apple\'s website.',
    next: 'Visit checkcoverage.apple.com and enter your serial number to confirm your device is genuine and your warranty is active.',
  },
};

function statusUpdateHtml(order) {
  const { id, customer_name, product_name, product_image_url, status } = order;
  const msg      = STATUS_MESSAGES[status];
  const trackUrl = `${SITE}/track/${id}`;
  const fmtNgn   = (n) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${msg.emoji} ${msg.headline}</title>
<style>body{margin:0;padding:0;background:#f2f0ec;font-family:Inter,Arial,sans-serif;-webkit-font-smoothing:antialiased;}a{color:#d97757;text-decoration:none;}</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0ec;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf9f7;border-radius:20px;overflow:hidden;border:1px solid #e5e2db;">

  <!-- Header -->
  <tr>
    <td style="background:#d97757;padding:28px 40px;text-align:center;">
      <div style="font-family:Georgia,serif;font-weight:700;font-size:26px;color:#fff;letter-spacing:-0.02em;">Certo</div>
    </td>
  </tr>

  <!-- Status Hero -->
  <tr>
    <td style="padding:40px 40px 28px;text-align:center;border-bottom:1px solid #e5e2db;">
      <div style="font-size:48px;margin-bottom:16px;">${msg.emoji}</div>
      <h1 style="font-size:22px;font-weight:700;color:#1a1714;margin:0 0 12px;letter-spacing:-0.02em;">${msg.headline}</h1>
      <p style="font-size:15px;color:#706b60;margin:0;line-height:1.7;max-width:440px;display:inline-block;">
        Hi ${customer_name} — ${msg.body}
      </p>
    </td>
  </tr>

  <!-- Order info -->
  <tr>
    <td style="padding:24px 40px;border-bottom:1px solid #e5e2db;background:#f2f0ec;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#706b60;margin-bottom:8px;">Your order</div>
      <div style="font-size:16px;font-weight:700;color:#1a1714;margin-bottom:4px;">${product_name}</div>
      <div style="font-size:13px;color:#706b60;">Order ID: <strong>${id}</strong></div>
    </td>
  </tr>

  <!-- What's next -->
  <tr>
    <td style="padding:28px 40px;border-bottom:1px solid #e5e2db;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#706b60;margin-bottom:10px;">What to do now</div>
      <p style="font-size:14px;color:#1a1714;line-height:1.7;margin:0;">${msg.next}</p>
    </td>
  </tr>

  <!-- Track CTA -->
  <tr>
    <td style="padding:32px 40px;text-align:center;border-bottom:1px solid #e5e2db;">
      <a href="${trackUrl}" style="display:inline-block;background:#d97757;color:#fff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">Track My Order →</a>
    </td>
  </tr>

  <!-- Contact -->
  <tr>
    <td style="padding:24px 40px;border-bottom:1px solid #e5e2db;">
      <p style="font-size:14px;color:#706b60;line-height:1.7;margin:0 0 10px;">Questions? We're here:</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <a href="mailto:hello@certo.ng" style="font-size:14px;font-weight:600;color:#d97757;">✉ hello@certo.ng</a>
        <span style="color:#e5e2db;">|</span>
        <a href="https://wa.me/${WA_NUM}" style="font-size:14px;font-weight:600;color:#d97757;">💬 WhatsApp</a>
      </div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:24px 40px;text-align:center;">
      <div style="font-size:12px;color:#706b60;line-height:1.6;">
        © ${new Date().getFullYear()} Certo. All rights reserved. · <a href="${SITE}">certo.ng</a>
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

const STATUS_EMAIL_SUBJECTS = {
  'Arrived in Nigeria': '🇳🇬 Your order has arrived in Nigeria! – ',
  'Out for Delivery':   '🚚 Your order is out for delivery today! – ',
  'Delivered':          '📦 Your order has been delivered! – ',
};

async function sendStatusUpdate(order) {
  const subject = STATUS_EMAIL_SUBJECTS[order.status];
  if (!subject) return; // only send for these three statuses
  const html = statusUpdateHtml(order);
  return transporter.sendMail({
    from:    '"Certo" <noreply@certo.ng>',
    to:      `${order.customer_name} <${order.customer_email}>`,
    subject: subject + order.id,
    html,
    text: `Hi ${order.customer_name},\n\n${STATUS_MESSAGES[order.status].headline}\n\n${STATUS_MESSAGES[order.status].body}\n\n${STATUS_MESSAGES[order.status].next}\n\nTrack your order: ${SITE}/track/${order.id}\n\nFor help: hello@certo.ng or WhatsApp: https://wa.me/${WA_NUM}\n\nCerto`,
  });
}

module.exports = { sendOrderConfirmation, sendStatusUpdate };
