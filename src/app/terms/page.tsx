'use client';

import Navbar from '../components/Navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <h1 className="text-4xl font-bold text-black mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">1. Acceptance of Terms</h2>
            <p className="text-black mb-4">
              By accessing and using vibeflows.app, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">2. Use License</h2>
            <p className="text-black mb-4">
              Permission is granted to temporarily use vibeflows.app for personal, non-commercial purposes. This license does not include:
            </p>
            <ul className="list-disc pl-6 mb-4 text-black">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for commercial purposes</li>
              <li>Attempting to reverse engineer any software</li>
              <li>Removing any copyright or proprietary notations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">3. User Responsibilities</h2>
            <p className="text-black mb-4">
              You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-black">
              <li>Provide accurate account information</li>
              <li>Maintain the security of your account</li>
              <li>Use the service in compliance with laws</li>
              <li>Not misuse or abuse the AI capabilities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">4. Service Modifications</h2>
            <p className="text-black mb-4">
              We reserve the right to modify or discontinue the service at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">5. Limitation of Liability</h2>
            <p className="text-black mb-4">
              In no event shall vibeflows.app be liable for any damages arising out of the use or inability to use the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">6. Contact Information</h2>
            <p className="text-black mb-4">
              Questions about the Terms of Service should be sent to us at:
            </p>
            <p className="text-black">
              Email: legal@vibeflows.app
            </p>
          </section>
        </div>
      </main>
    </div>
  );
} 