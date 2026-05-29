const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { adminAuth } = require('../adminAuth');
const logAdminAction = require('../logAdminAction');
const { sendContactNotification, sendWhatsAppNotification } = require('../email');

// POST /api/contact  (public — submit a contact message)
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: 'Name, email, and message are required' });

  try {
    const { rows } = await pool.queryR(
      `INSERT INTO contact_messages (name, email, message)
       VALUES ($1, $2, $3) RETURNING id, created_at`,
      [name.trim(), email.trim(), message.trim()],
    );
    // Internal notification — fire-and-forget, non-fatal
    sendContactNotification({ name, email, message, created_at: rows[0].created_at })
      .catch(err => console.error('[notify] contact email failed:', err.message));

    const waText = `💬 New contact message!\n\nFrom: ${name} <${email}>\n\n${message}`;
    await sendWhatsAppNotification(waText).catch(err => console.error('[notify] Telegram notification failed:', err.message));

    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error('POST /contact:', err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// GET /api/contact  (admin — list all messages)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.queryR(
      `SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 500`,
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// PATCH /api/contact/:id  (admin — mark read/unread)
router.patch('/:id', adminAuth, async (req, res) => {
  const { read } = req.body;
  if (read === undefined) return res.status(400).json({ error: 'Nothing to update' });
  try {
    const { rows } = await pool.queryR(
      `UPDATE contact_messages SET read = $1 WHERE id = $2 RETURNING *`,
      [read, req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Message not found' });
    const action = read ? 'Marked message as read' : 'Marked message as unread';
    logAdminAction(req.adminName, action, `From: ${rows[0].name} <${rows[0].email}>`).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// DELETE /api/contact/:id  (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { rows: pre } = await pool.queryR('SELECT name, email FROM contact_messages WHERE id = $1', [req.params.id]);
    await pool.queryR('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
    logAdminAction(req.adminName, 'Deleted contact message', `From: ${pre[0]?.name || '?'} <${pre[0]?.email || '?'}>`).catch(() => {});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
