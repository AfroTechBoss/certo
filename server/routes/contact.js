const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { adminAuth } = require('../adminAuth');

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
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// DELETE /api/contact/:id  (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await pool.queryR('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
