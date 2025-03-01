import * as tf from '@tensorflow/tfjs';

class EnhancedChatbot {
  constructor() {
    this.conversationHistory = [];
    this.isInitialized = false;
    this.sentimentModel = null;
    this.embeddingCache = {};
    
    this.userProfile = {
      name: null,
      mentionedTopics: new Set(),
      emotions: [],
      preferences: {
        conversationStyle: 'supportive', // supportive, directive, analytical
        responseLength: 'medium' // short, medium, long
      },
      context: {}
    };
    
    // Much more extensive knowledge base
    this.knowledgeBase = {
      // Topic definitions with more detailed subtopics
      topics: {
        anxiety: {
          keywords: ['anxious', 'anxiety', 'worry', 'worried', 'nervous', 'panic', 'fear', 'stress', 'tense', 'restless', 'overthinking'],
          subtopics: {
            'general_anxiety': ['general anxiety', 'always anxious', 'constantly worried'],
            'social_anxiety': ['social anxiety', 'fear of people', 'scared in social', 'talking to people'],
            'panic_attacks': ['panic attack', 'heart racing', 'can\'t breathe', 'feel like dying'],
            'phobias': ['phobia', 'specific fear', 'afraid of', 'scared of']
          },
          techniques: [
            { name: 'deep_breathing', description: 'Try the 4-7-8 breathing technique: inhale for 4 seconds, hold for 7, exhale for 8.' },
            { name: 'grounding', description: 'Try the 5-4-3-2-1 technique: identify 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, and 1 thing you taste.' },
            { name: 'cognitive_restructuring', description: 'Challenge anxious thoughts by asking: What is the evidence? Is there another way to look at this? What would I tell a friend in this situation?'}
          ]
        },
        depression: {
          keywords: ['depressed', 'depression', 'sad', 'hopeless', 'unmotivated', 'down', 'unhappy', 'empty', 'numb', 'worthless', 'lost interest'],
          subtopics: {
            'general_depression': ['feeling down', 'everything is pointless', 'no joy'],
            'grief': ['loss', 'grief', 'someone died', 'passed away'],
            'seasonal': ['winter depression', 'seasonal', 'dark days', 'SAD'],
            'isolation': ['lonely', 'alone', 'no friends', 'isolated', 'no one understands']
          },
          techniques: [
            { name: 'behavioral_activation', description: 'Try to engage in one small activity that you used to enjoy, even if you do not feel like it right now.' },
            { name: 'thought_journal', description: 'Consider keeping a thought journal to identify negative thinking patterns and practice reframing them.' },
            { name: 'self_compassion', description: 'Try to speak to yourself with the same kindness you would offer to a good friend who was struggling.' }
          ]
        },
        // Add more detailed topics like this
      },
      
      // More sophisticated response templates
      responses: {
        greeting: [
          "Hello! I'm here to support you on your mental health journey. How are you feeling today?",
          "Welcome to Mindful Pathways. I'm your mental wellness companion. How can I help you today?",
          "Hi there! I'm your supportive AI companion. How are you doing right now?"
        ],
        
        // Add many more response categories
      },
      
      // Example conversations for context learning
      examples: [
        {
          input: "I've been feeling really anxious about my upcoming presentation",
          response: "That's understandable. Presentations can certainly trigger anxiety for many people. Would it help to talk about some techniques that might help manage presentation anxiety? Many find that preparation, visualization, and breathing exercises can make a difference."
        },
        // Add many more examples
      ]
    };
    
    // Initialize models
    this.init();
  }
  
  async init() {
    try {
      // In a real implementation, you would load pre-trained models here
      // For now, we'll simulate it
      console.log('Initializing enhanced chatbot models...');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize chatbot models:', error);
    }
  }
  
