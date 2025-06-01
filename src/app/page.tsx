'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import Navbar from './components/Navbar';

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const handleStartChat = async () => {
    setIsLoadingChat(true);
    try {
      const chatsResponse = await fetch('/api/chats');
      if (!chatsResponse.ok) throw new Error('Failed to fetch chats');
      
      const chatsData = await chatsResponse.json();
      const existingChats = chatsData.chats || [];
      
      if (existingChats.length > 0) {
        const mostRecentChat = existingChats[0];
        router.push(`/chat/${mostRecentChat.id}`);
      } else {
        const response = await fetch('/api/chat/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New Workflow', type: 'workflow' }),
        });

        if (!response.ok) throw new Error('Failed to create chat');
        
        const data = await response.json();
        if (!data?.chatId) throw new Error('Invalid response format');
        
        router.push(`/chat/${data.chatId}`);
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/chat');
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      <Navbar />
      
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        <div className="inline-block mb-4 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-100 text-blue-700 text-sm md:text-base font-medium">
          Workflow Automation AI for Marketing.
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
          Vibe Marketing AI.
        </h1>
        
        <p className="text-lg md:text-xl lg:text-2xl text-gray-800 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
          AI that turns plain English into enterprise marketing automation. No code, no configs. Just describe your marketing need, our AI builds it.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 px-4">
          <button
            onClick={handleStartChat}
            disabled={isLoadingChat}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingChat ? 'Loading...' : 'Start Automating Free'}
          </button>
          
          <button
            onClick={handleStartChat}
            disabled={isLoadingChat}
            className="w-full sm:w-auto border-2 border-gray-200 text-gray-800 px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingChat ? 'Loading...' : 'See How It Works'}
          </button>
        </div>
      </main>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
          
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">Just Chat About Your Marketing</h3>
            <p className="text-gray-800 text-sm md:text-base">Describe your marketing workflow in plain English. Our AI builds production-ready marketing automation in minutes.</p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">Enterprise Marketing Ready</h3>
            <p className="text-gray-800 text-sm md:text-base">1000+ integrations, 10K+ marketing AI agents, 5K+ MCPs. Enterprise marketing security without complexity.</p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">Lightning Fast Marketing</h3>
            <p className="text-gray-800 text-sm md:text-base">Marketing automation AI that develops workflows, apps, websites & launches marketing campaigns in minutes.</p>
          </div>
          
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
            Ready to Transform Your Marketing Workflows?
          </h2>
          
          <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
            Enterprise marketing automation power without coding complexity. Describe your marketing needs, AI builds it.
          </p>
          
          <button
            onClick={handleStartChat}
            disabled={isLoadingChat}
            className="inline-block bg-white text-blue-600 px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingChat ? 'Loading...' : 'Start Your Free Trial'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-700 text-sm md:text-base">
              © 2025 VibeFlows. Your army of Marketing AI agents.
            </div>
            <div className="flex gap-4 md:gap-6">
              <Link href="/privacy" className="text-gray-700 hover:text-blue-600 transition-colors text-sm md:text-base">Privacy</Link>
              <Link href="/terms" className="text-gray-700 hover:text-blue-600 transition-colors text-sm md:text-base">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}