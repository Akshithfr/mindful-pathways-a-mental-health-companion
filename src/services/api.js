// src/services/api.js
import OpenAI from 'openai';

// Check if API key exists
const apiKey = process.env.REACT_APP_DEEPSEEK_API_KEY;
if (!apiKey) {
  console.error('Missing API key! Make sure REACT_APP_DEEPSEEK_API_KEY is set in .env file');
}

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: apiKey || 'default_key', // Prevent initialization error
  dangerouslyAllowBrowser: true
});

export const chatService = {
  async sendMessage(message, context = []) {
    if (!apiKey) {
      throw new Error('API key not configured. Please check your .env file.');
    }

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a compassionate mental health support assistant...`
          },
          ...context,
          { role: "user", content: message }
        ],
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 500
      });

      return completion.choices[0].message;
    } catch (error) {
      console.error('Error in chat service:', error);
      throw new Error('Failed to get response from AI service');
    }
  },

  // Keep all other existing functions
  detectCrisis(message) {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die',
      'self-harm', 'hurt myself', 'no reason to live'
    ];

    return crisisKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  },

  getEmergencyResources() {
    return {
      message: "I'm concerned about your safety. Please consider these immediate resources:",
      resources: [
        {
          name: "National Crisis Hotline",
          number: "988",
          description: "24/7 support for mental health crises"
        },
        {
          name: "Crisis Text Line",
          number: "741741",
          description: "Text HOME for 24/7 crisis support"
        }
      ]
    };
  }
};

// Keep the moodService exactly as it was
export const moodService = {
  saveMoodEntry(entry) {
    try {
      const entries = this.getMoodEntries();
      entries.push({
        ...entry,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('moodEntries', JSON.stringify(entries));
      return true;
    } catch (error) {
      console.error('Error saving mood entry:', error);
      return false;
    }
  },

  getMoodEntries() {
    try {
      const entries = localStorage.getItem('moodEntries');
      return entries ? JSON.parse(entries) : [];
    } catch (error) {
      console.error('Error getting mood entries:', error);
      return [];
    }
  },

  analyzeMoodPatterns(entries) {
    if (!entries.length) return null;

    const moodScores = {
      'Very Happy': 5,
      'Happy': 4,
      'Neutral': 3,
      'Sad': 2,
      'Very Sad': 1
    };

    const averageMood = entries.reduce((sum, entry) => 
      sum + moodScores[entry.mood], 0) / entries.length;

    const moodCounts = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});

    const mostCommonMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    return {
      averageMood: averageMood.toFixed(1),
      mostCommonMood,
      totalEntries: entries.length
    };
  }
};