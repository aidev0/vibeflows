'use client';

import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import Navbar from './components/Navbar';

export default function Home() {
  const { user, isLoading } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      <Navbar />
      {/* Main landing content with padding top for header */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        <div className="inline-block mb-4 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-100 text-blue-700 text-sm md:text-base font-medium">
          Enterprise-Grade Automation Made Simple.
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
          Workflow Automation
          <span className="block md:inline bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI made for Non-Technicals.</span> 
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-gray-800 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
          Finally, a workflow automation tool that gives you enterprise-grade power without the complexity. Just tell our AI what you want to automate, and it handles the rest.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 px-4">
          <Link
            href="/chat?new=true"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
          >
            Start Automating Free
          </Link>
          <Link
            href="/chat?new=true"
            className="w-full sm:w-auto border-2 border-gray-200 text-gray-800 px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105"
          >
            See How It Works
          </Link>
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
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">Just Chat or Talk to our AI</h3>
            <p className="text-gray-800 text-sm md:text-base">Describe your workflow in plain English. Our AI translates your needs into production-ready automation.</p>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">Enterprise Ready Automation</h3>
            <p className="text-gray-800 text-sm md:text-base">Access AI agents, MCPs, and cloud deployment with enterprise-grade security and best practices.</p>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">Lightning Fast Results</h3>
            <p className="text-gray-800 text-sm md:text-base">Get your automation up and running in minutes, not days. Our AI handles the heavy lifting.</p>
          </div>
        </div>
      </div>
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
            Ready to Transform Your Workflows?
          </h2>
          <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
            Get the power of professional AI software engineering without writing a single line of code.
          </p>
          <Link
            href="/chat?new=true"
            className="inline-block bg-white text-blue-600 px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Start Your Free Trial
          </Link>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-700 text-sm md:text-base">
              © 2025 VibeFlows. Powered by Vibe Coding.
            </div>
            <div className="flex gap-4 md:gap-6">
              <Link href="/privacy" className="text-gray-700 hover:text-blue-600 transition-colors text-sm md:text-base">Privacy</Link>
              <Link href="/terms" className="text-gray-700 hover:text-blue-600 transition-colors text-sm md:text-base">Terms</Link>
              <Link href="/chat?new=true&from=contact" className="text-gray-700 hover:text-blue-600 transition-colors text-sm md:text-base">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
