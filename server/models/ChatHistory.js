const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  isUser: {
    type: Boolean,
    required: true,
    default: false
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  resources: {
    type: Array,
    default: []
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [MessageSchema]
}, { timestamps: true });

const ChatHistory = mongoose.model('ChatHistory', ChatHistorySchema);

module.exports = ChatHistory;