  async processMessage(message) {
    // Add message to history
    this.conversationHistory.push({
      role: 'user',
      content: message
    });
    
    // Update user profile
    this.updateUserProfile(message);
    
    // Analyze message for sentiment and intent
    const analysis = this.analyzeMessage(message);
    
    // Generate response based on analysis and context
    let response = this.generateContextualResponse(message, analysis);
    
    // Add to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response
    });
    
    // Prune history if needed
    this.pruneConversationHistory();
    
    return response;
  }
  
  analyzeMessage(message) {
    // In a real implementation, this would use ML for:
    // - Sentiment analysis (positive/negative/neutral)
    // - Intent detection (question, statement, request, etc)
    // - Topic classification
    // - Named entity recognition
    
    const result = {
      sentiment: this.estimateSentiment(message),
      topics: this.detectTopics(message),
      intent: this.detectIntent(message),
      entities: this.extractEntities(message),
      crisis: this.detectCrisis(message)
    };
    
    return result;
  }
  
  estimateSentiment(message) {
    // Simple rule-based sentiment estimation
    const positiveWords = ['happy', 'good', 'great', 'better', 'improving', 'hopeful', 'calm', 'peaceful'];
    const negativeWords = ['sad', 'bad', 'terrible', 'worse', 'hopeless', 'anxious', 'afraid', 'scared', 'depressed'];
    
    const lowerMessage = message.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) score += 1;
    });
    
    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) score -= 1;
    });
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }
  
  detectTopics(message) {
    const lowerMessage = message.toLowerCase();
    const detectedTopics = [];
    
    // Check each topic and its keywords
    Object.entries(this.knowledgeBase.topics).forEach(([topic, data]) => {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        detectedTopics.push(topic);
        
        // Check subtopics
        Object.entries(data.subtopics).forEach(([subtopic, keywords]) => {
          if (keywords.some(keyword => lowerMessage.includes(keyword))) {
            detectedTopics.push(`${topic}.${subtopic}`);
          }
        });
      }
    });
    
    return detectedTopics;
  }
  
  detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.endsWith('?')) return 'question';
    if (lowerMessage.includes('help me')) return 'request_help';
    if (lowerMessage.includes('thank')) return 'gratitude';
    if (this.isGreeting(lowerMessage)) return 'greeting';
    
    return 'statement';
  }
  
  extractEntities(message) {
    // In a real implementation, this would use NER
    // For now, simple pattern matching
    const entities = [];
    
    // Try to extract time references
    const timePatterns = [
      {pattern: /yesterday/i, type: 'time', value: 'yesterday'},
      {pattern: /today/i, type: 'time', value: 'today'},
      {pattern: /tomorrow/i, type: 'time', value: 'tomorrow'},
      {pattern: /(\d+)\s+(day|week|month|year)s?/i, type: 'time_period'}
    ];
    
    timePatterns.forEach(({pattern, type, value}) => {
      const match = message.match(pattern);
      if (match) {
        if (type === 'time_period') {
          entities.push({
            type,
            value: match[0],
            quantity: parseInt(match[1]),
            unit: match[2]
          });
        } else {
          entities.push({type, value: value || match[0]});
        }
      }
    });
    
    return entities;
  }
  
  generateContextualResponse(message, analysis) {
    // Handle crisis situation first (highest priority)
    if (analysis.crisis) {
      return this.getCrisisResponse();
    }
    
    // Build a contextually relevant response
    let response = '';
    
    // For greetings
    if (analysis.intent === 'greeting') {
      return this.getResponseByType('greeting');
    }
    
    // If we detected specific topics
    if (analysis.topics.length > 0) {
      const primaryTopic = analysis.topics[0]; // Use the first detected topic
      
      // Check if it's a subtopic
      if (primaryTopic.includes('.')) {
        const [mainTopic, subtopic] = primaryTopic.split('.');
        response = this.getTopicResponse(mainTopic, subtopic);
      } else {
        response = this.getTopicResponse(primaryTopic);
      }
      
      // Add personalized elements
      response = this.personalizeResponse(response);
      
      // For questions, add more specific information
      if (analysis.intent === 'question') {
        response += ' ' + this.getAdditionalInfo(primaryTopic);
      }
      
      return response;
    }
    
    // If no specific topics detected, use conversation history
    return this.getContextualFallbackResponse(message, analysis);
  }
  
  getTopicResponse(topic, subtopic = null) {
    const topicData = this.knowledgeBase.topics[topic];
    if (!topicData) return this.getResponseByType('fallback');
    
    // If subtopic is specified and exists
    if (subtopic && topicData.subtopics[subtopic]) {
      // In real implementation, would have specific responses for subtopics
      // For now, use techniques with subtopic context
      const technique = this.getRandomItem(topicData.techniques);
      return `I notice you're talking about ${subtopic.replace('_', ' ')} within the context of ${topic}. ${technique.description}`;
    }
    
    // General topic response
    const technique = this.getRandomItem(topicData.techniques);
    return `It sounds like you're dealing with some aspects of ${topic}. ${technique.description} Would you like to explore more techniques that might help?`;
  }
  
  getContextualFallbackResponse(message, analysis) {
    // Look at conversation history for context
    if (this.conversationHistory.length <= 2) {
      return this.getResponseByType('first_time_fallback');
    }
    
    // Check sentiment for emotional response
    if (analysis.sentiment === 'negative') {
      return this.getResponseByType('empathetic') + ' ' + this.getResponseByType('encouragement');
    }
    
    // Use follow-up questions to keep conversation going
    return this.getResponseByType('follow_up');
  }
  
  personalizeResponse(response) {
    // Add name if we know it
    if (this.userProfile.name) {
      const personalizations = [
        `${this.userProfile.name}, `,
        `I understand, ${this.userProfile.name}. `,
        ``  // Sometimes don't use the name
      ];
      
      return this.getRandomItem(personalizations) + response;
    }
    
    return response;
  }
  
  getResponseByType(type) {
    // In real implementation, would have extensive templates
    // For now, simple examples
    const templates = {
      greeting: [
        "Hello! I'm here to support you. How can I help today?",
        "Welcome! How are you feeling right now?",
        "Hi there! I'm glad you're here. What's on your mind today?"
      ],
      empathetic: [
        "That sounds really challenging.",
        "I hear that you're going through a difficult time.",
        "It makes sense that you'd feel that way."
      ],
      encouragement: [
        "Remember that small steps forward still count as progress.",
        "You've shown strength just by reaching out.",
        "Many people find that these feelings do change with time and support."
      ],
      follow_up: [
        "Could you tell me more about what's been on your mind?",
        "How long have you been feeling this way?",
        "What do you think might help you feel better right now?"
      ],
      first_time_fallback: [
        "I'm here to listen and support you. Feel free to share what's on your mind.",
        "I'm your mental health companion. What brings you here today?",
        "I'm here to help with whatever you'd like to discuss about your mental wellbeing."
      ],
      fallback: [
        "I appreciate you sharing that with me. How does that affect your day-to-day life?",
        "Thank you for telling me. How have you been managing these feelings so far?",
        "I'm listening. What would be most helpful for you right now?"
      ]
    };
    
    return this.getRandomItem(templates[type] || templates.fallback);
  }
  
  getAdditionalInfo(topic) {
    // Provide additional information based on topic
    const infoByTopic = {
      anxiety: "There are several evidence-based approaches for managing anxiety, including cognitive-behavioral therapy techniques, mindfulness practices, and in some cases, medication. Would you like to know more about any of these?",
      depression: "Depression is treatable through various approaches including therapy, lifestyle changes, social support, and sometimes medication. Different strategies work for different people, and it's okay to try different approaches."
      // Add more topics
    };
    
    return infoByTopic[topic] || "Would you like to explore some resources or strategies that might help with this?";
  }
  
  getCrisisResponse() {
    return "I'm concerned about what you've shared. If you're in crisis, please remember that immediate support is available through the National Crisis Hotline at 988, or you can text HOME to 741741 to reach the Crisis Text Line. Would it be possible for you to reach out to one of these services? Your safety is the top priority right now.";
  }
  
  detectCrisis(message) {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'better off dead', 
      'want to die', 'don\'t want to live', 'life is not worth',
      'self-harm', 'hurt myself', 'cut myself'
    ];
    
    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }
  
  updateUserProfile(message) {
    // Extract name if mentioned
    this.tryExtractName(message);
    
    // Update topics of interest
    const topics = this.detectTopics(message);
    topics.forEach(topic => {
      if (!topic.includes('.')) {  // Only add main topics
        this.userProfile.mentionedTopics.add(topic);
      }
    });
    
    // Track emotions
    const sentiment = this.estimateSentiment(message);
    this.userProfile.emotions.push({
      timestamp: new Date().toISOString(),
      sentiment: sentiment
    });
    
    // Limit emotional history
    if (this.userProfile.emotions.length > 10) {
      this.userProfile.emotions = this.userProfile.emotions.slice(-10);
    }
  }
  
  tryExtractName(message) {
    if (this.userProfile.name) return; // Already have name
    
    const namePatterns = [
      /my name is (\w+)/i,
      /i am (\w+)/i,
      /i'm (\w+)/i,
      /call me (\w+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        // Filter out common false positives
        const name = match[1];
        const falsePositives = ['sorry', 'feeling', 'just', 'really', 'very', 'not', 'so'];
        
        if (!falsePositives.includes(name.toLowerCase())) {
          this.userProfile.name = name;
          break;
        }
      }
    }
  }
  
  pruneConversationHistory() {
    // Keep last 20 messages for context
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }
  
  isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.toLowerCase().includes(greeting));
  }
  
  getRandomItem(array) {
    if (!array || array.length === 0) return '';
    return array[Math.floor(Math.random() * array.length)];
  }
  
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
}

// Export the enhanced chatbot
export const chatbotService = new EnhancedChatbot();