const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, generateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const finalUsername = username || email.split('@')[0];

    // Create user
    await db.query(
      'INSERT INTO users (id, email, password_hash, username) VALUES ($1, $2, $3, $4)',
      [userId, email, passwordHash, finalUsername]
    );

    // Create profile
    await db.query(
      'INSERT INTO profiles (id, user_id, username) VALUES ($1, $2, $3)',
      [uuidv4(), userId, finalUsername]
    );

    // Assign default role
    await db.query(
      "INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, 'user')",
      [uuidv4(), userId]
    );

    const token = generateToken(userId);

    res.status(201).json({
      user: { id: userId, email, username: finalUsername },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    // Find user
    const result = await db.query(
      'SELECT id, email, username, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = generateToken(user.id);

    // Check if admin
    const roleResult = await db.query(
      "SELECT role FROM user_roles WHERE user_id = $1",
      [user.id]
    );
    const roles = roleResult.rows.map(r => r.role);

    res.json({
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username,
        roles 
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const roleResult = await db.query(
      "SELECT role FROM user_roles WHERE user_id = $1",
      [req.userId]
    );
    const roles = roleResult.rows.map(r => r.role);

    res.json({
      user: { ...req.user, roles }
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения данных' });
  }
});

// Logout (client-side, just return success)
router.post('/logout', (req, res) => {
  res.json({ message: 'Выход выполнен' });
});

module.exports = router;
