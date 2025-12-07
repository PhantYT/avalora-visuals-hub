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
      `SELECT u.id, u.email, u.email_confirmed, u.created_at,
              p.username, p.avatar_url,
              array_agg(ur.role) as roles
       FROM users u
       LEFT JOIN profiles p ON p.id = u.id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       GROUP BY u.id, p.username, p.avatar_url
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
              u.email as owner_email,
              p_profile.username as owner_username,
              prod.name as product_name,
              prod.slug as product_slug,
              prod.is_beta as product_is_beta
       FROM licenses l
       LEFT JOIN users u ON l.owner_id = u.id
       LEFT JOIN profiles p_profile ON l.owner_id = p_profile.id
       LEFT JOIN products prod ON l.product_id = prod.id
       ORDER BY l.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Admin licenses error:', error);
    res.status(500).json({ error: 'Ошибка получения лицензий' });
  }
});

// Get products for license creation
router.get('/products', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, 
             json_agg(pt.*) as pricing_tiers
      FROM products p
      LEFT JOIN pricing_tiers pt ON pt.product_id = p.id
      GROUP BY p.id
      ORDER BY p.is_beta ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Ошибка получения продуктов' });
  }
});

// Generate license key
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 5;
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
    const { product_id, duration_type, duration_days, owner_email, hwid } = req.body;

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

    let expiresAt = null;
    if (duration_type !== 'lifetime' && duration_days) {
      expiresAt = new Date(Date.now() + parseInt(duration_days) * 24 * 60 * 60 * 1000);
    }

    await db.query(
      `INSERT INTO licenses (id, license_key, product_id, owner_id, expires_at, issued_by, is_active, duration_type, hwid, activated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9)`,
      [licenseId, licenseKey, product_id, ownerId, expiresAt, req.userId, duration_type || null, hwid || '', ownerId ? new Date() : null]
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
    const { is_active, expires_at, hwid, product_id, duration_type } = req.body;
    const { id } = req.params;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    if (expires_at !== undefined) {
      updates.push(`expires_at = $${paramIndex++}`);
      values.push(expires_at);
    }
    if (hwid !== undefined) {
      updates.push(`hwid = $${paramIndex++}`);
      values.push(hwid);
    }
    if (product_id !== undefined) {
      updates.push(`product_id = $${paramIndex++}`);
      values.push(product_id);
    }
    if (duration_type !== undefined) {
      updates.push(`duration_type = $${paramIndex++}`);
      values.push(duration_type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(id);
    await db.query(
      `UPDATE licenses SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
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
