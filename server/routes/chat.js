// server/routes/chat.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ChatHistory = require('../models/ChatHistory');

/**
 * @route   GET api/chat
 * @desc    Get chat history for a user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Find chat history for the user or create new empty history
    let chatHistory = await ChatHistory.findOne({ userId: req.user.id });
    
    if (!chatHistory) {
      chatHistory = {
        userId: req.user.id,
        messages: [
          {
            text: "Hello! I'm your mental health companion. How can I help you today?",
            isUser: false,
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
    
    res.json(chatHistory);
  } catch (err) {
    console.error('Get chat history error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST api/chat/message
 * @desc    Add a new message to chat history
 * @access  Private
 */
router.post('/message', auth, async (req, res) => {
  try {
    const { text, isUser, isEmergency, resources } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }
    
    // Find chat history for the user or create new one
    let chatHistory = await ChatHistory.findOne({ userId: req.user.id });
    
    const newMessage = {
      text,
      isUser,
      isEmergency: isEmergency || false,
      resources: resources || [],
      timestamp: new Date().toISOString()
    };
    
    if (chatHistory) {
      // Add message to existing history
      chatHistory.messages.push(newMessage);
    } else {
      // Create new chat history
      chatHistory = new ChatHistory({
        userId: req.user.id,
        messages: [
          {
            text: "Hello! I'm your mental health companion. How can I help you today?",
            isUser: false,
            timestamp: new Date(Date.now() - 1000).toISOString() // Add initial message 1 second earlier
          },
          newMessage
        ]
      });
    }
    
    // Save chat history
    await chatHistory.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Add chat message error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE api/chat
 * @desc    Clear chat history
 * @access  Private
 */
router.delete('/', auth, async (req, res) => {
  try {
    // Find and remove chat history
    await ChatHistory.findOneAndRemove({ userId: req.user.id });
    
    // Create new chat history with initial message
    const newChatHistory = new ChatHistory({
      userId: req.user.id,
      messages: [
        {
          text: "Hello! I'm your mental health companion. How can I help you today?",
          isUser: false,
          timestamp: new Date().toISOString()
        }
      ]
    });
    
    await newChatHistory.save();
    res.json(newChatHistory);
  } catch (err) {
    console.error('Clear chat history error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;