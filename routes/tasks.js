const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// Apply authentication and role checking middleware
router.use(auth.verifyToken);
router.use(auth.checkRole(['admin', 'manager']));

// Validation rules
const taskValidation = [
  check('title').notEmpty().withMessage('Title is required'),
  check('description').optional().isLength({ max: 500 }),
  check('deadline').isISO8601().withMessage('Invalid deadline format'),
  check('assigned_to').isInt().withMessage('Invalid user ID')
];

// Create task with validation
router.post('/', taskValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, deadline, assigned_to } = req.body;
  try {
    const task = await db.one(
      `INSERT INTO tasks(title, description, deadline, assigned_to, status, created_by)
       VALUES($1, $2, $3, $4, 'pending', $5)
       RETURNING *`,
      [title, description, deadline, assigned_to, req.user.id]
    );
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tasks with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { status, assigned_to, from, to } = req.query;
    let query = `SELECT 
      t.*, 
      u.name as assignee_name,
      c.name as creator_name
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      JOIN users c ON t.created_by = c.id`;
    
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push(`t.status = $${conditions.length + 1}`);
      params.push(status);
    }

    if (assigned_to) {
      conditions.push(`t.assigned_to = $${conditions.length + 1}`);
      params.push(assigned_to);
    }

    if (from) {
      conditions.push(`t.deadline >= $${conditions.length + 1}`);
      params.push(from);
    }

    if (to) {
      conditions.push(`t.deadline <= $${conditions.length + 1}`);
      params.push(to);
    }

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.deadline ASC';

    const tasks = await db.any(query, params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get task analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await db.any(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks), 2) as percentage
      FROM tasks
      GROUP BY status
    `);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status
router.patch('/:id/status', [
  check('status').isIn(['pending', 'in_progress', 'completed'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const task = await db.one(
      `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.none('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
