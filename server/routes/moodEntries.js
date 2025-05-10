// server/routes/moodEntries.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MoodEntry = require('../models/MoodEntry');

/**
 * @route   GET api/mood-entries
 * @desc    Get all mood entries for a user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const moodEntries = await MoodEntry.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(moodEntries);
  } catch (err) {
    console.error('Get mood entries error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST api/mood-entries
 * @desc    Create a new mood entry
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      mood,
      moodValue,
      note,
      triggers,
      activities,
      timeOfDay,
      sleepQuality,
      timestamp
    } = req.body;

    // Validate input
    if (!mood || !moodValue) {
      return res.status(400).json({ message: 'Mood and mood value are required' });
    }

    // Create new entry
    const newEntry = new MoodEntry({
      userId: req.user.id,
      mood,
      moodValue,
      note: note || '',
      triggers: triggers || [],
      activities: activities || [],
      timeOfDay: timeOfDay || '',
      sleepQuality: sleepQuality || 0.5,
      timestamp: timestamp || new Date().toISOString()
    });

    // Save entry
    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);
  } catch (err) {
    console.error('Create mood entry error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET api/mood-entries/:id
 * @desc    Get a specific mood entry
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const entry = await MoodEntry.findById(req.params.id);
    
    // Check if entry exists
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Check if user owns the entry
    if (entry.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this entry' });
    }
    
    res.json(entry);
  } catch (err) {
    console.error('Get mood entry error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT api/mood-entries/:id
 * @desc    Update a mood entry
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const entry = await MoodEntry.findById(req.params.id);
    
    // Check if entry exists
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Check if user owns the entry
    if (entry.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this entry' });
    }
    
    // Update fields
    const {
      mood,
      moodValue,
      note,
      triggers,
      activities,
      timeOfDay,
      sleepQuality
    } = req.body;
    
    if (mood) entry.mood = mood;
    if (moodValue) entry.moodValue = moodValue;
    if (note !== undefined) entry.note = note;
    if (triggers) entry.triggers = triggers;
    if (activities) entry.activities = activities;
    if (timeOfDay) entry.timeOfDay = timeOfDay;
    if (sleepQuality !== undefined) entry.sleepQuality = sleepQuality;
    
    // Save updated entry
    const updatedEntry = await entry.save();
    res.json(updatedEntry);
  } catch (err) {
    console.error('Update mood entry error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE api/mood-entries/:id
 * @desc    Delete a mood entry
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await MoodEntry.findById(req.params.id);
    
    // Check if entry exists
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Check if user owns the entry
    if (entry.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this entry' });
    }
    
    // Delete entry
    await entry.remove();
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    console.error('Delete mood entry error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;