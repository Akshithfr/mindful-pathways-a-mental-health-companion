const mongoose = require('mongoose');

const MoodEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mood: {
    type: String,
    required: true
  },
  moodValue: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  note: {
    type: String
  },
  triggers: {
    type: [String],
    default: []
  },
  activities: {
    type: [String],
    default: []
  },
  timeOfDay: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Night']
  },
  sleepQuality: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries by user and date
MoodEntrySchema.index({ userId: 1, timestamp: -1 });

const MoodEntry = mongoose.model('MoodEntry', MoodEntrySchema);

module.exports = MoodEntry;