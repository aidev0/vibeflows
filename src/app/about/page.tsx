'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function AboutPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    setIsLoading(true);
    try {
      // First try to fetch existing chats
      const chatsResponse = await fetch('/api/chats');
      if (!chatsResponse.ok) {
        throw new Error('Failed to fetch chats');
      }
      
      const chatsData = await chatsResponse.json();
      const existingChats = chatsData.chats || [];
      
      if (existingChats.length > 0) {
        // If there are existing chats, redirect to the most recent one
        const mostRecentChat = existingChats[0];
        router.push(`/chat/${mostRecentChat.id}`);
      } else {
        // If no chats exist, create a new one
        const response = await fetch('/api/chat/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Workflow',
            type: 'workflow'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create chat');
        }

        const data = await response.json();
        if (!data?.chatId) {
          throw new Error('Invalid response format');
        }

        router.push(`/chat/${data.chatId}`);
      }
    } catch (error) {
      console.error('Error:', error);
      // Fallback to main chat page if something goes wrong
      router.push('/chat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About VibeFlows</h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              At VibeFlows, we're on a mission to democratize workflow automation. We believe that powerful automation tools shouldn't be limited to technical experts. Our AI-powered platform makes it possible for anyone to create sophisticated workflows through natural conversation.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">What Makes Us Different</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">AI-First Approach</h3>
                <p className="text-gray-700">
                  Our AI understands your needs in plain English and translates them into powerful workflows. No coding required.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Enterprise Ready</h3>
                <p className="text-gray-700">
                  Built with enterprise-grade security and scalability in mind, ensuring your workflows are reliable and secure.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">User-Friendly</h3>
                <p className="text-gray-700">
                  Intuitive interface designed for non-technical users, making automation accessible to everyone.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Powerful Integration</h3>
                <p className="text-gray-700">
                  Seamlessly connect with your favorite tools and services through our extensive integration library.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Our Story</h2>
            <p className="text-gray-700 mb-4">
              VibeFlows was born from a simple observation: while automation tools have become increasingly powerful, they've also become more complex and inaccessible to the average user. We set out to change that by creating a platform that combines the power of AI with an intuitive interface.
            </p>
            <p className="text-gray-700 mb-4">
              Today, we're proud to serve businesses and individuals who want to automate their workflows without the need for technical expertise. Our platform continues to evolve, driven by our commitment to making automation accessible to everyone.
            </p>
          </section>

          <section className="text-center">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Ready to Transform Your Workflows?</h2>
            <button
              onClick={handleStartChat}
              disabled={isLoading}
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Chat...' : 'Start Automating Now'}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
} 