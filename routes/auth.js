const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');

router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  
  try {
    const user = await db.oneOrNone(
      'SELECT * FROM users WHERE username = $1 AND role = $2', 
      [username, role]
    );
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Password reset request
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  // Implementation would include:
  // 1. Generate reset token
  // 2. Send email with reset link
  // 3. Store token in database with expiration
  res.json({ message: 'Password reset link sent' });
});

module.exports = router;