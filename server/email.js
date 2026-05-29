// ─────────────────────────────────────────────────────────────────────────────
// email.js — Certo transactional email templates (v2)
//
// Design system
//   – Cream canvas (#f2f0ec) + ivory card (#faf9f7)
//   – Terracotta accent (#d97757) used sparingly, with a deep ink (#1a1714)
//   – "Certo" wordmark in Syne 800 (Google Fonts, with Georgia fallback)
//   – Body in Inter / system stack
//   – Numbered Syne display numerals for the "what happens next" timeline
//   – Ticket-stub treatment for the order ID
// ─────────────────────────────────────────────────────────────────────────────

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
});

transporter.verify((err) => {
  if (err) console.error('[email] SMTP connection failed:', err.message);
  else console.log('[email] SMTP ready on', process.env.SMTP_HOST);
});

const WA_NUM = process.env.WHATSAPP_NUMBER || '2348057575906';
const SITE   = process.env.FRONTEND_URL    || 'https://certo.ng';

// Internal notification recipients — comma-separated list in env var
// Falls back to the hardcoded defaults so it works without any env change
const NOTIFY_EMAILS = (process.env.NOTIFY_EMAILS || 'chidile@leak.ng,chidileozoemena@gmail.com,afrotechboss@yahoo.com')
  .split(',').map(e => e.trim()).filter(Boolean);

// ─── helpers ────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const fmtNgn = (n) => `&#8358;${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const fmtUsd = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

// Tokens
const C = {
  cream:      '#f2f0ec',
  card:       '#faf9f7',
  ink:        '#1a1714',
  muted:      '#706b60',
  subtle:     '#9a9387',
  border:     '#e5e2db',
  hairline:   '#ece8e0',
  accent:     '#d97757',
  accentDark: '#b85f3d',
  accentTint: '#f7e9df',
  sage:       '#1f7a4d',
  sageTint:   '#dff1e6',
};

const FONT_HEAD = "'Syne', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
// Inline style shorthand — every Syne element must include font-weight:800 explicitly
// so the bold weight is applied as soon as the font loads (or if it falls back to Georgia)
const SYNE800 = `font-family:${FONT_HEAD};font-weight:800;letter-spacing:-0.02em;`;

// Web font include — <link> is respected by Gmail, Apple Mail, and most web clients.
// @import inside <style> is stripped by Gmail; <link> in <head> survives.
// Outlook ignores web fonts entirely and falls back to Georgia (weight is preserved by font-weight).
const HEAD_STYLES = `
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  body { margin:0; padding:0; background:${C.cream}; font-family:${FONT_BODY}; -webkit-font-smoothing:antialiased; color:${C.ink}; }
  a { color:${C.accent}; text-decoration:none; }
  .syne { font-family:${FONT_HEAD}; letter-spacing:-0.02em; }
  .eyebrow { font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:${C.subtle}; }
  table { border-collapse:collapse; }
  @media (max-width:620px) {
    .pad { padding-left:24px !important; padding-right:24px !important; }
    .hero-h1 { font-size:32px !important; }
    .id-num { font-size:26px !important; letter-spacing:0.04em !important; }
  }
</style>
`;

// ─── shell ──────────────────────────────────────────────────────────────────

