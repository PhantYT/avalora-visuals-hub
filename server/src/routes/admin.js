const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.username, u.created_at,
              array_agg(ur.role) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

// Get all licenses
router.get('/licenses', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*, 
              u.email as owner_email, u.username as owner_username,
              p.name as product_name
       FROM licenses l
       LEFT JOIN users u ON l.owner_id = u.id
       LEFT JOIN products p ON l.product_id = p.id
       ORDER BY l.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Admin licenses error:', error);
    res.status(500).json({ error: 'Ошибка получения лицензий' });
  }
});

// Generate license key
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 4;
  const parts = [];
  
  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }
  
  return parts.join('-');
}

// Create license
router.post('/licenses', async (req, res) => {
  try {
    const { product_id, duration_days, owner_email } = req.body;

    const licenseKey = generateLicenseKey();
    const licenseId = uuidv4();
    
    let ownerId = null;
    if (owner_email) {
      const userResult = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [owner_email]
      );
      if (userResult.rows.length > 0) {
        ownerId = userResult.rows[0].id;
      }
    }

    const expiresAt = duration_days 
      ? new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000)
      : null;

    await db.query(
      `INSERT INTO licenses (id, license_key, product_id, owner_id, expires_at, issued_by, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [licenseId, licenseKey, product_id, ownerId, expiresAt, req.userId]
    );

    res.status(201).json({
      id: licenseId,
      license_key: licenseKey,
      expires_at: expiresAt
    });
  } catch (error) {
    console.error('Create license error:', error);
    res.status(500).json({ error: 'Ошибка создания лицензии' });
  }
});

// Update license
router.patch('/licenses/:id', async (req, res) => {
  try {
    const { is_active, expires_at } = req.body;
    const { id } = req.params;

    await db.query(
      `UPDATE licenses SET is_active = COALESCE($1, is_active), expires_at = COALESCE($2, expires_at)
       WHERE id = $3`,
      [is_active, expires_at, id]
    );

    res.json({ message: 'Лицензия обновлена' });
  } catch (error) {
    console.error('Update license error:', error);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// Delete license
router.delete('/licenses/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM licenses WHERE id = $1', [req.params.id]);
    res.json({ message: 'Лицензия удалена' });
  } catch (error) {
    console.error('Delete license error:', error);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [users, licenses, purchases] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active FROM licenses'),
      db.query('SELECT COUNT(*) as count, SUM(amount) as total FROM purchases WHERE status = $1', ['completed'])
    ]);

    res.json({
      users: parseInt(users.rows[0].count),
      licenses: parseInt(licenses.rows[0].count),
      active_licenses: parseInt(licenses.rows[0].active || 0),
      purchases: parseInt(purchases.rows[0].count),
      revenue: parseFloat(purchases.rows[0].total || 0)
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Ошибка статистики' });
  }
});

module.exports = router;
