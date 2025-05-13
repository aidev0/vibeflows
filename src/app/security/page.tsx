'use client';

import Navbar from '../components/Navbar';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Security at VibeFlows</h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Our Commitment to Security</h2>
            <p className="text-gray-700 mb-4">
              At VibeFlows, we take security seriously. We understand that your workflows and data are critical to your business operations, and we're committed to protecting them with enterprise-grade security measures.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Security Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Authentication & Authorization</h3>
                <p className="text-gray-700">
                  Enterprise-grade authentication and role-based access control ensure that only authorized users can access your workflows and data.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Data Encryption</h3>
                <p className="text-gray-700">
                  All data is encrypted both in transit and at rest using industry-standard encryption protocols.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Secure Infrastructure</h3>
                <p className="text-gray-700">
                  Our platform runs on secure cloud infrastructure with regular security updates and monitoring.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Compliance</h3>
                <p className="text-gray-700">
                  We maintain compliance with industry standards and best practices for data protection and security.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Best Practices</h2>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Regular security audits and penetration testing</li>
                <li>Continuous monitoring for suspicious activities</li>
                <li>Automated backup systems to prevent data loss</li>
                <li>Strict access controls and audit logging</li>
                <li>Regular security training for our team</li>
                <li>Incident response and recovery procedures</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Reporting Security Issues</h2>
            <p className="text-gray-700 mb-4">
              If you discover a security vulnerability or have concerns about our security measures, please contact our security team immediately at security@vibeflows.com. We take all security reports seriously and will respond promptly.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
} 