function shell({ title, preheader, inner }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>${esc(title)}</title>
${HEAD_STYLES}
</head>
<body>
<!-- preheader (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${esc(preheader)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.card};border-radius:16px;overflow:hidden;border:1px solid ${C.border};">
      ${inner}
    </table>

    <!-- outer footer note -->
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-top:18px;">
      <tr><td align="center" style="padding:0 24px;">
        <div style="font-size:11px;color:${C.subtle};line-height:1.7;font-family:${FONT_BODY};">
          Certo &middot; Lagos, Nigeria &middot; <a href="${SITE}" style="color:${C.subtle};text-decoration:underline;">certo.ng</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── masthead ────────────────────────────────────────────────────────────────

function masthead() {
  return `
  <tr>
    <td class="pad" style="padding:32px 40px 24px;background:${C.card};border-bottom:1px solid ${C.hairline};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <div class="syne" style="${SYNE800}font-size:30px;color:${C.ink};line-height:1;">Certo</div>
          </td>
          <td align="right" style="vertical-align:middle;">
            <div style="font-size:11px;color:${C.subtle};letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Genuine Apple, delivered</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ─── footer block ────────────────────────────────────────────────────────────

function footerBlock() {
  return `
  <tr>
    <td class="pad" style="padding:28px 40px;background:${C.card};border-top:1px solid ${C.hairline};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;">
            <div class="syne" style="${SYNE800}font-size:18px;color:${C.ink};margin-bottom:4px;">Certo</div>
            <div style="font-size:12px;color:${C.muted};line-height:1.6;">Lagos, Nigeria</div>
          </td>
          <td align="right" style="vertical-align:top;">
            <div style="font-size:12px;color:${C.muted};line-height:1.9;">
              <a href="mailto:hello@certo.ng" style="color:${C.accent};font-weight:600;">hello@certo.ng</a><br/>
              <a href="https://wa.me/${WA_NUM}" style="color:${C.accent};font-weight:600;">WhatsApp</a>
            </div>
          </td>
        </tr>
      </table>
      <div style="font-size:11px;color:${C.subtle};line-height:1.7;margin-top:20px;padding-top:18px;border-top:1px solid ${C.hairline};">
        Sent from <strong style="color:${C.muted};">noreply@certo.ng</strong> &middot; this address is not monitored.<br/>
        &copy; ${new Date().getFullYear()} Certo. All rights reserved.
      </div>
    </td>
  </tr>`;
}

// ─── order confirmation ──────────────────────────────────────────────────────

function orderConfirmationHtml(order) {
  const {
    id, customer_name, product_name, product_subtitle,
    usd_price, ngn_price, forex_rate,
    address, state, applecare, items,
  } = order;
  const trackUrl = `${SITE}/track/${id}`;

  const allItems = Array.isArray(items) && items.length > 0
    ? items
    : [{ name: product_name, subtitle: product_subtitle, usd_price, applecare: applecare || 'none' }];
  const isMulti = allItems.length > 1;

  const itemsHtml = allItems.map((item, i) => {
    const itemQty = item.qty && item.qty > 1 ? item.qty : 1;
    const lineTotalUsd = Number(item.usd_price) * itemQty;
    const variantPills = [
      item.variant_color ? `<span style="display:inline-block;background:${C.cream};border:1px solid ${C.border};border-radius:5px;padding:2px 8px;font-size:11px;font-weight:500;color:${C.muted};margin-right:4px;">${item.variant_color_hex ? `<span style="width:7px;height:7px;border-radius:50%;background:${item.variant_color_hex};display:inline-block;border:1px solid rgba(0,0,0,0.12);vertical-align:middle;margin-right:4px;"></span>` : ''}${esc(item.variant_color)}</span>` : '',
      item.variant_storage ? `<span style="display:inline-block;background:${C.cream};border:1px solid ${C.border};border-radius:5px;padding:2px 8px;font-size:11px;font-weight:500;color:${C.muted};">${esc(item.variant_storage)}</span>` : '',
    ].filter(Boolean).join('');

    return `
      <tr>
        <td style="padding:${i > 0 ? '16px 0 0' : '0'};border-top:${i > 0 ? '1px solid ' + C.hairline : 'none'};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${i > 0 ? 'padding-top:16px;' : ''}">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                ${itemQty > 1 ? `<span style="display:inline-block;background:${C.ink};color:#fff;border-radius:4px;padding:1px 7px;font-size:10px;font-weight:700;letter-spacing:0.04em;margin-bottom:6px;">${itemQty} &times;</span><br/>` : ''}
                <div style="font-size:${isMulti ? '15' : '17'}px;font-weight:700;color:${C.ink};line-height:1.3;letter-spacing:-0.01em;">${esc(item.name)}</div>
                ${item.subtitle ? `<div style="font-size:13px;color:${C.muted};margin-top:3px;line-height:1.5;">${esc(item.subtitle)}</div>` : ''}
                ${variantPills ? `<div style="margin-top:8px;">${variantPills}</div>` : ''}
                ${item.applecare && item.applecare !== 'none' ? `<div style="margin-top:8px;"><span style="display:inline-block;background:${C.accentTint};color:${C.accentDark};border-radius:5px;padding:3px 9px;font-size:11px;font-weight:600;">+ ${esc(item.applecare)}</span></div>` : ''}
              </td>
              ${isMulti ? `<td align="right" style="vertical-align:top;white-space:nowrap;">
                <div style="font-size:14px;font-weight:700;color:${C.ink};">${fmtUsd(lineTotalUsd)}</div>
                ${itemQty > 1 ? `<div style="font-size:11px;color:${C.subtle};margin-top:2px;">${itemQty} &times; ${fmtUsd(item.usd_price)}</div>` : ''}
              </td>` : ''}
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('');

  const inner = `
  ${masthead()}

  <!-- hero -->
  <tr>
    <td class="pad" style="padding:48px 40px 32px;text-align:center;border-bottom:1px solid ${C.hairline};">
      <table role="presentation" cellpadding="0" cellspacing="0" align="center">
        <tr><td style="background:${C.sageTint};width:56px;height:56px;border-radius:50%;text-align:center;line-height:56px;">
          <span style="font-family:${FONT_BODY};font-size:24px;color:${C.sage};font-weight:700;">&#10004;</span>
        </td></tr>
      </table>
      <div class="eyebrow" style="margin:24px 0 10px;color:${C.sage};">Order confirmed</div>
      <h1 class="syne hero-h1" style="${SYNE800}font-size:38px;color:${C.ink};margin:0 0 12px;line-height:1.05;letter-spacing:-0.03em;">
        Thank you, ${esc(customer_name.split(' ')[0])}.
      </h1>
      <p style="font-size:15px;color:${C.muted};margin:0 auto;line-height:1.7;max-width:420px;">
        Your payment has been received. We're starting procurement within 24 hours and you'll hear from us on WhatsApp shortly.
      </p>
    </td>
  </tr>

  <!-- order ID — ticket stub -->
  <tr>
    <td class="pad" style="padding:0 40px;background:${C.card};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:28px;background:${C.cream};border-radius:14px;text-align:center;margin:32px 0;">
          <div class="eyebrow" style="margin-bottom:10px;">Your order ID</div>
          <div class="syne id-num" style="${SYNE800}font-size:32px;color:${C.ink};letter-spacing:0.06em;line-height:1;">${esc(id)}</div>
          <div style="font-size:12px;color:${C.muted};margin-top:10px;">Save this &mdash; you'll use it to track your order anytime</div>
        </td></tr>
      </table>
      <div style="height:32px;"></div>
    </td>
  </tr>

  <!-- what you ordered -->
  <tr>
    <td class="pad" style="padding:0 40px 32px;">
      <div class="eyebrow" style="margin-bottom:16px;">What you ordered</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${itemsHtml}
      </table>

      <!-- totals -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid ${C.hairline};">
        <tr>
          <td style="padding:14px 0 6px;font-size:13px;color:${C.muted};">USD subtotal</td>
          <td align="right" style="padding:14px 0 6px;font-size:13px;color:${C.ink};font-weight:600;">${fmtUsd(usd_price)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${C.muted};">Forex rate (locked)</td>
          <td align="right" style="padding:6px 0;font-size:13px;color:${C.ink};font-weight:600;">&#8358;${Number(forex_rate).toLocaleString()} / $1</td>
        </tr>
        <tr><td colspan="2" style="padding-top:14px;border-top:1px solid ${C.hairline};"></td></tr>
        <tr>
          <td style="padding-top:14px;font-size:15px;font-weight:700;color:${C.ink};font-family:${FONT_HEAD};letter-spacing:-0.01em;">Total paid</td>
          <td align="right" style="padding-top:14px;">
            <span class="syne" style="${SYNE800}font-size:24px;color:${C.accent};">${fmtNgn(ngn_price)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- delivery address -->
  <tr>
    <td class="pad" style="padding:24px 40px;background:${C.cream};border-top:1px solid ${C.hairline};border-bottom:1px solid ${C.hairline};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;width:32px;padding-right:12px;">
            <div style="width:32px;height:32px;border-radius:8px;background:${C.card};border:1px solid ${C.border};text-align:center;line-height:32px;font-size:14px;">&#9873;</div>
          </td>
          <td style="vertical-align:top;">
            <div class="eyebrow" style="margin-bottom:4px;">Delivering to</div>
            <div style="font-size:14px;color:${C.ink};line-height:1.6;font-weight:500;">${esc(address)}${state ? `, ${esc(state)}` : ''}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- track CTA -->
  <tr>
    <td class="pad" style="padding:36px 40px;text-align:center;border-bottom:1px solid ${C.hairline};">
      <a href="${trackUrl}" style="display:inline-block;background:${C.ink};color:#fff;font-size:15px;font-weight:600;padding:15px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">
        Track my order &rarr;
      </a>
      <div style="font-size:12px;color:${C.subtle};margin-top:14px;">No login needed &middot; <span style="color:${C.muted};">${trackUrl}</span></div>
    </td>
  </tr>

  <!-- what happens next — numbered timeline -->
  <tr>
    <td class="pad" style="padding:36px 40px 24px;">
      <div class="eyebrow" style="margin-bottom:24px;">What happens next</div>
      ${[
        ['01', 'Within 2 hours', 'A WhatsApp message from our team confirming receipt with your order details.'],
        ['02', 'Within 24 hours', 'We purchase your exact device from Apple.com US and send you the Apple order number.'],
        ['03', '10&ndash;20 days', 'Your device ships to Nigeria. Customs and duties are fully covered &mdash; no surprise charges.'],
        ['04', 'On delivery', 'Inspect the sealed box before signing. Verify the serial number on apple.com/coverage.'],
      ].map(([num, t, d], i, arr) => `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;width:56px;padding-right:16px;">
              <div class="syne" style="${SYNE800}font-size:28px;color:${C.accent};line-height:1;">${num}</div>
              ${i < arr.length - 1 ? `<div style="width:1px;height:36px;background:${C.border};margin:8px 0 0 14px;"></div>` : ''}
            </td>
            <td style="vertical-align:top;padding-bottom:${i < arr.length - 1 ? '20' : '0'}px;">
              <div style="font-size:14px;font-weight:700;color:${C.ink};margin-bottom:3px;letter-spacing:-0.01em;">${t}</div>
              <div style="font-size:13px;color:${C.muted};line-height:1.65;">${d}</div>
            </td>
          </tr>
        </table>
      `).join('')}
    </td>
  </tr>

  <!-- help -->
  <tr>
    <td class="pad" style="padding:24px 40px 32px;background:${C.card};border-top:1px solid ${C.hairline};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <div style="font-size:14px;font-weight:700;color:${C.ink};margin-bottom:2px;">Need help?</div>
            <div style="font-size:13px;color:${C.muted};">Reply to this email or reach us directly.</div>
          </td>
          <td align="right" style="vertical-align:middle;">
            <a href="mailto:hello@certo.ng" style="display:inline-block;font-size:13px;font-weight:600;color:${C.accent};margin-right:14px;">Email</a>
            <a href="https://wa.me/${WA_NUM}" style="display:inline-block;font-size:13px;font-weight:600;color:${C.accent};">WhatsApp</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${footerBlock()}
  `;

  return shell({
    title: `Order confirmed – ${id}`,
    preheader: `Order ${id} confirmed. ${fmtNgn(ngn_price)} received. We're starting procurement within 24 hours.`,
    inner,
  });
}

async function sendOrderConfirmation(order) {
  const html = orderConfirmationHtml(order);
  const itemsList = Array.isArray(order.items) && order.items.length > 0
    ? 'Items:\n' + order.items.map(it => `- ${it.qty && it.qty > 1 ? `${it.qty}× ` : ''}${it.name}${it.subtitle ? ' ' + it.subtitle : ''}${it.variant_color ? ` | ${it.variant_color}` : ''}${it.variant_storage ? ` | ${it.variant_storage}` : ''}${it.applecare && it.applecare !== 'none' ? ' + ' + it.applecare : ''} ($${(Number(it.usd_price) * (it.qty || 1)).toLocaleString()})`).join('\n')
    : `Product: ${order.product_name}`;

  return transporter.sendMail({
    from:    process.env.SMTP_USER ? `"Certo" <${process.env.SMTP_USER}>` : '"Certo" <noreply@certo.ng>',
    to:      `${order.customer_name} <${order.customer_email}>`,
    subject: `Order confirmed – ${order.id} | Certo`,
    html,
    text: `Hi ${order.customer_name},\n\nYour Certo order ${order.id} has been confirmed.\n\n${itemsList}\n\nTotal: ₦${Number(order.ngn_price).toLocaleString()}\n\nTrack your order: ${SITE}/track/${order.id}\n\nFor help: hello@certo.ng or WhatsApp: https://wa.me/${WA_NUM}\n\nThank you,\nCerto`,
  });
}

// ─── status update ───────────────────────────────────────────────────────────

const STATUS_MESSAGES = {
  'Arrived in Nigeria': {
    eyebrow: 'Update on your order',
    headline: 'Welcome home.',
    body: 'Your device has cleared customs and landed in Nigeria. Our delivery team is preparing it for dispatch &mdash; you\'ll hear from us shortly with a delivery window.',
    next: 'Expect a call or WhatsApp message from our team in the next 24 hours to confirm your delivery slot.',
    symbol: '&#9992;',
    accentColor: '#1f7a4d',
    accentBg: '#dff1e6',
  },
  'Out for Delivery': {
    eyebrow: 'Update on your order',
    headline: 'On its way today.',
    body: 'Your device is heading to your door right now. Please make sure someone is available at the delivery address to receive it.',
    next: 'Keep your phone nearby &mdash; our delivery agent will call before arrival. At delivery, inspect the sealed box before signing.',
    symbol: '&#10140;',
    accentColor: '#b85f3d',
    accentBg: '#f7e9df',
  },
  'Delivered': {
    eyebrow: 'Delivered',
    headline: 'It\'s yours.',
    body: 'Your Certo order has been delivered. We hope everything arrived in perfect condition. One final step: verify your serial on Apple\'s website.',
    next: 'Visit checkcoverage.apple.com and enter your serial number to confirm your device is genuine and your warranty is active.',
    symbol: '&#10004;',
    accentColor: '#1f7a4d',
    accentBg: '#dff1e6',
  },
};

function statusUpdateHtml(order) {
  const { id, customer_name, product_name, status, items } = order;
  const allItems = Array.isArray(items) && items.length > 0 ? items : null;
  const displayName = allItems ? allItems.map(it => it.name).join(', ') : product_name;
  const msg = STATUS_MESSAGES[status];
  const trackUrl   = `${SITE}/track/${id}`;
  const verifyUrl  = `${SITE}/verify/${id}`;
  const isDelivered = status === 'Delivered';

  const inner = `
  ${masthead()}

  <!-- hero -->
  <tr>
    <td class="pad" style="padding:48px 40px 36px;text-align:center;border-bottom:1px solid ${C.hairline};">
      <table role="presentation" cellpadding="0" cellspacing="0" align="center">
        <tr><td style="background:${msg.accentBg};width:64px;height:64px;border-radius:50%;text-align:center;line-height:64px;">
          <span style="font-family:${FONT_BODY};font-size:26px;color:${msg.accentColor};font-weight:700;">${msg.symbol}</span>
        </td></tr>
      </table>
      <div class="eyebrow" style="margin:24px 0 10px;color:${msg.accentColor};">${msg.eyebrow}</div>
      <h1 class="syne hero-h1" style="${SYNE800}font-size:38px;color:${C.ink};margin:0 0 14px;line-height:1.05;letter-spacing:-0.03em;">
        ${msg.headline}
      </h1>
      <p style="font-size:15px;color:${C.muted};margin:0 auto;line-height:1.75;max-width:440px;">
        Hi ${esc(customer_name.split(' ')[0])} &mdash; ${msg.body}
      </p>
    </td>
  </tr>

  <!-- order info card -->
  <tr>
    <td class="pad" style="padding:32px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border-radius:14px;">
        <tr>
          <td style="padding:20px 24px;">
            <div class="eyebrow" style="margin-bottom:6px;">Your order</div>
            <div style="font-size:16px;font-weight:700;color:${C.ink};margin-bottom:4px;letter-spacing:-0.01em;">${esc(displayName)}</div>
            <div style="font-size:12px;color:${C.muted};">Order ID: <strong style="color:${C.ink};letter-spacing:0.04em;">${esc(id)}</strong></div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- what to do now -->
  <tr>
    <td class="pad" style="padding:32px 40px;border-bottom:1px solid ${C.hairline};">
      <div class="eyebrow" style="margin-bottom:12px;">What to do now</div>
      <p style="font-size:15px;color:${C.ink};line-height:1.75;margin:0;">${msg.next}</p>
    </td>
  </tr>

  ${isDelivered ? `
  <!-- verification certificate CTA — only shown on Delivered email -->
  <tr>
    <td class="pad" style="padding:36px 40px;background:${C.cream};border-bottom:1px solid ${C.hairline};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;padding-right:20px;">
            <!-- document icon -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
              <tr><td style="background:${C.card};border:1px solid ${C.border};width:44px;height:44px;border-radius:10px;text-align:center;line-height:44px;">
                <span style="font-size:20px;">&#128196;</span>
              </td></tr>
            </table>
            <div class="syne" style="${SYNE800}font-size:20px;color:${C.ink};margin-bottom:8px;line-height:1.15;">Your verification<br/>certificate is ready.</div>
            <p style="font-size:14px;color:${C.muted};line-height:1.7;margin:0 0 22px;">
              Your Certo certificate of authenticity is available online — it confirms your device&rsquo;s serial number, Apple order reference, and full chain of custody from the US to your door.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px;">
                  <a href="${verifyUrl}" style="display:inline-block;background:${C.ink};color:#fff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">View Certificate &rarr;</a>
                </td>
                <td>
                  <a href="${trackUrl}" style="display:inline-block;background:${C.card};color:${C.ink};border:1px solid ${C.border};font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;">Track Order</a>
                </td>
              </tr>
            </table>
            <div style="font-size:11px;color:${C.subtle};margin-top:12px;">
              ${verifyUrl}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ` : `
  <!-- track CTA -->
  <tr>
    <td class="pad" style="padding:36px 40px;text-align:center;border-bottom:1px solid ${C.hairline};">
      <a href="${trackUrl}" style="display:inline-block;background:${C.ink};color:#fff;font-size:15px;font-weight:600;padding:15px 36px;border-radius:10px;text-decoration:none;">Track my order &rarr;</a>
    </td>
  </tr>
  `}

  <!-- help -->
  <tr>
    <td class="pad" style="padding:24px 40px 32px;background:${C.card};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <div style="font-size:14px;font-weight:700;color:${C.ink};margin-bottom:2px;">Questions?</div>
            <div style="font-size:13px;color:${C.muted};">We're a message away.</div>
          </td>
          <td align="right" style="vertical-align:middle;">
            <a href="mailto:hello@certo.ng" style="display:inline-block;font-size:13px;font-weight:600;color:${C.accent};margin-right:14px;">Email</a>
            <a href="https://wa.me/${WA_NUM}" style="display:inline-block;font-size:13px;font-weight:600;color:${C.accent};">WhatsApp</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${footerBlock()}
  `;

  return shell({
    title: `${status} – ${id}`,
    preheader: msg.body.replace(/<[^>]+>/g, ''),
    inner,
  });
}

const STATUS_EMAIL_SUBJECTS = {
  'Arrived in Nigeria': 'Welcome home — your order has landed in Nigeria · ',
  'Out for Delivery':   'On its way today — your order is out for delivery · ',
  'Delivered':          'Delivered — your Certo order has arrived · ',
};

async function sendStatusUpdate(order) {
  const subject = STATUS_EMAIL_SUBJECTS[order.status];
  if (!subject) return;
  const html = statusUpdateHtml(order);
  const msg = STATUS_MESSAGES[order.status];
  return transporter.sendMail({
    from:    process.env.SMTP_USER ? `"Certo" <${process.env.SMTP_USER}>` : '"Certo" <noreply@certo.ng>',
    to:      `${order.customer_name} <${order.customer_email}>`,
    subject: subject + order.id,
    html,
    text: `Hi ${order.customer_name},\n\n${msg.headline}\n\n${msg.body.replace(/&mdash;/g, '—').replace(/<[^>]+>/g, '')}\n\n${msg.next.replace(/&mdash;/g, '—').replace(/<[^>]+>/g, '')}${order.status === 'Delivered' ? `\n\n— Your verification certificate —\nYour certificate of authenticity is ready. It confirms your device's serial number, Apple order reference, and chain of custody.\nView it here: ${SITE}/verify/${order.id}` : ''}\n\nTrack your order: ${SITE}/track/${order.id}\n\nFor help: hello@certo.ng or WhatsApp: https://wa.me/${WA_NUM}\n\nCerto`,
  });
}

// ─── cancellation ────────────────────────────────────────────────────────────

function cancellationHtml(order) {
  const { id, customer_name, items, product_name, product_subtitle, ngn_price } = order;
  const allItems = Array.isArray(items) && items.length > 0
    ? items
    : [{ name: product_name, subtitle: product_subtitle }];
  const displayName = allItems.map(it => it.name + (it.subtitle ? ` ${it.subtitle}` : '')).join(', ');

  const inner = `
  ${masthead()}

  <!-- hero -->
  <tr>
    <td class="pad" style="padding:48px 40px 36px;text-align:center;border-bottom:1px solid ${C.hairline};">
      <table role="presentation" cellpadding="0" cellspacing="0" align="center">
        <tr><td style="background:#f0ede6;width:56px;height:56px;border-radius:50%;text-align:center;line-height:56px;">
          <span style="font-family:${FONT_BODY};font-size:22px;color:${C.muted};font-weight:400;">&times;</span>
        </td></tr>
      </table>
      <div class="eyebrow" style="margin:24px 0 10px;">Order cancelled</div>
      <h1 class="syne hero-h1" style="${SYNE800}font-size:36px;color:${C.ink};margin:0 0 14px;line-height:1.1;letter-spacing:-0.03em;">
        Your order<br/>has been cancelled.
      </h1>
      <p style="font-size:15px;color:${C.muted};margin:0 auto;line-height:1.7;max-width:420px;">
        Hi ${esc(customer_name.split(' ')[0])} &mdash; your Certo order has been cancelled and no further charges will be made.
      </p>
    </td>
  </tr>

  <!-- order summary -->
  <tr>
    <td class="pad" style="padding:32px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border-radius:14px;">
        <tr>
          <td style="padding:20px 24px;">
            <div class="eyebrow" style="margin-bottom:6px;">Cancelled order</div>
            <div style="font-size:15px;font-weight:700;color:${C.ink};margin-bottom:6px;letter-spacing:-0.01em;">${esc(displayName)}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:${C.muted};padding-top:4px;">Order ID</td>
                <td align="right" style="font-size:12px;color:${C.ink};padding-top:4px;font-weight:600;letter-spacing:0.04em;">${esc(id)}</td>
              </tr>
              ${ngn_price ? `<tr>
                <td style="font-size:12px;color:${C.muted};padding-top:4px;">Amount</td>
                <td align="right" style="font-size:12px;color:${C.ink};padding-top:4px;font-weight:600;">${fmtNgn(ngn_price)}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- didn't cancel? -->
  <tr>
    <td class="pad" style="padding:32px 40px 24px;">
      <div style="border:1px solid ${C.accentTint};background:${C.accentTint};border-radius:14px;padding:24px;">
        <div class="syne" style="${SYNE800}font-size:18px;color:${C.ink};margin-bottom:8px;">Didn't request this?</div>
        <p style="font-size:14px;color:${C.ink};line-height:1.7;margin:0 0 18px;opacity:0.85;">
          If you didn't ask to cancel this order or believe this is a mistake, please reach out immediately. We'll sort it out promptly.
        </p>
        <a href="mailto:hello@certo.ng" style="display:inline-block;background:${C.ink};color:#fff;font-size:13px;font-weight:600;padding:11px 22px;border-radius:9px;text-decoration:none;margin-right:8px;">Email us</a>
        <a href="https://wa.me/${WA_NUM}" style="display:inline-block;background:#fff;color:${C.ink};border:1px solid ${C.border};font-size:13px;font-weight:600;padding:10px 22px;border-radius:9px;text-decoration:none;">WhatsApp</a>
      </div>
    </td>
  </tr>

  <!-- soft outro -->
  <tr>
    <td class="pad" style="padding:8px 40px 36px;text-align:center;border-bottom:1px solid ${C.hairline};">
      <p style="font-size:13px;color:${C.muted};line-height:1.7;margin:0;">
        Need to know the reason, or want to place a new order?<br/>
        <a href="mailto:hello@certo.ng" style="color:${C.accent};font-weight:600;">hello@certo.ng</a>
        &nbsp;&middot;&nbsp;
        <a href="https://wa.me/${WA_NUM}" style="color:${C.accent};font-weight:600;">WhatsApp</a>
      </p>
    </td>
  </tr>

  ${footerBlock()}
  `;

  return shell({
    title: `Order cancelled – ${id}`,
    preheader: `Your Certo order ${id} has been cancelled. If this wasn't you, get in touch.`,
    inner,
  });
}

