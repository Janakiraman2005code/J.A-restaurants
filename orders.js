const express = require('express');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Place order (customer)
router.post('/', auth, requireRole('customer'), async (req, res) => {
  try {
    const { restaurantId, items } = req.body;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    const total = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
    const order = await Order.create({ customer: req.user._id, restaurant: restaurantId, items, total });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Partner: list orders for partner's restaurants
router.get('/partner', auth, requireRole('partner','admin'), async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id }).select('_id');
    const restIds = restaurants.map(r => r._id);
    const orders = await Order.find({ restaurant: { $in: restIds } }).populate('customer', 'name email');
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status (partner, delivery, admin)
router.patch('/:id/status', auth, requireRole('partner','delivery','admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // optional: check partner owns restaurant when partner updates
    if (req.user.role === 'partner') {
      const rest = await Restaurant.findById(order.restaurant);
      if (!rest.owner.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    }
    if (status) order.status = status;
    if (assignedTo) order.assignedTo = assignedTo;
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
