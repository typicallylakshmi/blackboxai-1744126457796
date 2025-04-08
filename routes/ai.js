const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Apply authentication middleware
router.use(auth.verifyToken);

// Get AI recommendations
router.get('/recommendations', async (req, res) => {
  try {
    // Get latest event data
    const [event] = await db.oneOrNone(`
      SELECT e.*, 
        (SELECT SUM(value::numeric) FROM jsonb_each_text(b.categories)) as budget_allocated,
        (SELECT SUM(value::numeric) FROM jsonb_each_text(b.spent)) as budget_spent
      FROM events e
      LEFT JOIN budgets b ON e.id = b.event_id
      ORDER BY e.date DESC LIMIT 1
    `);

    if (!event) {
      return res.json([]);
    }

    // Generate mock recommendations (in production would call AI service)
    const recommendations = [
      {
        type: 'vendor',
        title: 'Recommended Vendors',
        description: 'Top rated vendors matching your budget',
        data: await db.any(`
          SELECT * FROM vendors 
          WHERE rating >= 4 
          ORDER BY rating DESC 
          LIMIT 3
        `)
      },
      {
        type: 'budget',
        title: 'Budget Optimization',
        description: `Potential savings of 10-15% ($${Math.round(event.budget_allocated * 0.12)})`,
        details: [
          'Reduce catering costs by 8%',
          'Negotiate venue pricing',
          'Optimize marketing spend'
        ]
      },
      {
        type: 'attendance',
        title: 'Attendance Prediction',
        description: `Expected: ${Math.round(event.expected_attendees * 0.85)}-${Math.round(event.expected_attendees * 1.15)} attendees`,
        confidence: '75% based on similar events'
      }
    ];

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Chatbot endpoint
router.post('/chat', [
  auth.checkRole(['admin', 'manager']),
  check('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { message } = req.body;
  
  try {
    // Simple keyword-based responses (in production would call AI service)
    let response;
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('budget') || lowerMsg.includes('spend')) {
      const [budget] = await db.any(`
        SELECT 
          (SELECT SUM(value::numeric) FROM jsonb_each_text(categories)) as allocated,
          (SELECT SUM(value::numeric) FROM jsonb_each_text(spent)) as spent
        FROM budgets
        ORDER BY created_at DESC LIMIT 1
      `);
      
      response = `Current budget status: $${budget.spent} spent of $${budget.allocated} allocated.`;
    } 
    else if (lowerMsg.includes('task') || lowerMsg.includes('progress')) {
      const tasks = await db.one(`
        SELECT 
          COUNT(*) filter (WHERE status = 'completed') as completed,
          COUNT(*) as total
        FROM tasks
      `);
      response = `Task progress: ${tasks.completed} of ${tasks.total} tasks completed.`;
    }
    else if (lowerMsg.includes('vendor') || lowerMsg.includes('supplier')) {
      response = "You can manage vendors in the Vendors section. Would you like me to show top-rated vendors?";
    }
    else {
      response = "I can help with budget, tasks, and vendor questions. What would you like to know?";
    }

    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;