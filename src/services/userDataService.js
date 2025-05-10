import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

class UserDataService {
  constructor() {
    this.token = localStorage.getItem('token');
    
    // Set up axios interceptors
    this.initAxiosInterceptors();
  }
  
  initAxiosInterceptors() {
    // Add a request interceptor to include token
    axios.interceptors.request.use(
      config => {
        // Do not add token for auth endpoints
        if (config.url && !config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
          config.headers['x-auth-token'] = this.token || '';
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }
  
  initToken() {
    this.token = localStorage.getItem('token');
  }
  
  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }
  
  // User preferences with fallback to localStorage
  getUserPreferences(userId) {
    try {
      // Try MongoDB API first
      if (this.token) {
        return axios.get(`${API_URL}/preferences`).then(res => res.data);
      }
    } catch (error) {
      console.error('Error getting user preferences from API:', error);
    }
    
    // Fallback to localStorage
    try {
      const prefsString = localStorage.getItem(`userPrefs_${userId}`);
      return prefsString ? JSON.parse(prefsString) : { triggers: [], activities: [], mlEnabled: false };
    } catch (error) {
      console.error('Error getting user preferences from localStorage:', error);
      return { triggers: [], activities: [], mlEnabled: false };
    }
  }
  
  saveUserPreferences(userId, preferences) {
    try {
      // Try MongoDB API first
      if (this.token) {
        return axios.post(`${API_URL}/preferences`, preferences);
      }
    } catch (error) {
      console.error('Error saving user preferences to API:', error);
    }
    
    // Fallback to localStorage
    try {
      localStorage.setItem(`userPrefs_${userId}`, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences to localStorage:', error);
    }
  }
  
  // Mood entries with fallback to localStorage
  getMoodEntries(userId) {
    try {
      // Try MongoDB API first
      if (this.token) {
        return axios.get(`${API_URL}/mood-entries`).then(res => res.data);
      }
    } catch (error) {
      console.error('Error getting mood entries from API:', error);
    }
    
    // Fallback to localStorage
    try {
      const entriesString = localStorage.getItem('moodEntries') || 
                          localStorage.getItem(`moodEntries_${userId}`);
      return entriesString ? JSON.parse(entriesString) : [];
    } catch (error) {
      console.error('Error getting mood entries from localStorage:', error);
      return [];
    }
  }
  
  saveMoodEntries(userId, entries) {
    try {
      // Try MongoDB API first
      if (this.token) {
        return axios.post(`${API_URL}/mood-entries`, entries);
      }
    } catch (error) {
      console.error('Error saving mood entries to API:', error);
    }
    
    // Fallback to localStorage
    try {
      localStorage.setItem(`moodEntries_${userId}`, JSON.stringify(entries));
      localStorage.setItem('moodEntries', JSON.stringify(entries)); // For backward compatibility
    } catch (error) {
      console.error('Error saving mood entries to localStorage:', error);
    }
  }
  
  addMoodEntry(userId, entry) {
    try {
      // Try MongoDB API first
      if (this.token) {
        return axios.post(`${API_URL}/mood-entries/add`, entry);
      }
    } catch (error) {
      console.error('Error adding mood entry to API:', error);
    }
    
    // Fallback to localStorage
    try {
      const entries = this.getMoodEntries(userId);
      entries.push(entry);
      this.saveMoodEntries(userId, entries);
    } catch (error) {
      console.error('Error adding mood entry to localStorage:', error);
    }
  }
  
  // Chat history with fallback
  getChatHistory() {
    try {
      // Try MongoDB API first
      if (this.token) {
        return axios.get(`${API_URL}/chat`).then(res => res.data);
      }
    } catch (error) {
      console.error('Error getting chat history from API:', error);
    }
    
    // Fallback to localStorage
    try {
      const historyString = localStorage.getItem('chatHistory');
      return historyString ? JSON.parse(historyString) : { messages: [] };
    } catch (error) {
      console.error('Error getting chat history from localStorage:', error);
      return { messages: [] };
    }
  }
  
  addChatMessage(message) {
    try {
      // Try MongoDB API first
      if (this.token) {
        return axios.post(`${API_URL}/chat/message`, message);
      }
    } catch (error) {
      console.error('Error adding chat message to API:', error);
    }
    
    // Fallback to localStorage
    try {
      const history = this.getChatHistory();
      history.messages.push(message);
      localStorage.setItem('chatHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error adding chat message to localStorage:', error);
    }
  }
  
  // ML model with fallback
  saveMLModel(modelName, modelData, metrics) {
    try {
      // Try MongoDB API first
      if (this.token) {
        return axios.post(`${API_URL}/ml-models`, {
          name: modelName,
          data: modelData,
          metrics
        });
      }
    } catch (error) {
      console.error('Error saving ML model to API:', error);
    }
    
    // Metrics are saved separately in localStorage
    try {
      localStorage.setItem(`ml-model-metrics-${modelName}`, JSON.stringify(metrics));
    } catch (error) {
      console.error('Error saving ML model metrics to localStorage:', error);
    }
  }
  
  getMLModel(modelName) {
    try {
      // Try MongoDB API first
      if (this.token) {
        return axios.get(`${API_URL}/ml-models/${modelName}`).then(res => res.data);
      }
    } catch (error) {
      console.error('Error getting ML model from API:', error);
    }
    
    // For ML models, we don't have a complete localStorage fallback since models are stored via TensorFlow.js
    // but we can return metrics
    try {
      const metricsString = localStorage.getItem(`ml-model-metrics-${modelName}`);
      return metricsString ? { metrics: JSON.parse(metricsString) } : null;
    } catch (error) {
      console.error('Error getting ML model metrics from localStorage:', error);
      return null;
    }
  }
}

export const userDataService = new UserDataService();