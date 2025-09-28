const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// GET /api/users - listado solo lectura (admin)
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const { search, limit = 200, page = 1 } = req.query;
    const q = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      q.$or = [ { email: regex }, { firstName: regex }, { lastName: regex } ];
    }
    const numericLimit = Math.min(Number(limit), 500);
    const skip = (Number(page) - 1) * numericLimit;
    const [users, total] = await Promise.all([
      User.find(q)
        .sort('-createdAt')
        .skip(skip)
        .limit(numericLimit)
        .select('email firstName lastName role isEmailVerified lastLogin createdAt'),
      User.countDocuments(q)
    ]);
    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / numericLimit) || 1,
        total
      }
    });
  } catch (err) {
    console.error('Error listando usuarios:', err);
    res.status(500).json({ success: false, message: 'Error listando usuarios' });
  }
});

module.exports = router;