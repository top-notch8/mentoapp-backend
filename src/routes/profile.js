const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

// 🖼️ Setup multer for profile image upload
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.userId}${ext}`);
  },
});
const upload = multer({ storage });

// 🔐 POST /api/profile
router.post('/', authenticateToken, async (req, res) => {
  const { name, bio, skills, goals } = req.body;
  const userId = req.user.userId;

  if (!userId || !name || !bio) {
    return res.status(400).json({ message: 'Please fill required fields: name, bio' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO profiles (user_id, name, bio, skills, goals)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, name, bio, skills, goals]
    );

    res.status(201).json({
      message: 'Profile created successfully',
      profile: result.rows[0]
    });
  } catch (err) {
    console.error('🔥 Profile creation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📥 GET /api/profile → includes role and email
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  console.log(`📥 GET /api/profile → userId: ${userId}`);

  try {
    // Fetch or create blank profile
    let profile;
    const profileResult = await pool.query(
      `SELECT * FROM profiles WHERE user_id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      console.log('🆕 No profile found. Creating blank profile...');
      const insertResult = await pool.query(
        `INSERT INTO profiles (user_id, name, bio, skills, goals)
         VALUES ($1, '', '', ARRAY[]::text[], '')
         RETURNING *`,
        [userId]
      );
      profile = insertResult.rows[0];
    } else {
      profile = profileResult.rows[0];
    }

    // ✅ Fetch user email + role for role-aware frontend logic
    const userResult = await pool.query(
      `SELECT email, role FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0];

    res.status(200).json({ profile, user });
  } catch (err) {
    console.error('❌ Error fetching profile & user info:', err);
    res.status(500).json({ message: 'Server error loading profile' });
  }
});

// ✍️ PUT /api/profile (with image upload)
router.put('/', authenticateToken, upload.single('image'), async (req, res) => {
  const userId = req.user.userId;

  const name = req.body?.name || '';
  const bio = req.body?.bio || '';
  const goals = req.body?.goals || '';
  const skillsRaw = req.body?.skills || '';
  const skills = skillsRaw.split(',').map(s => s.trim());

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `UPDATE profiles
       SET name = $1, bio = $2, skills = $3, goals = $4, image = COALESCE($5, image)
       WHERE user_id = $6
       RETURNING *`,
      [name, bio, skills, goals, imageUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No profile found to update.' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      profile: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🗑️ DELETE /api/profile
router.delete('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `DELETE FROM profiles WHERE user_id = $1 RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No profile found to delete.' });
    }

    res.status(200).json({
      message: 'Profile deleted successfully',
      profile: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Error deleting profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
