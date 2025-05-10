const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  preferences: {
    mlEnabled: {
      type: Boolean,
      default: false
    },
    triggers: [String],
    activities: [String]
  }
});

module.exports = mongoose.model('user', UserSchema);