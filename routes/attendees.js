const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all attendees
router.get('/', async (req, res) => {
  try {
    const attendees = await db.any(`
      SELECT a.*, u.email, u.username
      FROM attendees a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(attendees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register new attendee
router.post('/', async (req, res) => {
  const { first_name, last_name, preferences } = req.body;
  
  try {
    const attendee = await db.one(
      `INSERT INTO attendees(user_id, first_name, last_name, preferences)
       VALUES($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, first_name, last_name, preferences]
    );
    res.status(201).json(attendee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update attendee preferences
router.patch('/:id/preferences', async (req, res) => {
  const { id } = req.params;
  const { preferences } = req.body;

  try {
    const attendee = await db.one(
      `UPDATE attendees SET preferences = $1 WHERE id = $2 RETURNING *`,
      [preferences, id]
    );
    res.json(attendee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;