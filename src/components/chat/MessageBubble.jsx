import React from 'react';

const MessageBubble = ({ message }) => {
  const { text, isUser } = message;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${
        isUser 
          ? 'bg-indigo-600 text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-800 rounded-bl-none'
      }`}>
        {text}
      </div>
    </div>
  );
};

export default MessageBubble;