'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Sparkles, Bot, GitBranch, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 768);
      setOrientation(height > width ? 'portrait' : 'landscape');
    };
    
    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', () => setTimeout(detectDevice, 100));
    
    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center ${
      isMobile ? 'p-4' : 'p-8'
    }`}>
      <div className={`w-full space-y-6 md:space-y-8 ${
        isMobile && orientation === 'landscape' 
          ? 'max-w-2xl flex flex-col md:flex-row gap-8 items-center' 
          : 'max-w-md'
      }`}>
        <div className={`text-center ${
          isMobile && orientation === 'landscape' ? 'flex-shrink-0' : ''
        }`}>
          <div className="flex justify-center mb-3 md:mb-4">
            <div className={`bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl ${
              isMobile ? 'p-3' : 'p-4'
            }`}>
              <Sparkles className="text-white" size={isMobile ? 36 : 48} />
            </div>
          </div>
          <h1 className={`font-bold text-white mb-2 ${
            isMobile ? 'text-2xl md:text-4xl' : 'text-4xl'
          }`}>VibeFlows</h1>
          <p className={`text-gray-300 ${
            isMobile ? 'text-base md:text-lg' : 'text-lg'
          }`}>AI-Powered Marketing Automation</p>
        </div>

        <div className={`bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 ${
          isMobile ? 'p-4 md:p-8' : 'p-8'
        } ${isMobile && orientation === 'landscape' ? 'flex-1' : ''}`}>
          <div className={`space-y-4 md:space-y-6 ${
            isMobile && orientation === 'landscape' ? 'grid grid-cols-1 gap-4' : ''
          }`}>
            <div className={`grid gap-3 md:gap-4 text-center ${
              isMobile && orientation === 'portrait' ? 'grid-cols-1 space-y-3' : 'grid-cols-3'
            }`}>
              <div className={`bg-blue-500/20 rounded-xl ${
                isMobile ? 'p-3 flex items-center gap-3 md:block md:p-4' : 'p-4'
              }`}>
                <Bot className={`text-blue-400 ${
                  isMobile ? 'flex-shrink-0 md:mx-auto md:mb-2' : 'mx-auto mb-2'
                }`} size={isMobile ? 24 : 32} />
                <p className={`text-gray-300 ${
                  isMobile ? 'text-sm md:text-sm text-left md:text-center' : 'text-sm'
                }`}>AI Agents</p>
              </div>
              <div className={`bg-green-500/20 rounded-xl ${
                isMobile ? 'p-3 flex items-center gap-3 md:block md:p-4' : 'p-4'
              }`}>
                <GitBranch className={`text-green-400 ${
                  isMobile ? 'flex-shrink-0 md:mx-auto md:mb-2' : 'mx-auto mb-2'
                }`} size={isMobile ? 24 : 32} />
                <p className={`text-gray-300 ${
                  isMobile ? 'text-sm md:text-sm text-left md:text-center' : 'text-sm'
                }`}>Smart Flows</p>
              </div>
              <div className={`bg-purple-500/20 rounded-xl ${
                isMobile ? 'p-3 flex items-center gap-3 md:block md:p-4' : 'p-4'
              }`}>
                <Zap className={`text-purple-400 ${
                  isMobile ? 'flex-shrink-0 md:mx-auto md:mb-2' : 'mx-auto mb-2'
                }`} size={isMobile ? 24 : 32} />
                <p className={`text-gray-300 ${
                  isMobile ? 'text-sm md:text-sm text-left md:text-center' : 'text-sm'
                }`}>Automation</p>
              </div>
            </div>

            <div className="text-center">
              <p className={`text-gray-300 mb-4 md:mb-6 ${
                isMobile ? 'text-sm md:text-base' : 'text-base'
              }`}>
                Create powerful marketing automation workflows with AI-powered agents and smart decision flows.
              </p>
              <a
                href="/api/auth/login"
                className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 ${
                  isMobile ? 'py-3 px-4 text-sm md:py-3 md:px-6 md:text-base min-h-[48px]' : 'py-3 px-6'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                <LogIn size={isMobile ? 18 : 20} />
                Sign In
              </a>
            </div>
          </div>
        </div>

        <div className={`text-center text-gray-400 ${
          isMobile ? 'text-xs md:text-sm' : 'text-sm'
        } ${isMobile && orientation === 'landscape' ? 'hidden' : ''}`}>
          <p>Streamline your marketing with intelligent automation</p>
        </div>
      </div>
    </div>
  );
}