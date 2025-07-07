const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const authenticateToken = require('../middleware/authMiddleware');

const isAdmin = req => req.user?.role === 'admin';

//
// 🔹 USER MANAGEMENT
//

// Create a new user manually (by admin)
router.post('/users', authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Access denied' });

  const { email, password, role } = req.body;

  if (!email || !password || !['mentee', 'mentor', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Missing or invalid fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
      [email, hashedPassword, role]
    );

    res.status(201).json({ message: '✅ User created successfully' });
  } catch (err) {
    console.error('User creation error:', err.message);
    res.status(500).json({ message: 'Server error creating user' });
  }
});

// Get all users
router.get('/users', authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Access denied' });

  try {
    const result = await pool.query('SELECT id, email, role FROM users');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
});

// Update user role
router.put('/users/:id/role', authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Access denied' });

  const { role } = req.body;
  const { id } = req.params;

  if (!['mentee', 'mentor', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified' });
  }

  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ message: '✅ Role updated successfully' });
  } catch (err) {
    console.error('Error updating role:', err.message);
    res.status(500).json({ message: 'Server error updating role' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Access denied' });

  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: '🗑️ User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

//
// 🔹 SESSION MANAGEMENT
//

// Create a session
router.post('/sessions', authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Access denied' });

  const { title, description, mentee_id, mentor_id, scheduled_at } = req.body;

  try {
    await pool.query(
      `INSERT INTO sessions (title, description, mentee_id, mentor_id, scheduled_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [title, description, mentee_id, mentor_id, scheduled_at]
    );

    res.json({ message: '✅ Session created successfully' });
  } catch (err) {
    console.error('Error creating session:', err.message);
    res.status(500).json({ message: 'Server error creating session' });
  }
});

// Get all sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Access denied' });

  try {
    const result = await pool.query(`
      SELECT s.*, mentee.email AS mentee_email, mentor.email AS mentor_email
      FROM sessions s
      LEFT JOIN users mentee ON s.mentee_id = mentee.id
      LEFT JOIN users mentor ON s.mentor_id = mentor.id
      ORDER BY s.scheduled_at ASC
    `);

    res.json({ sessions: result.rows });
  } catch (err) {
    console.error('Error fetching sessions:', err.message);
    res.status(500).json({ message: 'Failed to load sessions' });
  }
});

// Update session
router.put('/sessions/:id', authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Access denied' });

  const { title, description, mentee_id, mentor_id, scheduled_at } = req.body;
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE sessions
       SET title = $1, description = $2, mentee_id = $3, mentor_id = $4, scheduled_at = $5
       WHERE id = $6`,
      [title, description, mentee_id, mentor_id, scheduled_at, id]
    );

    res.json({ message: '✏️ Session updated successfully' });
  } catch (err) {
    console.error('Error updating session:', err.message);
    res.status(500).json({ message: 'Failed to update session' });
  }
});

module.exports = router;
