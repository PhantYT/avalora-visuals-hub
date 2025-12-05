const express = require('express');
const db = require('../db');

const router = express.Router();

// Get all products with pricing
router.get('/', async (req, res) => {
  try {
    const productsResult = await db.query(
      'SELECT * FROM products ORDER BY created_at'
    );

    const products = await Promise.all(
      productsResult.rows.map(async (product) => {
        const pricingResult = await db.query(
          'SELECT * FROM pricing_tiers WHERE product_id = $1 ORDER BY price',
          [product.id]
        );
        return {
          ...product,
          pricing_tiers: pricingResult.rows
        };
      })
    );

    res.json(products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Ошибка получения продуктов' });
  }
});

// Get single product
router.get('/:slug', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM products WHERE slug = $1',
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Продукт не найден' });
    }

    const product = result.rows[0];
    const pricingResult = await db.query(
      'SELECT * FROM pricing_tiers WHERE product_id = $1 ORDER BY price',
      [product.id]
    );

    res.json({
      ...product,
      pricing_tiers: pricingResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения продукта' });
  }
});

module.exports = router;
