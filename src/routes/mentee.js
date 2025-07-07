const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

//
// 🔹 View Available Mentors
//
router.get('/mentors', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role FROM users WHERE role = 'mentor' ORDER BY email ASC`
    );
    res.json({ mentors: result.rows });
  } catch (err) {
    console.error('Error fetching mentors:', err.message);
    res.status(500).json({ message: 'Server error fetching mentors' });
  }
});

//
// 🔹 Request Mentorship
//
router.post('/requests', authenticateToken, async (req, res) => {
  const { mentor_id } = req.body;
  const mentee_id = req.user.id;

  try {
    await pool.query(
      `INSERT INTO mentorship_requests (mentee_id, mentor_id, status)
       VALUES ($1, $2, 'pending')`,
      [mentee_id, mentor_id]
    );
    res.json({ message: 'Mentorship request sent!' });
  } catch (err) {
    console.error('Error submitting request:', err.message);
    res.status(500).json({ message: 'Server error submitting request' });
  }
});

//
// 🔹 Book a Session
//
router.post('/sessions/book', authenticateToken, async (req, res) => {
  const { mentor_id, title, description, scheduled_at } = req.body;
  const mentee_id = req.user.id;

  try {
    await pool.query(
      `INSERT INTO sessions (title, description, mentee_id, mentor_id, scheduled_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [title, description, mentee_id, mentor_id, scheduled_at]
    );
    res.json({ message: 'Session booked successfully' });
  } catch (err) {
    console.error('Error booking session:', err.message);
    res.status(500).json({ message: 'Failed to book session' });
  }
});

module.exports = router;