async function sendCancellationEmail(order) {
  const html = cancellationHtml(order);
  return transporter.sendMail({
    from:    process.env.SMTP_USER ? `"Certo" <${process.env.SMTP_USER}>` : '"Certo" <noreply@certo.ng>',
    to:      `${order.customer_name} <${order.customer_email}>`,
    subject: `Your Certo order has been cancelled – ${order.id}`,
    html,
    text: `Hi ${order.customer_name},\n\nYour Certo order ${order.id} has been cancelled.\n\nIf you didn't request this cancellation or need a reason, please contact us:\n• Email: hello@certo.ng\n• WhatsApp: https://wa.me/${WA_NUM}\n\nWe're happy to help.\n\nCerto`,
  });
}

// ─── pending payment (USD / Crypto via WhatsApp) ─────────────────────────────

function pendingPaymentHtml(order) {
  const {
    id, customer_name, product_name, product_subtitle,
    usd_price, items,
  } = order;

  const displayName = (() => {
    if (Array.isArray(items) && items.length > 1) return `${items.length} items`;
    if (Array.isArray(items) && items.length === 1) return [items[0].name, items[0].subtitle].filter(Boolean).join(' ');
    return [product_name, product_subtitle].filter(Boolean).join(' ');
  })();

  const totalUsd = (() => {
    if (Array.isArray(items) && items.length > 0) {
      return items.reduce((sum, it) => sum + Number(it.usd_price) * (it.qty || 1), 0);
    }
    return Number(usd_price);
  })();

  const waMsg = encodeURIComponent(
    `Hi, I'd like to pay in USD/Crypto for my Certo order.\n\nOrder ID: ${id}\nTotal: $${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD\n\nPlease let me know how to proceed.`
  );
  const waLink = `https://wa.me/${WA_NUM}?text=${waMsg}`;

  const inner = `
  ${masthead()}

  <!-- hero -->
  <tr>
    <td class="pad" style="padding:48px 40px 32px;text-align:center;border-bottom:1px solid ${C.hairline};">
      <table role="presentation" cellpadding="0" cellspacing="0" align="center">
        <tr><td style="background:#fff8e1;width:56px;height:56px;border-radius:50%;text-align:center;line-height:56px;">
          <span style="font-size:26px;">⏳</span>
        </td></tr>
      </table>
      <div class="eyebrow" style="margin:24px 0 10px;color:${C.accent};">Payment pending</div>
      <h1 class="syne hero-h1" style="${SYNE800}font-size:38px;color:${C.ink};margin:0 0 12px;line-height:1.05;letter-spacing:-0.03em;">
        We're holding your order.
      </h1>
      <p style="font-size:15px;color:${C.muted};margin:0 auto;line-height:1.7;max-width:420px;">
        Hi ${esc(customer_name.split(' ')[0])} — your order is reserved but won't be confirmed until we receive your USD or crypto payment. Message us on WhatsApp to complete it.
      </p>
    </td>
  </tr>

  <!-- order ID — ticket stub -->
  <tr>
    <td class="pad" style="padding:32px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:28px;background:${C.cream};border-radius:14px;text-align:center;">
          <div class="eyebrow" style="margin-bottom:10px;">Your order ID</div>
          <div class="syne id-num" style="${SYNE800}font-size:32px;color:${C.ink};letter-spacing:0.06em;line-height:1;">${esc(id)}</div>
          <div style="font-size:12px;color:${C.muted};margin-top:10px;">Quote this when you message us — it links your payment to your order</div>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- what you ordered -->
  <tr>
    <td class="pad" style="padding:28px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border-radius:14px;">
        <tr>
          <td style="padding:20px 24px;">
            <div class="eyebrow" style="margin-bottom:6px;">Reserved item</div>
            <div style="font-size:15px;font-weight:700;color:${C.ink};letter-spacing:-0.01em;">${esc(displayName)}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid ${C.border};padding-top:12px;">
              <tr>
                <td style="font-size:13px;color:${C.muted};padding-top:12px;">Amount due</td>
                <td align="right" style="padding-top:12px;">
                  <span class="syne" style="${SYNE800}font-size:22px;color:${C.accent};">${fmtUsd(totalUsd)}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td class="pad" style="padding:28px 40px 32px;border-bottom:1px solid ${C.hairline};">
      <div style="background:${C.ink};border-radius:16px;padding:28px 28px 24px;text-align:center;">
        <div class="syne" style="${SYNE800}font-size:20px;color:#fff;margin-bottom:8px;line-height:1.2;">
          Ready to pay? Open WhatsApp.
        </div>
        <p style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.65;margin:0 0 20px;">
          Tap the button below — your order ID and total are pre-filled.<br/>We'll confirm your order as soon as payment clears.
        </p>
        <a href="${waLink}"
           style="display:inline-block;background:#25D366;color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:-0.01em;">
          &#128172;&nbsp; Send payment details on WhatsApp
        </a>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:14px;">
          Or message us manually: <strong style="color:rgba(255,255,255,0.6);">+234 805 757 5906</strong> and quote ${esc(id)}
        </div>
      </div>
    </td>
  </tr>

  <!-- what happens next -->
  <tr>
    <td class="pad" style="padding:28px 40px 8px;">
      <div class="eyebrow" style="margin-bottom:20px;">What happens next</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${[
          ['1', 'Message us on WhatsApp', 'Use the button above — your order details are already in the message.'],
          ['2', 'Send payment', "We'll share our USD bank or crypto wallet details. Pay from wherever works best for you."],
          ['3', 'Order confirmed', "Once payment clears we confirm your order and start procurement. You'll get a confirmation email."],
        ].map(([num, title, desc]) => `
        <tr>
          <td style="vertical-align:top;width:36px;padding-right:14px;padding-bottom:20px;">
            <div class="syne" style="${SYNE800}font-size:26px;color:${C.accentTint};line-height:1;">${num}</div>
          </td>
          <td style="vertical-align:top;padding-bottom:20px;">
            <div style="font-size:14px;font-weight:700;color:${C.ink};margin-bottom:3px;">${title}</div>
            <div style="font-size:13px;color:${C.muted};line-height:1.6;">${desc}</div>
          </td>
        </tr>`).join('')}
      </table>
    </td>
  </tr>

  <!-- soft note -->
  <tr>
    <td class="pad" style="padding:8px 40px 32px;border-bottom:1px solid ${C.hairline};text-align:center;">
      <p style="font-size:12px;color:${C.subtle};line-height:1.7;margin:0;">
        Your order will be held for <strong style="color:${C.muted};">48 hours</strong>. If we don't hear from you within that time, the reservation may be released.
      </p>
    </td>
  </tr>

  ${footerBlock()}
  `;

  return shell({
    title: `Payment pending – ${id}`,
    preheader: `Your Certo order ${id} is reserved. Message us on WhatsApp to complete your USD/crypto payment.`,
    inner,
  });
}

