import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Send, Settings } from 'lucide-react';
import groqService from '../../services/groqService';
import { userDataService } from '../../services/userDataService';
import { useAuth } from '../../context/AuthContext';

const ChatBot = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your mental health companion. How can I help you today?", isUser: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Enable voice by default
  const [isListening, setIsListening] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  // Added GPT-4 voice-specific settings
  const [speechRate, setSpeechRate] = useState(1.0); // Natural speed
  const [speechPitch, setSpeechPitch] = useState(1.0); // Natural pitch
  const messagesEndRef = useRef(null);
  const recognition = useRef(null);
  const speechSynthesis = window.speechSynthesis;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        // Don't auto-send; let the user review their speech-to-text first (more GPT-like)
      };
      
      recognition.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognition.current) {
        recognition.current.abort();
      }
    };
  }, []);

  // Initialize voice synthesis
  useEffect(() => {
    // This helps with loading voices in some browsers
    speechSynthesis.onvoiceschanged = () => {
      console.log("Voices loaded:", speechSynthesis.getVoices().length);
      const gptLikeVoice = getGptLikeVoice();
      if (gptLikeVoice && !selectedVoice) {
        setSelectedVoice(gptLikeVoice.name);
      }
    };
    
    // Force voices to load
    speechSynthesis.getVoices();
    
    // Speak the initial greeting after a small delay
    setTimeout(() => {
      if (voiceEnabled && messages.length > 0) {
        speakText(messages[0].text);
      }
    }, 800);
    
    // Clean up
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Load chat history from database
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await userDataService.getChatHistory();
        if (history && history.messages && history.messages.length > 0) {
          setMessages(history.messages);
          
          // Extract conversation history for the AI context
          const aiHistory = history.messages
            .filter(msg => !msg.isEmergency) // Skip emergency messages
            .map(msg => ({ 
              role: msg.isUser ? 'user' : 'assistant', 
              content: msg.text 
            }));
          
          setConversationHistory(aiHistory);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    
    if (currentUser) {
      loadChatHistory();
    }
  }, [currentUser]);

  // Helper function to find a GPT-4 like voice
  const getGptLikeVoice = () => {
    // Get all available voices
    const voices = speechSynthesis.getVoices();
    
    // Priority list for GPT-like voices (more natural, warm, slightly deeper)
    const preferredVoices = [
      // Higher quality voices that sound natural
      "Daniel", // High-quality British male voice on macOS (similar to ChatGPT)
      "Samantha", // High-quality female voice on macOS
      "Google UK English Male", // Good quality British male voice
      "Microsoft Guy", // Natural male voice on Windows
      "Microsoft David", // Good quality voice
      // Fallbacks
      "Google US English", 
      "en-US-Neural2-D", // Deep neural network voice
      "Alex", // macOS
      "Microsoft Mark"
    ];
    
    // Try to find one of our preferred voices
    for (const preferredVoice of preferredVoices) {
      const match = voices.find(voice => 
        voice.name.includes(preferredVoice)
      );
      if (match) return match;
    }
    
    // Fallback: look for any English voice that sounds natural (non-robotic)
    const englishVoice = voices.find(voice => 
      (voice.lang === 'en-US' || voice.lang === 'en_US' || 
       voice.lang === 'en-GB' || voice.lang === 'en_GB')
    );
    if (englishVoice) return englishVoice;
    
    // Final fallback: just use the first available voice
    return voices[0];
  };

  // Function to toggle speech recognition
  const toggleListening = () => {
    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Create user message
    const userMessage = { 
      text: inputText, 
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);
    
    // Save message to database if authenticated
    if (currentUser) {
      try {
        await userDataService.addChatMessage(userMessage);
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }
    
    // Add to conversation history for API
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: inputText }
    ];
    setConversationHistory(updatedHistory);
    
    setIsLoading(true);
    setInputText('');
    
    try {
      // Check for crisis keywords
      if (groqService.detectCrisis(inputText)) {
        const resources = groqService.getEmergencyResources();
        const newMessage = { 
          text: resources.message, 
          isUser: false,
          isEmergency: true,
          resources: resources.resources,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Save emergency message to database if authenticated
        if (currentUser) {
          try {
            await userDataService.addChatMessage(newMessage);
          } catch (error) {
            console.error('Error saving emergency message:', error);
          }
        }
        
        // Speak the emergency message if voice is enabled
        if (voiceEnabled) {
          speakText(resources.message);
        }
      } else {
        // Get response from chatbot service
        const response = await groqService.sendMessage(inputText, conversationHistory);
        
        // Process response for more GPT-like phrasing (thoughtful, slightly verbose)
        const gptFormattedResponse = processResponseForGpt(response.content);
        
        // Create bot message
        const botMessage = { 
          text: gptFormattedResponse, 
          isUser: false,
          timestamp: new Date().toISOString()
        };
        
        // Add response to UI
        setMessages(prev => [...prev, botMessage]);
        
        // Save bot message to database if authenticated
        if (currentUser) {
          try {
            await userDataService.addChatMessage(botMessage);
          } catch (error) {
            console.error('Error saving bot message:', error);
          }
        }
        
        // Add to conversation history
        setConversationHistory([
          ...updatedHistory,
          { role: 'assistant', content: gptFormattedResponse }
        ]);
        
        // Speak the response if voice is enabled
        if (voiceEnabled) {
          speakText(gptFormattedResponse);
        }
      }
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage = {
        text: "I apologize, but I'm encountering a technical issue at the moment. Could you please try again?",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to database if authenticated
      if (currentUser) {
        try {
          await userDataService.addChatMessage(errorMessage);
        } catch (saveError) {
          console.error('Error saving error message:', saveError);
        }
      }
      
      if (voiceEnabled) {
        speakText(errorMessage.text);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Process response to make it more GPT-4 like
  const processResponseForGpt = (text) => {
    // GPT-4 tends to be thorough and thoughtful in responses
    // This function maintains the tone rather than shortening responses
    
    // Make certain phrases more GPT-like
    let gptText = text
      .replace(/I'm sorry/gi, "I apologize")
      .replace(/can't/gi, "cannot")
      .replace(/don't/gi, "do not")
      .replace(/won't/gi, "will not")
      .replace(/Let me know/gi, "Please let me know")
      .replace(/Tell me/gi, "I'd be interested to hear");
    
    return gptText;
  };

  // Function to handle text-to-speech with GPT-like voice settings
  const speakText = (text) => {
    // Stop any ongoing speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    // Add slight pause before speaking (feels more natural)
    setTimeout(() => {
      // Break text into manageable chunks to improve speech flow
      const textChunks = chunkText(text);
      
      // Speak each chunk with a slight pause between
      textChunks.forEach((chunk, index) => {
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(chunk);
          
          // Set voice properties with GPT-like settings
          utterance.rate = speechRate;
          utterance.pitch = speechPitch;
          utterance.volume = 0.9; // Slightly softer than max volume for natural feel
          
          // Get available voices
          let voices = speechSynthesis.getVoices();
          
          // If no voices are available yet, wait and try again
          if (voices.length === 0) {
            setTimeout(() => {
              voices = speechSynthesis.getVoices();
              setVoiceFromSelection(utterance, voices);
              speechSynthesis.speak(utterance);
            }, 100);
            return;
          }
          
          // Set the selected voice
          setVoiceFromSelection(utterance, voices);
          
          // Events to track speaking status
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => {
            // Only set speaking to false after the last chunk finishes
            if (index === textChunks.length - 1) {
              setIsSpeaking(false);
            }
          };
          utterance.onerror = () => setIsSpeaking(false);
          
          // Start speaking
          speechSynthesis.speak(utterance);
        }, index * 50); // Small delay between chunks for more natural pauses
      });
    }, 150); // Slight initial pause feels more natural
  };
  
  // Helper function to break text into manageable chunks for better speech synthesis
  const chunkText = (text) => {
    // First split by sentences
    const sentenceBreaks = text.split(/(?<=[.!?])\s+/);
    
    // Then ensure no chunk is too long (for better speech synthesis)
    const chunks = [];
    sentenceBreaks.forEach(sentence => {
      if (sentence.length > 150) {
        // Further break long sentences at commas or natural pauses
        const subChunks = sentence.split(/(?<=,|;)\s+/);
        chunks.push(...subChunks);
      } else {
        chunks.push(sentence);
      }
    });
    
    return chunks;
  };
  
  // Helper to set voice from selection or best available
  const setVoiceFromSelection = (utterance, voices) => {
    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
        return;
      }
    }
    
    // Fallback to best GPT-like voice
    utterance.voice = getGptLikeVoice();
  };

  // Toggle voice functionality
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    
    // If turning on and there are messages, speak the last one
    if (!voiceEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser) {
        speakText(lastMessage.text);
      }
    } else if (speechSynthesis.speaking) {
      // If turning off and currently speaking, stop
      speechSynthesis.cancel();
    }
  };

  // Clear chat history
  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      try {
        if (currentUser) {
          await userDataService.clearChatHistory();
        }
        
        // Reset to initial state
        const initialMessage = {
          text: "Hello! I'm your mental health companion. How can I help you today?",
          isUser: false,
          timestamp: new Date().toISOString()
        };
        
        setMessages([initialMessage]);
        setConversationHistory([]);
        
        // Speak the initial message if voice is enabled
        if (voiceEnabled) {
          speakText(initialMessage.text);
        }
      } catch (error) {
        console.error("Error clearing chat history:", error);
      }
    }
  };

  // Component for voice settings
  const VoiceSettingsPanel = () => {
    const [voices, setVoices] = useState([]);
    
    useEffect(() => {
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
      };
      
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        speechSynthesis.onvoiceschanged = null;
      };
    }, []);
    
    const testVoice = () => {
      speakText("Hello, I'm your mental health companion. I'm here to listen and provide support whenever you need it.");
    };
    
    return (
      <div className="p-4 bg-[#232F3E] border border-gray-700 rounded-lg shadow-lg absolute right-0 top-12 z-10 w-64 text-white">
        <h3 className="font-medium mb-2 text-[#00a0c6]">Voice Settings</h3>
        
        <div className="mb-3">
          <label className="block text-sm text-gray-300 mb-1">Select Voice</label>
          <select 
            value={selectedVoice || ''}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full p-2 border bg-[#37475A] border-gray-600 rounded text-sm text-white"
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm text-gray-300 mb-1">
            Speech Rate: {speechRate.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.8"
            max="1.2"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full accent-[#00a0c6]"
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-sm text-gray-300 mb-1">
            Pitch: {speechPitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.8"
            max="1.2"
            step="0.1"
            value={speechPitch}
            onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
            className="w-full accent-[#00a0c6]"
          />
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={testVoice}
            className="px-3 py-1 bg-[#00a0c6] text-white text-sm rounded hover:bg-[#0097b8]"
          >
            Test Voice
          </button>
          <button 
            onClick={() => setShowVoiceSettings(false)}
            className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-gradient-to-b from-[#232F3E] to-[#131921] rounded-lg shadow-lg">
      {/* Chat Header with Voice Control - Alexa themed */}
      <div className="border-b border-gray-700 p-4 flex justify-between items-center">
        <h2 className="font-semibold text-lg text-white flex items-center">
          <div className="w-6 h-6 rounded-full bg-[#00a0c6] mr-2"></div>
          Mental Health Companion
        </h2>
        <div className="flex space-x-2 relative">
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-full ${voiceEnabled ? 'bg-[#00a0c6] text-white' : 'bg-gray-700 text-gray-300'}`}
            aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
            title={voiceEnabled ? "Disable voice" : "Enable voice"}
          >
            {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          {voiceEnabled && (
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600"
              aria-label="Voice settings"
              title="Voice settings"
            >
              <Settings size={20} />
            </button>
          )}
          
          {/* Clear chat button */}
          <button
            onClick={handleClearChat}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600"
            aria-label="Clear chat history"
            title="Clear chat history"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
          
          {showVoiceSettings && voiceEnabled && <VoiceSettingsPanel />}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#232F3E] bg-opacity-90">
        {messages.map((message, index) => (
          <div key={index}>
            {message.isEmergency ? (
              <div className="bg-red-900 border border-red-700 rounded-lg p-4 mr-auto max-w-[80%] text-white">
                <p className="font-medium text-white mb-2">{message.text}</p>
                <ul className="space-y-1">
                  {message.resources && message.resources.map((resource, idx) => (
                    <li key={idx} className="text-gray-200">
                      <span className="font-medium">{resource.name}:</span> {resource.number}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className={`p-3 rounded-lg ${
                message.isUser 
                  ? 'bg-[#37475A] text-white ml-auto' 
                  : 'bg-[#00a0c6] text-white mr-auto'
              } max-w-[80%]`}>
                {message.text}
                {!message.isUser && voiceEnabled && (
                  <button 
                    onClick={() => speakText(message.text)}
                    className="ml-2 text-xs p-1 opacity-60 hover:opacity-100"
                    aria-label="Speak this message"
                    title="Speak this message"
                  >
                    <Volume2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex space-x-2 mr-auto">
            <div className="bg-[#00a0c6] w-3 h-3 rounded-full animate-bounce"></div>
            <div className="bg-[#00a0c6] w-3 h-3 rounded-full animate-bounce delay-100"></div>
            <div className="bg-[#00a0c6] w-3 h-3 rounded-full animate-bounce delay-200"></div>
          </div>
        )}
        
        {isSpeaking && (
          <div className="fixed bottom-20 right-6 bg-[#00a0c6] text-white py-2 px-4 rounded-full shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
            <span className="ml-1">Speaking...</span>
          </div>
        )}
        
        {isListening && (
          <div className="fixed bottom-20 left-6 bg-[#00a0c6] text-white py-2 px-4 rounded-full shadow-lg flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-[#00a0c6] flex items-center justify-center">
              <div className="w-4 h-4 bg-white animate-ping rounded-full opacity-75"></div>
            </div>
            <span className="ml-1">Listening...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-700 p-4 bg-[#131921]">
        <div className="flex space-x-2">
          {recognition.current && (
            <button
              onClick={toggleListening}
              type="button"
              className={`p-2 rounded-full ${isListening ? 'bg-[#00a0c6] text-white' : 'bg-gray-700 text-gray-300'}`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Ask me a question..."
            className="flex-1 p-2 border bg-[#37475A] border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a0c6] placeholder-gray-400"
            disabled={isLoading}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2 bg-[#00a0c6] text-white rounded-lg hover:bg-[#0097b8] transition disabled:opacity-50 flex items-center"
          >
            <Send size={18} className="mr-1" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;