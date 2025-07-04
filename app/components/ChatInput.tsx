'use client';

import React, { useState, useEffect } from 'react';
import { Send, Plus, Minimize2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  isChatMaximized?: boolean;
  onCreateNewChat?: () => void;
  onMinimizeChat?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isStreaming, 
  disabled = false,
  placeholder = "Type your message...",
  isChatMaximized = false,
  onCreateNewChat,
  onMinimizeChat
}) => {
  const [input, setInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Device detection
  useEffect(() => {
    const detectDevice = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-40
      bg-gradient-to-t from-gray-900 via-gray-800/95 to-gray-800/80 
      backdrop-blur-sm border-t border-gray-600/50
      ${isMobile ? 'p-3' : 'p-6'}
    `}
    style={{
      paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 12px)' : '24px',
      boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)'
    }}
    >
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isStreaming}
              rows={isMobile ? 1 : 1}
              className={`
                w-full resize-none rounded-xl
                bg-gray-700/80 border border-gray-500/30 
                text-white placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                focus:bg-gray-700/90 transition-all duration-200
                shadow-lg
                ${isMobile ? 'px-4 py-3 text-sm' : 'px-5 py-4 text-base'}
                ${disabled || isStreaming ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{
                minHeight: isMobile ? '44px' : '56px',
                maxHeight: isMobile ? '120px' : '200px',
                WebkitOverflowScrolling: 'touch',
                lineHeight: '1.5'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={!input.trim() || isStreaming || disabled}
            className={`
              flex items-center justify-center rounded-xl
              bg-gradient-to-r from-blue-600 to-blue-500 
              hover:from-blue-700 hover:to-blue-600 
              disabled:from-gray-600 disabled:to-gray-600
              text-white transition-all duration-200 shadow-lg
              hover:shadow-blue-500/25 hover:scale-105
              ${isMobile ? 'w-11 h-11 min-w-[44px]' : 'w-14 h-14 min-w-[56px]'}
              ${!input.trim() || isStreaming || disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
            `}
          >
            {isStreaming ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={isMobile ? 18 : 20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;