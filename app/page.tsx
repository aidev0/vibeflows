'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Sparkles, Bot, GitBranch, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
              <Sparkles className="text-white" size={48} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">VibeFlows</h1>
          <p className="text-gray-300 text-lg">AI-Powered Marketing Automation</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-500/20 rounded-xl">
                <Bot className="mx-auto mb-2 text-blue-400" size={32} />
                <p className="text-sm text-gray-300">AI Agents</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-xl">
                <GitBranch className="mx-auto mb-2 text-green-400" size={32} />
                <p className="text-sm text-gray-300">Smart Flows</p>
              </div>
              <div className="p-4 bg-purple-500/20 rounded-xl">
                <Zap className="mx-auto mb-2 text-purple-400" size={32} />
                <p className="text-sm text-gray-300">Automation</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-300 mb-6">
                Create powerful marketing automation workflows with AI-powered agents and smart decision flows.
              </p>
              <a
                href="/api/auth/login"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                Sign In
              </a>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400">
          <p>Streamline your marketing with intelligent automation</p>
        </div>
      </div>
    </div>
  );
}