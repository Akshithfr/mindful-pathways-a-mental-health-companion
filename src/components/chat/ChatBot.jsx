// src/components/chat/ChatBot.jsx
import React, { useState, useEffect, useRef } from 'react';
import groqService from '../../services/groqService';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your mental health companion. How are you feeling today?", isUser: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3-8b-8192');
  const messagesEndRef = useRef(null);

  const models = [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 (70B) - Versatile' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 (8B) - Fast' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral - Long Context' }
  ];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Add user message to UI
    setMessages(prev => [...prev, { text: inputText, isUser: true }]);
    
    // Add to conversation history for API
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: inputText }
    ];
    setConversationHistory(updatedHistory);
    
    setIsLoading(true);
    
    try {
      // Check for crisis keywords
      if (groqService.detectCrisis(inputText)) {
        const resources = groqService.getEmergencyResources();
        setMessages(prev => [...prev, { 
          text: resources.message, 
          isUser: false,
          isEmergency: true,
          resources: resources.resources
        }]);
      } else {
        // Get response from Groq with selected model
        const response = await groqService.sendMessageWithModel(
          inputText, 
          conversationHistory,
          selectedModel
        );
        
        // Add response to UI
        setMessages(prev => [...prev, { 
          text: response.content, 
          isUser: false 
        }]);
        
        // Add to conversation history
        setConversationHistory([
          ...updatedHistory,
          { role: 'assistant', content: response.content }
        ]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { 
        text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
    
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Model selector */}
      <div className="border-b p-4">
        <label className="block mb-2 font-medium">AI Model:</label>
        <select 
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="p-2 border rounded-lg w-full"
        >
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            {message.isEmergency ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mr-auto max-w-[80%]">
                <p className="font-medium text-red-600 mb-2">{message.text}</p>
                <ul className="space-y-1">
                  {message.resources.map((resource, idx) => (
                    <li key={idx} className="text-gray-700">
                      <span className="font-medium">{resource.name}:</span> {resource.number}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className={`p-3 rounded-lg ${
                message.isUser 
                  ? 'bg-indigo-500 text-white ml-auto' 
                  : 'bg-gray-100 mr-auto'
              } max-w-[80%]`}>
                {message.text}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex space-x-2 mr-auto">
            <div className="bg-gray-200 w-3 h-3 rounded-full animate-bounce"></div>
            <div className="bg-gray-200 w-3 h-3 rounded-full animate-bounce delay-100"></div>
            <div className="bg-gray-200 w-3 h-3 rounded-full animate-bounce delay-200"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;