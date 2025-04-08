const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Apply authentication and role checking
router.use(auth.verifyToken);
router.use(auth.checkRole(['admin', 'finance']));

// Payment validation rules
const paymentValidation = [
  check('amount').isFloat({ min: 0.5 }).withMessage('Amount must be at least $0.50'),
  check('currency').isIn(['usd', 'eur', 'gbp']).withMessage('Invalid currency'),
  check('description').optional().isLength({ max: 255 })
];

// Process payment
router.post('/process', paymentValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, currency, description, token } = req.body;

  try {
    // Create Stripe charge
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description: description || 'Event management payment',
      source: token
    });

    // Record payment in database
    const payment = await db.one(
      `INSERT INTO payments(
        amount,
        currency,
        description,
        stripe_charge_id,
        paid_by,
        budget_id
      ) VALUES($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [amount, currency, description, charge.id, req.user.id, req.body.budget_id]
    );

    // Update budget if payment is for a specific budget
    if (req.body.budget_id) {
      await db.none(
        `UPDATE budgets
         SET paid_amount = COALESCE(paid_amount, 0) + $1
         WHERE id = $2`,
        [amount, req.body.budget_id]
      );
    }

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment history
router.get('/', async (req, res) => {
  try {
    const payments = await db.any(`
      SELECT p.*, u.name as payer_name, b.event_name
      FROM payments p
      JOIN users u ON p.paid_by = u.id
      LEFT JOIN budgets b ON p.budget_id = b.id
      ORDER BY p.created_at DESC
    `);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refund payment
router.post('/:id/refund', async (req, res) => {
  const { id } = req.params;

  try {
    // Get payment record
    const payment = await db.one('SELECT * FROM payments WHERE id = $1', [id]);

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      charge: payment.stripe_charge_id
    });

    // Update payment record
    await db.none(
      `UPDATE payments
       SET refunded = true,
           refund_amount = $1,
           refunded_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [payment.amount, id]
    );

    // Update budget if payment was for a budget
    if (payment.budget_id) {
      await db.none(
        `UPDATE budgets
         SET paid_amount = paid_amount - $1
         WHERE id = $2`,
        [payment.amount, payment.budget_id]
      );
    }

    res.json({ message: 'Refund processed successfully', refund });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;