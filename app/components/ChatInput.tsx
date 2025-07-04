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
      ${isChatMaximized && isMobile ? 'relative' : 'fixed bottom-0 left-0 right-0 z-40'}
      bg-gradient-to-t from-gray-900 via-gray-800/98 to-gray-800/85 
      backdrop-blur-lg border-t border-gray-500/40
      ${isMobile ? 'p-3' : 'px-4 py-3'}
    `}
    style={{
      paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 12px)' : '16px',
      boxShadow: isChatMaximized && isMobile ? 'none' : '0 -4px 24px rgba(0, 0, 0, 0.5), 0 -1px 8px rgba(0, 0, 0, 0.3)'
    }}
    >
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex-1 relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isStreaming}
              rows={isMobile ? 1 : 1}
              className={`
                w-full resize-none rounded-2xl
                bg-gradient-to-r from-gray-800/90 to-gray-700/90 
                border border-gray-500/40 
                text-white placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-400/60
                focus:bg-gradient-to-r focus:from-gray-700/95 focus:to-gray-600/95 
                focus:shadow-lg focus:shadow-blue-500/20
                transition-all duration-300 ease-out
                shadow-inner backdrop-blur-sm
                ${isMobile ? 'px-4 py-3 text-sm' : 'px-6 py-4 text-base'}
                ${disabled || isStreaming ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400/50 group-hover:shadow-lg group-hover:shadow-blue-500/10'}
              `}
              style={{
                minHeight: isMobile ? '44px' : '48px',
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
              flex items-center justify-center rounded-2xl
              bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 
              hover:from-blue-700 hover:via-blue-600 hover:to-purple-700 
              disabled:from-gray-600 disabled:to-gray-600
              text-white transition-all duration-300 ease-out
              shadow-lg shadow-blue-500/30
              hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105
              active:scale-95
              ${isMobile ? 'w-11 h-11 min-w-[44px]' : 'w-12 h-12 min-w-[48px]'}
              ${!input.trim() || isStreaming || disabled ? 'opacity-50 cursor-not-allowed hover:scale-100 shadow-gray-500/20' : ''}
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