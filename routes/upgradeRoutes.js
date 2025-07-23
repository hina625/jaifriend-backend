const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/', async (req, res) => {
  const { userId, plan } = req.body;
  if (!userId || !plan) return res.status(400).json({ error: 'userId and plan required' });
  try {
    const user = await User.findByIdAndUpdate(userId, { plan }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 