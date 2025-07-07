const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

//
// 🔹 Mentee requests a mentor
//
router.post('/request', authenticateToken, async (req, res) => {
  const { mentor_id } = req.body;
  const mentee_id = req.user.id;

  try {
    await pool.query(
      `INSERT INTO mentorship_requests (mentee_id, mentor_id, status)
       VALUES ($1, $2, 'pending')`,
      [mentee_id, mentor_id]
    );
    res.json({ message: 'Mentor request sent' });
  } catch (err) {
    console.error('Request error:', err.message);
    res.status(500).json({ message: 'Failed to send request' });
  }
});

//
// 🔹 Mentor views incoming requests
//
router.get('/incoming', authenticateToken, async (req, res) => {
  const mentor_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT r.id, u.email AS mentee_email, r.status
       FROM mentorship_requests r
       JOIN users u ON r.mentee_id = u.id
       WHERE r.mentor_id = $1`,
      [mentor_id]
    );
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('View error:', err.message);
    res.status(500).json({ message: 'Failed to load requests' });
  }
});

//
// 🔹 Mentor accepts/rejects
//
router.put('/respond/:id', authenticateToken, async (req, res) => {
  const { status } = req.body;
  const requestId = req.params.id;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid response status' });
  }

  try {
    await pool.query(
      `UPDATE mentorship_requests SET status = $1 WHERE id = $2`,
      [status, requestId]
    );
    res.json({ message: `Request ${status}` });
  } catch (err) {
    console.error('Response error:', err.message);
    res.status(500).json({ message: 'Failed to update request status' });
  }
});

module.exports = router;