async function sendPaymentPendingEmail(order) {
  const html = pendingPaymentHtml(order);
  const totalUsd = (() => {
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.reduce((sum, it) => sum + Number(it.usd_price) * (it.qty || 1), 0);
    }
    return Number(order.usd_price);
  })();

  return transporter.sendMail({
    from:    process.env.SMTP_USER ? `"Certo" <${process.env.SMTP_USER}>` : '"Certo" <noreply@certo.ng>',
    to:      `${order.customer_name} <${order.customer_email}>`,
    subject: `Your Certo order is reserved – complete payment to confirm (${order.id})`,
    html,
    text: `Hi ${order.customer_name},\n\nYour Certo order is reserved but pending payment.\n\nOrder ID: ${order.id}\nAmount due: $${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD\n\nTo confirm your order, message us on WhatsApp and we'll share payment details:\nhttps://wa.me/${WA_NUM}?text=${encodeURIComponent(`Hi, I'd like to pay for my Certo order.\n\nOrder ID: ${order.id}\nTotal: $${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`)}\n\nOr call/text: +234 805 757 5906\n\nYour order will be held for 48 hours.\n\nCerto`,
  });
}

// ─── pending payment — Naira / Flutterwave ────────────────────────────────────

function pendingNairaHtml(order) {
  const {
    id, customer_name, product_name, product_subtitle,
    ngn_price, forex_rate, items,
  } = order;

  const displayName = (() => {
    if (Array.isArray(items) && items.length > 1) return `${items.length} items`;
    if (Array.isArray(items) && items.length === 1) return [items[0].name, items[0].subtitle].filter(Boolean).join(' ');
    return [product_name, product_subtitle].filter(Boolean).join(' ');
  })();

  const inner = `
  ${masthead()}

  <!-- hero -->
  <tr>
    <td class="pad" style="padding:48px 40px 32px;text-align:center;border-bottom:1px solid ${C.hairline};">
      <table role="presentation" cellpadding="0" cellspacing="0" align="center">
        <tr><td style="background:#fff8e1;width:56px;height:56px;border-radius:50%;text-align:center;line-height:56px;">
          <span style="font-size:26px;">&#128338;</span>
        </td></tr>
      </table>
      <div class="eyebrow" style="margin:24px 0 10px;color:${C.accent};">Awaiting payment confirmation</div>
      <h1 class="syne hero-h1" style="${SYNE800}font-size:38px;color:${C.ink};margin:0 0 12px;line-height:1.05;letter-spacing:-0.03em;">
        Almost there, ${esc(customer_name.split(' ')[0])}.
      </h1>
      <p style="font-size:15px;color:${C.muted};margin:0 auto;line-height:1.7;max-width:420px;">
        Your order is reserved. We're waiting for your Flutterwave payment to clear — this usually takes just a few seconds after you complete the checkout.
      </p>
    </td>
  </tr>

  <!-- order ID — ticket stub -->
  <tr>
    <td class="pad" style="padding:32px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:28px;background:${C.cream};border-radius:14px;text-align:center;">
          <div class="eyebrow" style="margin-bottom:10px;">Your order ID</div>
          <div class="syne id-num" style="${SYNE800}font-size:32px;color:${C.ink};letter-spacing:0.06em;line-height:1;">${esc(id)}</div>
          <div style="font-size:12px;color:${C.muted};margin-top:10px;">Save this — you can use it to track your order at any time</div>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- order summary -->
  <tr>
    <td class="pad" style="padding:28px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border-radius:14px;">
        <tr>
          <td style="padding:20px 24px;">
            <div class="eyebrow" style="margin-bottom:6px;">Reserved item</div>
            <div style="font-size:15px;font-weight:700;color:${C.ink};letter-spacing:-0.01em;">${esc(displayName)}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid ${C.border};">
              <tr>
                <td style="font-size:13px;color:${C.muted};padding-top:12px;">Amount</td>
                <td align="right" style="padding-top:12px;">
                  <span class="syne" style="${SYNE800}font-size:22px;color:${C.accent};">${fmtNgn(ngn_price)}</span>
                </td>
              </tr>
              ${forex_rate ? `<tr>
                <td style="font-size:12px;color:${C.subtle};padding-top:6px;">Forex rate</td>
                <td align="right" style="font-size:12px;color:${C.muted};padding-top:6px;font-weight:600;">&#8358;${Number(forex_rate).toLocaleString()} / $1</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- what happens next -->
  <tr>
    <td class="pad" style="padding:28px 40px 8px;">
      <div class="eyebrow" style="margin-bottom:20px;">What happens next</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;width:36px;padding-right:14px;padding-bottom:20px;">
            <div class="syne" style="${SYNE800}font-size:26px;color:${C.accentTint};line-height:1;">1</div>
          </td>
          <td style="vertical-align:top;padding-bottom:20px;">
            <div style="font-size:14px;font-weight:700;color:${C.ink};margin-bottom:3px;">Payment clears</div>
            <div style="font-size:13px;color:${C.muted};line-height:1.6;">Flutterwave verifies your payment automatically. Most cards and bank transfers clear within seconds.</div>
          </td>
        </tr>
        <tr>
          <td style="vertical-align:top;width:36px;padding-right:14px;padding-bottom:20px;">
            <div class="syne" style="${SYNE800}font-size:26px;color:${C.accentTint};line-height:1;">2</div>
          </td>
          <td style="vertical-align:top;padding-bottom:20px;">
            <div style="font-size:14px;font-weight:700;color:${C.ink};margin-bottom:3px;">Order confirmed</div>
            <div style="font-size:13px;color:${C.muted};line-height:1.6;">Once payment is verified you'll get a separate confirmation email with your full order details.</div>
          </td>
        </tr>
        <tr>
          <td style="vertical-align:top;width:36px;padding-right:14px;padding-bottom:20px;">
            <div class="syne" style="${SYNE800}font-size:26px;color:${C.accentTint};line-height:1;">3</div>
          </td>
          <td style="vertical-align:top;padding-bottom:20px;">
            <div style="font-size:14px;font-weight:700;color:${C.ink};margin-bottom:3px;">Procurement starts</div>
            <div style="font-size:13px;color:${C.muted};line-height:1.6;">We order directly from Apple US within 24 hours and keep you updated on WhatsApp.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- didn't get a confirmation? -->
  <tr>
    <td class="pad" style="padding:8px 40px 32px;border-bottom:1px solid ${C.hairline};">
      <div style="border:1px solid ${C.border};background:${C.cream};border-radius:14px;padding:20px 24px;">
        <div style="font-size:13px;font-weight:700;color:${C.ink};margin-bottom:6px;">Paid but didn't get a confirmation?</div>
        <p style="font-size:13px;color:${C.muted};line-height:1.65;margin:0 0 14px;">
          If your payment went through but you haven't received a confirmation email within 10 minutes, message us with your order ID and we'll sort it out immediately.
        </p>
        <a href="https://wa.me/${WA_NUM}?text=${encodeURIComponent(`Hi, I paid for my Certo order but haven't received a confirmation.\n\nOrder ID: ${id}`)}"
           style="display:inline-block;background:#25D366;color:#fff;font-size:13px;font-weight:700;padding:11px 22px;border-radius:9px;text-decoration:none;">
          &#128172;&nbsp; Message us on WhatsApp
        </a>
      </div>
    </td>
  </tr>

  ${footerBlock()}
  `;

  return shell({
    title: `Payment pending – ${id}`,
    preheader: `Almost there, ${customer_name.split(' ')[0]} — we're waiting for your Flutterwave payment to be confirmed for order ${id}.`,
    inner,
  });
}

