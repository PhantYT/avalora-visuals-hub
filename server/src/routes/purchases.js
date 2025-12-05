const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user's purchases
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pu.*, l.license_key, p.name as product_name
       FROM purchases pu
       LEFT JOIN licenses l ON pu.license_id = l.id
       LEFT JOIN products p ON l.product_id = p.id
       WHERE pu.user_id = $1
       ORDER BY pu.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Purchases error:', error);
    res.status(500).json({ error: 'Ошибка получения покупок' });
  }
});

// Create purchase (placeholder - integrate with payment system)
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, pricing_tier_id, payment_method } = req.body;

    // Get pricing tier
    const tierResult = await db.query(
      'SELECT * FROM pricing_tiers WHERE id = $1',
      [pricing_tier_id]
    );

    if (tierResult.rows.length === 0) {
      return res.status(404).json({ error: 'Тариф не найден' });
    }

    const tier = tierResult.rows[0];

    // This is a placeholder - in production, integrate with payment gateway
    res.json({
      message: 'Перенаправление на оплату',
      amount: tier.price,
      payment_method,
      redirect_url: `/payment?amount=${tier.price}&method=${payment_method}`
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Ошибка создания покупки' });
  }
});

module.exports = router;
