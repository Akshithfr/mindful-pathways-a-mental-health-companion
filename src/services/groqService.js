// src/services/groqService.js
class GroqService {
  constructor() {
    // Use your API key (the one that worked in your test)
    this.apiKey = process.env.REACT_APP_GROQ_API_KEY;;
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    // System prompt for mental health chatbot
    this.systemPrompt = `You are a compassionate mental health companion called Mindful Pathways. Your purpose is to:
    - Provide empathetic, non-judgmental responses
    - Help users explore their feelings and thoughts
    - Suggest evidence-based coping strategies when appropriate
    - Recognize signs of distress and provide appropriate resources
    - Never provide medical advice or diagnosis
    - Maintain a supportive and encouraging tone
    
    If you detect signs of crisis or serious mental health concerns, always include information about emergency resources like the National Crisis Hotline (988) or Crisis Text Line (text HOME to 741741).
    
    Keep responses concise, warm, and helpful.`;
  }

  async sendMessage(message, conversationHistory = [], model = 'llama-3.3-70b-versatile') {
    try {
      // Prepare messages array with system prompt
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ];
      
      // Use the exact same format that worked in your test
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 800
        })
      });
      
      const data = await response.json();
      
      // Return the assistant's message
      return data.choices[0].message;
    } catch (error) {
      console.error('Error calling Groq API:', error);
      throw error;
    }
  }

  // Add this method to match what the ChatBot component is calling
  async sendMessageWithModel(message, conversationHistory = [], model = 'llama-3.3-70b-versatile') {
    return this.sendMessage(message, conversationHistory, model);
  }

  detectCrisis(message) {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die',
      'self-harm', 'hurt myself', 'no reason to live'
    ];
    
    const lowerCaseMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerCaseMessage.includes(keyword));
  }

  getEmergencyResources() {
    return {
      message: "I'm concerned about what you've shared. Please consider these immediate resources:",
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
}

export default new GroqService();