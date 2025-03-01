import React from 'react';
import ChatBot from '../components/chat/ChatBot';

const ChatSupport = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Chat Support</h1>
      <div className="max-w-3xl mx-auto">
        <ChatBot />
      </div>
    </div>
  );
};

export default ChatSupport;