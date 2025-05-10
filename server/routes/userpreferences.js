// server/routes/userPreferences.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

/**
 * @route   GET api/user-preferences
 * @desc    Get user preferences
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Return preferences or empty object if none exist
    res.json(user.preferences || {});
  } catch (err) {
    console.error('Get user preferences error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/user-preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/', auth, async (req, res) => {
  try {
    const preferences = req.body;
    
    // Update user preferences
    const user = await User.findById(req.user.id);
    user.preferences = {
      ...user.preferences,
      ...preferences
    };
    
    await user.save();
    res.json(user.preferences);
  } catch (err) {
    console.error('Update user preferences error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/user-preferences/triggers
 * @desc    Update user custom triggers
 * @access  Private
 */
router.put('/triggers', auth, async (req, res) => {
  try {
    const { triggers } = req.body;
    
    if (!Array.isArray(triggers)) {
      return res.status(400).json({ message: 'Triggers must be an array' });
    }
    
    // Update user's custom triggers
    const user = await User.findById(req.user.id);
    
    if (!user.preferences) {
      user.preferences = {};
    }
    
    user.preferences.triggers = triggers;
    await user.save();
    
    res.json(user.preferences);
  } catch (err) {
    console.error('Update triggers error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/user-preferences/activities
 * @desc    Update user custom activities
 * @access  Private
 */
router.put('/activities', auth, async (req, res) => {
  try {
    const { activities } = req.body;
    
    if (!Array.isArray(activities)) {
      return res.status(400).json({ message: 'Activities must be an array' });
    }
    
    // Update user's custom activities
    const user = await User.findById(req.user.id);
    
    if (!user.preferences) {
      user.preferences = {};
    }
    
    user.preferences.activities = activities;
    await user.save();
    
    res.json(user.preferences);
  } catch (err) {
    console.error('Update activities error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/user-preferences/ml-enabled
 * @desc    Toggle ML features
 * @access  Private
 */
router.put('/ml-enabled', auth, async (req, res) => {
  try {
    const { mlEnabled } = req.body;
    
    if (typeof mlEnabled !== 'boolean') {
      return res.status(400).json({ message: 'mlEnabled must be a boolean value' });
    }
    
    // Update user's ML preference
    const user = await User.findById(req.user.id);
    
    if (!user.preferences) {
      user.preferences = {};
    }
    
    user.preferences.mlEnabled = mlEnabled;
    await user.save();
    
    res.json(user.preferences);
  } catch (err) {
    console.error('Update ML preference error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;