const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user's licenses with product info
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*, 
              p.name as product_name, 
              p.slug as product_slug,
              p.is_beta as product_is_beta
       FROM licenses l
       LEFT JOIN products p ON l.product_id = p.id
       WHERE l.owner_id = $1
       ORDER BY l.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Licenses error:', error);
    res.status(500).json({ error: 'Ошибка получения лицензий' });
  }
});

// Activate license
router.post('/activate', authenticate, async (req, res) => {
  try {
    const { license_key } = req.body;

    if (!license_key) {
      return res.status(400).json({ error: 'Требуется ключ лицензии' });
    }

    // Find license
    const result = await db.query(
      'SELECT * FROM licenses WHERE license_key = $1',
      [license_key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Лицензия не найдена' });
    }

    const license = result.rows[0];

    if (license.owner_id && license.owner_id !== req.userId) {
      return res.status(400).json({ error: 'Лицензия уже активирована другим пользователем' });
    }

    if (!license.is_active) {
      return res.status(400).json({ error: 'Лицензия деактивирована' });
    }

    // Activate
    await db.query(
      `UPDATE licenses 
       SET owner_id = $1, activated_at = NOW() 
       WHERE id = $2`,
      [req.userId, license.id]
    );

    res.json({ message: 'Лицензия активирована' });
  } catch (error) {
    console.error('Activate error:', error);
    res.status(500).json({ error: 'Ошибка активации' });
  }
});

// Update HWID
router.put('/:id/hwid', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { hwid } = req.body;

    // Check if license belongs to user
    const result = await db.query(
      'SELECT * FROM licenses WHERE id = $1 AND owner_id = $2',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Лицензия не найдена' });
    }

    await db.query(
      'UPDATE licenses SET hwid = $1 WHERE id = $2',
      [hwid || '', id]
    );

    res.json({ message: 'HWID обновлен' });
  } catch (error) {
    console.error('Update HWID error:', error);
    res.status(500).json({ error: 'Ошибка обновления HWID' });
  }
});

module.exports = router;
