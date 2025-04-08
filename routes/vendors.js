const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await db.any(`
      SELECT v.*, u.email 
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      ORDER BY v.rating DESC
    `);
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new vendor
router.post('/', async (req, res) => {
  const { company_name, contact_person, services } = req.body;
  
  try {
    const vendor = await db.one(
      `INSERT INTO vendors(user_id, company_name, contact_person, services)
       VALUES($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, company_name, contact_person, services]
    );
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update vendor rating
router.patch('/:id/rating', async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;

  try {
    const vendor = await db.one(
      `UPDATE vendors SET rating = $1 WHERE id = $2 RETURNING *`,
      [rating, id]
    );
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;