'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TermsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 p-4 md:p-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing and using VibeFlows, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">2. Use License</h2>
              <p className="text-gray-600 mb-4">
                Permission is granted to temporarily use VibeFlows for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software contained on VibeFlows</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">3. User Account</h2>
              <p className="text-gray-600 mb-4">
                To access certain features of VibeFlows, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">4. Privacy Policy</h2>
              <p className="text-gray-600 mb-4">
                Your use of VibeFlows is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the site and informs users of our data collection practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">5. Disclaimer</h2>
              <p className="text-gray-600 mb-4">
                The materials on VibeFlows are provided on an 'as is' basis. VibeFlows makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">6. Limitations</h2>
              <p className="text-gray-600 mb-4">
                In no event shall VibeFlows or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on VibeFlows.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">7. Revisions and Errata</h2>
              <p className="text-gray-600 mb-4">
                The materials appearing on VibeFlows could include technical, typographical, or photographic errors. VibeFlows does not warrant that any of the materials on its website are accurate, complete, or current. VibeFlows may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">8. Links</h2>
              <p className="text-gray-600 mb-4">
                VibeFlows has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by VibeFlows of the site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">9. Modifications</h2>
              <p className="text-gray-600 mb-4">
                VibeFlows may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">10. Governing Law</h2>
              <p className="text-gray-600 mb-4">
                These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 