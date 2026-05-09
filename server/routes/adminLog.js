const express    = require('express');
const router     = express.Router();
const pool       = require('../db');
const { adminAuth } = require('../adminAuth');
const transporter   = require('../email').transporter;

// GET /api/admin/logs  (admin — activity log)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 500`,
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// DELETE /api/admin/logs  (admin — export then clear)
// Silently emails the full log to the owner before wiping, regardless of who triggered it.
router.delete('/', adminAuth, async (req, res) => {
  try {
    // 1. Fetch all current log entries
    const { rows } = await pool.queryR(
      `SELECT * FROM admin_logs ORDER BY created_at DESC`,
    );

    // 2. Fire-and-forget: email the log export to the owner (no await — admin never knows)
    if (rows.length > 0) {
      sendLogExport(rows, req.adminName).catch(err =>
        console.error('[adminLog] Log-export email failed:', err.message)
      );
    }

    // 3. Delete all entries
    await pool.queryR('DELETE FROM admin_logs');

    // 4. Write a fresh entry noting the clear (after deletion so it survives)
    const logAdminAction = require('../logAdminAction');
    logAdminAction(req.adminName, 'Cleared activity log', `${rows.length} entries archived`).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_ICONS = {
  'Sign':    '🔐',
  'Update':  '✏️',
  'Create':  '➕',
  'Delete':  '🗑️',
  'Enable':  '✅',
  'Disable': '🔴',
  'Resent':  '✉️',
  'Status':  '🔄',
  'Flag':    '🚩',
  'Unflag':  '✅',
  'Note':    '📝',
  'Clear':   '🧹',
};

function iconFor(action = '') {
  for (const [prefix, icon] of Object.entries(ACTION_ICONS)) {
    if (action.startsWith(prefix)) return icon;
  }
  return '•';
}

function fmtDate(ts) {
  return new Date(ts).toLocaleString('en-NG', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

async function sendLogExport(rows, deletedBy) {
  const now = new Date().toLocaleString('en-NG', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Plain-text version
  const text = [
    `Certo Admin — Activity Log Export`,
    `Exported: ${now}`,
    `Deleted by: ${deletedBy || 'Unknown'}`,
    `Total entries: ${rows.length}`,
    '',
    '─'.repeat(60),
    ...rows.map(r =>
      `[${fmtDate(r.created_at)}]  ${r.admin_name}  —  ${r.action}${r.details ? `\n  Details: ${r.details}` : ''}`
    ),
  ].join('\n');

  // HTML version
  const tableRows = rows.map(r => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;white-space:nowrap;color:#6b7280;font-size:12px">${fmtDate(r.created_at)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;white-space:nowrap">
        <span style="background:#fff3ec;color:#c05621;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:700">${r.admin_name}</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;font-size:13px">${iconFor(r.action)} ${r.action}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#6b7280;font-size:13px">${r.details || ''}</td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:860px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <!-- Header -->
    <div style="background:#1a1a1a;padding:28px 36px">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px">Certo <span style="color:#c05621">Admin</span></div>
      <div style="font-size:13px;color:#9ca3af;margin-top:4px">Activity Log Export</div>
    </div>

    <!-- Summary -->
    <div style="padding:24px 36px;border-bottom:1px solid #e5e7eb;background:#fafafa">
      <table style="border-collapse:collapse;width:100%">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;width:140px">Exported at</td>
          <td style="padding:4px 0;font-size:13px;font-weight:600;color:#111">${now}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280">Deleted by</td>
          <td style="padding:4px 0;font-size:13px;font-weight:600;color:#c05621">${deletedBy || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280">Total entries</td>
          <td style="padding:4px 0;font-size:13px;font-weight:600;color:#111">${rows.length}</td>
        </tr>
      </table>
    </div>

    <!-- Log table -->
    <div style="padding:28px 36px">
      <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">Log entries (newest first)</div>
      <div style="overflow-x:auto">
        <table style="border-collapse:collapse;width:100%;min-width:600px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb">Timestamp</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb">Admin</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb">Action</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb">Details</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 36px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
      This report was automatically generated by Certo's admin system. Do not reply to this email.
    </div>
  </div>
</body>
</html>`;

  const fromAddr = process.env.SMTP_USER
    ? `"Certo System" <${process.env.SMTP_USER}>`
    : '"Certo System" <noreply@certo.ng>';

  await transporter.sendMail({
    from:    fromAddr,
    to:      'chidileozoemena@gmail.com, chidile@certo.ng',
    subject: `[Certo] Activity Log Exported — ${rows.length} entries — ${new Date().toDateString()}`,
    text,
    html,
  });
}

module.exports = router;
