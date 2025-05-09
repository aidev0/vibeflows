'use client';

import Navbar from '../components/Navbar';
import Image from 'next/image';

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">Our Team</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="aspect-w-3 aspect-h-4 relative">
              <div className="w-full h-96 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-6xl">👨‍💻</span>
              </div>
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Jacob Rafati, PhD</h2>
              <p className="text-blue-600 font-semibold mb-4">AI CTO & Full Stack AI Engineer</p>
              <p className="text-gray-700 mb-6">
                Based in San Francisco, Jacob brings extensive expertise in artificial intelligence and full-stack development. 
                With a PhD in AI and years of experience in the tech industry, he leads the development of VibeFlows' 
                innovative workflow automation platform.
              </p>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-semibold">Expertise:</span> AI/ML, Full Stack Development, System Architecture
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Location:</span> San Francisco, CA
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Education:</span> PhD in Artificial Intelligence
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Join Our Team</h2>
            <p className="text-gray-700 mb-6">
              We're always looking for talented individuals who are passionate about AI and automation. 
              If you're interested in joining our team, reach out to us through our chat interface.
            </p>
            <a
              href="/chat?new=true&type=support"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
            >
              Contact Us
            </a>
          </div>
        </div>
      </main>
    </div>
  );
} 