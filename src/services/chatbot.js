// src/services/chatbot.js
import { chatService } from './api';

class ChatbotService {
  constructor() {
    this.conversationHistory = [];
    this.isProcessing = false;
  }

  // Process incoming message
  async processMessage(message) {
    if (this.isProcessing) {
      throw new Error('Still processing previous message');
    }

    try {
      this.isProcessing = true;

      // Check for crisis keywords
      if (chatService.detectCrisis(message)) {
        const emergencyResources = chatService.getEmergencyResources();
        this.addToHistory('user', message);
        this.addToHistory('system', emergencyResources.message);
        return {
          type: 'crisis',
          content: emergencyResources
        };
      }

      // Get AI response
      const response = await chatService.sendMessage(
        message, 
        this.conversationHistory
      );

      // Update conversation history
      this.addToHistory('user', message);
      this.addToHistory('assistant', response.content);

      return {
        type: 'normal',
        content: response.content
      };

    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  // Add message to conversation history
  addToHistory(role, content) {
    this.conversationHistory.push({ role, content });
    
    // Keep history at a reasonable size
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }
  }

  // Get suggested responses based on user's mood
  getSuggestedResponses(mood) {
    const suggestions = {
      'Very Happy': [
        "That's wonderful! What made your day so special?",
        "I'm glad you're feeling great! Want to share more?",
        "It's great to hear you're doing well! How can we maintain this positive energy?"
      ],
      'Happy': [
        "I'm happy to hear that! What's contributing to your good mood?",
        "That's great! Would you like to talk about what's going well?",
        "Wonderful! How can we build on these positive feelings?"
      ],
      'Neutral': [
        "How could we help improve your day?",
        "Would you like to talk about what's on your mind?",
        "Is there anything specific you'd like to focus on today?"
      ],
      'Sad': [
        "I'm here to listen. Would you like to talk about what's troubling you?",
        "It's okay to feel this way. What support would be most helpful right now?",
        "Would you like to explore some coping strategies together?"
      ],
      'Very Sad': [
        "I'm sorry you're feeling this way. Would you like to talk about it?",
        "Your feelings are valid. What kind of support would be most helpful right now?",
        "Let's take things one step at a time. What's on your mind?"
      ]
    };

    return suggestions[mood] || suggestions['Neutral'];
  }

  // Get coping strategies based on mood
  getCopingStrategies(mood) {
    const strategies = {
      'Very Sad': [
        {
          title: "Deep Breathing Exercise",
          description: "Try breathing in for 4 counts, hold for 4, out for 4",
          duration: "5 minutes"
        },
        {
          title: "Grounding Technique",
          description: "Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste",
          duration: "5 minutes"
        },
        {
          title: "Reach Out",
          description: "Consider connecting with a friend, family member, or professional",
          duration: "Varies"
        }
      ],
      'Sad': [
        {
          title: "Gentle Movement",
          description: "Take a short walk or do some light stretching",
          duration: "10-15 minutes"
        },
        {
          title: "Mindful Activity",
          description: "Focus on a simple task like making tea or organizing a small space",
          duration: "10 minutes"
        }
      ],
      'Neutral': [
        {
          title: "Gratitude Practice",
          description: "Write down three things you're grateful for today",
          duration: "5 minutes"
        },
        {
          title: "Goal Setting",
          description: "Set one small, achievable goal for the day",
          duration: "5 minutes"
        }
      ],
      'Happy': [
        {
          title: "Joy Journal",
          description: "Write about what's going well and how to maintain it",
          duration: "10 minutes"
        },
        {
          title: "Share Positivity",
          description: "Consider ways to spread your positive energy to others",
          duration: "Varies"
        }
      ],
      'Very Happy': [
        {
          title: "Celebration Practice",
          description: "Take time to fully appreciate and celebrate this moment",
          duration: "5 minutes"
        },
        {
          title: "Future Planning",
          description: "Channel this positive energy into planning future goals",
          duration: "15 minutes"
        }
      ]
    };

    return strategies[mood] || strategies['Neutral'];
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }
}

export default new ChatbotService();