async function sendPaymentPendingNairaEmail(order) {
  const html = pendingNairaHtml(order);
  return transporter.sendMail({
    from:    process.env.SMTP_USER ? `"Certo" <${process.env.SMTP_USER}>` : '"Certo" <noreply@certo.ng>',
    to:      `${order.customer_name} <${order.customer_email}>`,
    subject: `Almost there — payment pending for your Certo order (${order.id})`,
    html,
    text: `Hi ${order.customer_name},\n\nYour Certo order is reserved and we're waiting for your Flutterwave payment to be confirmed.\n\nOrder ID: ${order.id}\nAmount: ${fmtNgn(order.ngn_price)}\n\nOnce your payment clears you'll receive a separate confirmation email. This usually takes just a few seconds.\n\nIf your payment went through but you don't receive a confirmation within 10 minutes, message us:\nhttps://wa.me/${WA_NUM}\n\nCerto`,
  });
}

// ─── internal notifications ──────────────────────────────────────────────────

async function sendNewOrderNotification(order) {
  const {
    id, customer_name, customer_email, customer_phone,
    product_name, product_subtitle, usd_price, ngn_price,
    payment_method, status, items,
  } = order;

  const displayName = (() => {
    if (Array.isArray(items) && items.length > 1) return `${items.length} items`;
    if (Array.isArray(items) && items.length === 1) return [items[0].name, items[0].subtitle].filter(Boolean).join(' ');
    return [product_name, product_subtitle].filter(Boolean).join(' ');
  })();

  const isPending = status === 'Payment Pending';
  const statusColour = isPending ? '#d97757' : '#1f7a4d';
  const dashUrl = `${SITE}/dashboard`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>body{margin:0;padding:0;background:#f2f0ec;font-family:'Inter',-apple-system,sans-serif;}
  a{color:#d97757;}</style></head>
  <body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0ec;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#faf9f7;border-radius:14px;border:1px solid #e5e2db;overflow:hidden;">
        <!-- header -->
        <tr><td style="padding:20px 28px;background:#1a1714;border-bottom:3px solid ${statusColour};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family:'Georgia',serif;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Certo</td>
              <td align="right" style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${statusColour};">${isPending ? '⏳ Payment Pending' : '✅ New Order'}</td>
            </tr>
          </table>
        </td></tr>
        <!-- order ID -->
        <tr><td style="padding:24px 28px 0;">
          <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9a9387;margin-bottom:6px;">Order ID</div>
          <div style="font-size:28px;font-weight:800;color:#1a1714;letter-spacing:0.04em;font-family:'Georgia',serif;">${esc(id)}</div>
        </td></tr>
        <!-- details table -->
        <tr><td style="padding:20px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ece8e0;">
            ${[
              ['Customer',   `${esc(customer_name)} &lt;${esc(customer_email)}&gt;`],
              ['Phone',      esc(customer_phone)],
              ['Product',    esc(displayName)],
              ['USD total',  `$${Number(usd_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
              ['NGN total',  ngn_price ? `&#8358;${Number(ngn_price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : '—'],
              ['Payment',    esc(payment_method)],
              ['Status',     `<span style="font-weight:700;color:${statusColour};">${esc(status)}</span>`],
            ].map(([label, value]) => `
              <tr>
                <td style="padding:10px 0;font-size:12px;color:#706b60;border-bottom:1px solid #f2f0ec;width:110px;">${label}</td>
                <td style="padding:10px 0;font-size:13px;color:#1a1714;font-weight:600;border-bottom:1px solid #f2f0ec;">${value}</td>
              </tr>`).join('')}
          </table>
        </td></tr>
        <!-- CTA -->
        <tr><td style="padding:8px 28px 28px;text-align:center;">
          <a href="${dashUrl}" style="display:inline-block;background:#1a1714;color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:9px;text-decoration:none;">Open dashboard →</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;

  return transporter.sendMail({
    from:    process.env.SMTP_USER ? `"Certo" <${process.env.SMTP_USER}>` : '"Certo" <noreply@certo.ng>',
    to:      NOTIFY_EMAILS.join(', '),
    subject: `${isPending ? '⏳ Pending' : '🛍️ New order'} — ${esc(id)} · ${esc(customer_name)} · $${Number(usd_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    html,
    text:    `New order on Certo\n\nOrder ID: ${id}\nCustomer: ${customer_name} <${customer_email}>\nPhone: ${customer_phone}\nProduct: ${displayName}\nUSD: $${usd_price}\nNGN: ₦${ngn_price}\nPayment: ${payment_method}\nStatus: ${status}\n\nDashboard: ${dashUrl}`,
  });
}

async function sendContactNotification(msg) {
  const { name, email, message, created_at } = msg;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>body{margin:0;padding:0;background:#f2f0ec;font-family:'Inter',-apple-system,sans-serif;}</style>
  </head><body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0ec;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#faf9f7;border-radius:14px;border:1px solid #e5e2db;overflow:hidden;">
        <tr><td style="padding:20px 28px;background:#1a1714;border-bottom:3px solid #d97757;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family:'Georgia',serif;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Certo</td>
              <td align="right" style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#d97757;">💬 New message</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 28px 0;">
          <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9a9387;margin-bottom:4px;">From</div>
          <div style="font-size:20px;font-weight:700;color:#1a1714;margin-bottom:2px;">${esc(name)}</div>
          <div style="font-size:13px;color:#d97757;">${esc(email)}</div>
          ${created_at ? `<div style="font-size:11px;color:#9a9387;margin-top:4px;">${new Date(created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT</div>` : ''}
        </td></tr>
        <tr><td style="padding:20px 28px;">
          <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9a9387;margin-bottom:10px;">Message</div>
          <div style="font-size:15px;color:#1a1714;line-height:1.75;background:#f2f0ec;border-radius:10px;padding:16px 18px;white-space:pre-wrap;">${esc(message)}</div>
        </td></tr>
        <tr><td style="padding:8px 28px 28px;text-align:center;">
          <a href="mailto:${esc(email)}" style="display:inline-block;background:#d97757;color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:9px;text-decoration:none;">Reply to ${esc(name)} →</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;

  return transporter.sendMail({
    from:    process.env.SMTP_USER ? `"Certo" <${process.env.SMTP_USER}>` : '"Certo" <noreply@certo.ng>',
    to:      NOTIFY_EMAILS.join(', '),
    replyTo: `${esc(name)} <${esc(email)}>`,
    subject: `💬 New message from ${esc(name)} — Certo contact form`,
    html,
    text:    `New contact form message\n\nFrom: ${name} <${email}>\n\n${message}`,
  });
}

// ─── WhatsApp notification (CallMeBot) ───────────────────────────────────────
// Free self-notification service — register once, then use forever.
//
// Telegram Bot notifications
//
// Setup (one-time, ~2 minutes):
//   1. Open Telegram → search @BotFather → send /newbot → follow prompts
//      You'll receive a TOKEN like: 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
//   2. Open your new bot in Telegram and press Start (so it can message you)
//   3. Visit https://api.telegram.org/bot{TOKEN}/getUpdates in your browser
//      Find "chat":{"id": XXXXXXXXX} — that number is your CHAT_ID
//   4. Add these env vars in Vercel:
//        TELEGRAM_BOT_TOKEN = 123456789:ABCdef...
//        TELEGRAM_CHAT_ID   = XXXXXXXXX
//
// Supports multiple recipients — set TELEGRAM_CHAT_ID as a comma-separated list.

async function sendWhatsAppNotification(text) {
  const token   = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatIds = (process.env.TELEGRAM_CHAT_ID   || '').split(',').map(s => s.trim()).filter(Boolean);

  if (!token || !chatIds.length) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping notification');
    return;
  }

  const sends = chatIds.map(chatId => {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(8000),
    })
      .then(async r => {
        if (!r.ok) {
          const body = await r.text().catch(() => '');
          console.warn(`[telegram] API returned ${r.status} for chat ${chatId}:`, body);
        } else {
          console.log(`[telegram] Notification sent to chat ${chatId}`);
        }
      })
      .catch(err => console.warn(`[telegram] Failed for chat ${chatId}:`, err.message));
  });

  await Promise.allSettled(sends);
}

module.exports = {
  sendOrderConfirmation,
  sendStatusUpdate,
  sendCancellationEmail,
  sendPaymentPendingEmail,
  sendPaymentPendingNairaEmail,
  sendNewOrderNotification,
  sendContactNotification,
  sendWhatsAppNotification,
  transporter,
  // expose builders for previewing / testing
  orderConfirmationHtml,
  statusUpdateHtml,
  cancellationHtml,
  pendingPaymentHtml,
  pendingNairaHtml,
};
