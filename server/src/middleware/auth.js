const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const result = await db.query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = result.rows[0];
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истёк' });
    }
    return res.status(401).json({ error: 'Неверный токен' });
  }
};

// Check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin'",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Требуются права администратора' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка проверки прав' });
  }
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = { authenticate, requireAdmin, generateToken, JWT_SECRET };
