'use client';

import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function FeaturesPage() {
  const features = [
    {
      title: "AI-Powered Workflow Creation",
      description: "Simply describe what you want to automate, and our AI will create the perfect workflow for you.",
      icon: "🤖"
    },
    {
      title: "Enterprise-Grade Security",
      description: "Your data is protected with industry-leading security measures and encryption.",
      icon: "🔒"
    },
    {
      title: "Seamless Integration",
      description: "Connect with your favorite tools and services through our extensive integration library.",
      icon: "🔄"
    },
    {
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time, with instant updates and notifications.",
      icon: "👥"
    },
    {
      title: "Advanced Analytics",
      description: "Gain insights into your workflows with detailed analytics and performance metrics.",
      icon: "📊"
    },
    {
      title: "Customizable Templates",
      description: "Start quickly with pre-built templates or create your own custom workflows.",
      icon: "📝"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how VibeFlows can transform your workflow automation experience with our cutting-edge features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <Link
            href="/chat?new=true"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
          >
            Start Automating Now
          </Link>
        </div>
      </main>
    </div>
  );
} 