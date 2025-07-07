const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// 🔐 Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// ✅ DATABASE CONNECTION
const pool = require('./src/config/db');
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('DB connection error:', err.stack);
  } else {
    console.log('PostgreSQL connected at:', res.rows[0].now);
  }
});

// ✅ Middleware setup
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static File Serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Load Routes
app.use('/api', require('./src/routes/api'));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/profile', require('./src/routes/profile'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/mentee', require('./src/routes/mentee'));
app.use('/api/mentorship', require('./src/routes/mentorship')); // 🆕 Added mentorship system

// 🧼 Default route
app.get('/', (req, res) => {
  res.send('Welcome to MentoApp!');
});

// 🔚 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// 🚨 Global error handler
app.use((err, req, res, next) => {
  console.error('Internal server error:', err.stack);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
