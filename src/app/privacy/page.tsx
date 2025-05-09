'use client';

import Navbar from '../components/Navbar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <h1 className="text-4xl font-bold text-black mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">1. Information We Collect</h2>
            <p className="text-black mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-black">
              <li>Account information (name, email address)</li>
              <li>Workflow data and automation preferences</li>
              <li>Usage data and interaction with our AI assistant</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">2. How We Use Your Information</h2>
            <p className="text-black mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-black">
              <li>Provide and improve our services</li>
              <li>Train and enhance our AI models</li>
              <li>Communicate with you about our services</li>
              <li>Ensure the security of our platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">3. Data Security</h2>
            <p className="text-black mb-4">
              We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">4. Your Rights</h2>
            <p className="text-black mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-black">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of certain data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">5. Contact Us</h2>
            <p className="text-black mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-black">
              Email: privacy@vibeflows.app
            </p>
          </section>
        </div>
      </main>
    </div>
  );
} 