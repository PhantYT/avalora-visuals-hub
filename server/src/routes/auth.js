const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, generateToken } = require('../middleware/auth');
const { sendConfirmationEmail, sendPasswordResetEmail } = require('../services/email');

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

    const userId = uuidv4();
    const finalUsername = username || email.split('@')[0];

    // Create user (пароль без хеширования)
    await db.query(
      'INSERT INTO users (id, email, password) VALUES ($1, $2, $3)',
      [userId, email, password]
    );

    // Create profile
    await db.query(
      'INSERT INTO profiles (id, username) VALUES ($1, $2)',
      [userId, finalUsername]
    );

    // Assign default role
    await db.query(
      "INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, 'user')",
      [uuidv4(), userId]
    );

    // Create confirmation token
    const confirmToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    await db.query(
      'INSERT INTO email_confirmations (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [uuidv4(), userId, confirmToken, expiresAt]
    );

    // Send confirmation email
    try {
      await sendConfirmationEmail(email, finalUsername, confirmToken);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Не блокируем регистрацию если email не отправился
    }

    res.status(201).json({
      message: 'Регистрация успешна. Проверьте email для подтверждения.',
      requiresConfirmation: true
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// Confirm email
router.post('/confirm-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Токен обязателен' });
    }

    // Find confirmation
    const result = await db.query(
      'SELECT * FROM email_confirmations WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Недействительный или просроченный токен' });
    }

    const confirmation = result.rows[0];

    // Confirm email
    await db.query('UPDATE users SET email_confirmed = true WHERE id = $1', [confirmation.user_id]);

    // Delete confirmation token
    await db.query('DELETE FROM email_confirmations WHERE id = $1', [confirmation.id]);

    // Get user and generate token for auto-login
    const userResult = await db.query(
      'SELECT id, email, username FROM users u JOIN profiles p ON p.id = u.id WHERE u.id = $1',
      [confirmation.user_id]
    );
    
    const user = userResult.rows[0];
    const authToken = generateToken(user.id);

    res.json({
      message: 'Email подтвержден',
      user: { id: user.id, email: user.email, username: user.username },
      token: authToken
    });
  } catch (error) {
    console.error('Confirm email error:', error);
    res.status(500).json({ error: 'Ошибка подтверждения' });
  }
});

// Resend confirmation email
router.post('/resend-confirmation', async (req, res) => {
  try {
    const { email } = req.body;

    const userResult = await db.query(
      'SELECT u.id, u.email_confirmed, p.username FROM users u JOIN profiles p ON p.id = u.id WHERE u.email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];

    if (user.email_confirmed) {
      return res.status(400).json({ error: 'Email уже подтвержден' });
    }

    // Delete old tokens
    await db.query('DELETE FROM email_confirmations WHERE user_id = $1', [user.id]);

    // Create new token
    const confirmToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      'INSERT INTO email_confirmations (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [uuidv4(), user.id, confirmToken, expiresAt]
    );

    await sendConfirmationEmail(email, user.username, confirmToken);

    res.json({ message: 'Письмо отправлено' });
  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ error: 'Ошибка отправки' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    // Find user (проверка пароля без хеширования)
    const result = await db.query(
      'SELECT u.id, u.email, u.email_confirmed, u.password, p.username FROM users u JOIN profiles p ON p.id = u.id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];

    // Verify password (без хеширования)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Check email confirmation
    if (!user.email_confirmed) {
      return res.status(403).json({ 
        error: 'Email не подтвержден', 
        requiresConfirmation: true 
      });
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

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const userResult = await db.query(
      'SELECT u.id, p.username FROM users u JOIN profiles p ON p.id = u.id WHERE u.email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Не сообщаем что пользователь не найден (безопасность)
      return res.json({ message: 'Если email существует, письмо будет отправлено' });
    }

    const user = userResult.rows[0];

    // Delete old reset tokens
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);

    // Create reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await db.query(
      'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [uuidv4(), user.id, resetToken, expiresAt]
    );

    await sendPasswordResetEmail(email, user.username, resetToken);

    res.json({ message: 'Письмо для сброса пароля отправлено' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Ошибка отправки' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Токен и новый пароль обязательны' });
    }

    // Find reset token
    const result = await db.query(
      'SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW() AND used = false',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Недействительный или просроченный токен' });
    }

    const resetRecord = result.rows[0];

    // Update password (без хеширования)
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, resetRecord.user_id]);

    // Mark token as used
    await db.query('UPDATE password_resets SET used = true WHERE id = $1', [resetRecord.id]);

    // Get user for auto-login
    const userResult = await db.query(
      'SELECT u.id, u.email, p.username FROM users u JOIN profiles p ON p.id = u.id WHERE u.id = $1',
      [resetRecord.user_id]
    );
    
    const user = userResult.rows[0];
    const authToken = generateToken(user.id);

    res.json({
      message: 'Пароль успешно изменен',
      user: { id: user.id, email: user.email, username: user.username },
      token: authToken
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Ошибка сброса пароля' });
  }
});

// Change password (authenticated)
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Текущий и новый пароль обязательны' });
    }

    // Verify current password
    const result = await db.query('SELECT password FROM users WHERE id = $1', [req.userId]);
    
    if (result.rows[0].password !== currentPassword) {
      return res.status(400).json({ error: 'Неверный текущий пароль' });
    }

    // Update password
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, req.userId]);

    res.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Ошибка смены пароля' });
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
