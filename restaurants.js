const express = require('express');
const Restaurant = require('../models/Restaurant');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public: list restaurants
router.get('/', async (req, res) => {
  const list = await Restaurant.find().populate('owner', 'name email');
  res.json(list);
});

// Partner: create restaurant
router.post('/partner', auth, requireRole('partner','admin'), async (req, res) => {
  try {
    const { name, address, cuisine, menu } = req.body;
    const rest = await Restaurant.create({ owner: req.user._id, name, address, cuisine, menu });
    res.json(rest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Partner: list own restaurants
router.get('/partner', auth, requireRole('partner','admin'), async (req, res) => {
  const list = await Restaurant.find({ owner: req.user._id });
  res.json(list);
});

module.exports = router;
