const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// Apply authentication and role checking
router.use(auth.verifyToken);
router.use(auth.checkRole(['admin', 'finance']));

// Budget validation rules
const budgetValidation = [
  check('event_name').notEmpty().withMessage('Event name is required'),
  check('total_amount').isFloat({ min: 0 }).withMessage('Invalid amount'),
  check('categories').isObject().withMessage('Categories must be an object')
];

// Get all budgets with analytics
router.get('/', async (req, res) => {
  try {
    const budgets = await db.any(`
      SELECT 
        b.*,
        (SELECT SUM(value::numeric) FROM jsonb_each_text(b.categories)) as allocated,
        (SELECT SUM(value::numeric) FROM jsonb_each_text(b.spent)) as spent,
        u.name as creator_name
      FROM budgets b
      JOIN users u ON b.created_by = u.id
      ORDER BY b.created_at DESC
    `);
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new budget
router.post('/', budgetValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event_name, total_amount, categories } = req.body;
  
  try {
    const budget = await db.one(
      `INSERT INTO budgets(
        event_name, 
        total_amount, 
        categories,
        spent,
        created_by
      ) VALUES($1, $2, $3, '{}'::jsonb, $4)
      RETURNING *`,
      [event_name, total_amount, categories, req.user.id]
    );
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record expense
router.post('/:id/expenses', [
  check('amount').isFloat({ min: 0 }),
  check('category').notEmpty(),
  check('description').optional().isLength({ max: 255 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { amount, category, description } = req.body;

  try {
    // Record the expense transaction
    const expense = await db.one(
      `INSERT INTO expenses(
        budget_id,
        amount,
        category,
        description,
        recorded_by
      ) VALUES($1, $2, $3, $4, $5)
      RETURNING *`,
      [id, amount, category, description, req.user.id]
    );

    // Update budget spent amounts
    await db.none(
      `UPDATE budgets
       SET spent = jsonb_set(
         COALESCE(spent, '{}'::jsonb),
         array[$1],
         to_jsonb(COALESCE((spent->>$1)::numeric, 0) + $2)
       )
       WHERE id = $3`,
      [category, amount, id]
    );

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get budget analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await db.any(`
      SELECT 
        b.id,
        b.event_name,
        (SELECT SUM(value::numeric) FROM jsonb_each_text(b.categories)) as allocated,
        (SELECT SUM(value::numeric) FROM jsonb_each_text(b.spent)) as spent,
        (SELECT SUM(value::numeric) FROM jsonb_each_text(b.categories)) - 
          (SELECT SUM(value::numeric) FROM jsonb_each_text(b.spent)) as remaining,
        u.name as creator_name
      FROM budgets b
      JOIN users u ON b.created_by = u.id
      ORDER BY b.created_at DESC
    `);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get expenses for budget
router.get('/:id/expenses', async (req, res) => {
  const { id } = req.params;
  try {
    const expenses = await db.any(
      `SELECT e.*, u.name as recorded_by_name
       FROM expenses e
       JOIN users u ON e.recorded_by = u.id
       WHERE e.budget_id = $1
       ORDER BY e.created_at DESC`,
      [id]
    );
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get category breakdown
router.get('/:id/categories', async (req, res) => {
  const { id } = req.params;
  try {
    const budget = await db.one('SELECT categories, spent FROM budgets WHERE id = $1', [id]);
    
    const categories = Object.keys(budget.categories).map(category => ({
      name: category,
      allocated: parseFloat(budget.categories[category]),
      spent: parseFloat(budget.spent?.[category] || 0),
      remaining: parseFloat(budget.categories[category]) - parseFloat(budget.spent?.[category] || 0)
    }));

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
