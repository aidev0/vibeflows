'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { toast } from 'react-hot-toast';

interface Integration {
  _id: string;
  provider: string;
  service: string;
  email?: string;
  created_at: string;
  connected: boolean;
  expires_at: number;
}

function IntegrationsContent() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await fetch('/api/integrations');
        if (!response.ok) throw new Error('Failed to fetch integrations');
        const data = await response.json();
        console.log('Fetched integrations:', data);
        setIntegrations(data);
      } catch (error) {
        console.error('Error fetching integrations:', error);
        toast.error('Failed to load integrations');
      } finally {
        setIsLoadingIntegrations(false);
      }
    };

    if (user) {
      fetchIntegrations();
    }
  }, [user]);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      toast.success('Integration successful!');
    } else if (error) {
      toast.error(`Integration failed: ${error}`);
    }
  }, [searchParams]);

  if (isLoading || isLoadingIntegrations) {
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
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">Integrations</h1>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Gmail Integration */}
            <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Gmail</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Connect your Gmail account to automate email workflows.
              </p>
              {integrations.find(i => i.service === 'gmail')?.connected ? (
                <div>
                  <p className="text-green-600 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Connected
                  </p>
                  <div className="space-y-2 mb-4">
                    {integrations
                      .filter(i => i.service === 'gmail' && i.email)
                      .map(integration => (
                        <div key={integration._id} className="text-sm">
                          <p className="text-gray-600">{integration.email}</p>
                          <p className="text-gray-500 text-xs">
                            Expires: {new Date(integration.expires_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/integrations/gmail/auth');
                        if (!response.ok) throw new Error('Failed to get auth URL');
                        const { url } = await response.json();
                        window.location.href = url;
                      } catch (error) {
                        console.error('Error connecting Gmail:', error);
                        toast.error('Failed to connect Gmail');
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Connect Another Account
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/integrations/gmail/auth');
                      if (!response.ok) throw new Error('Failed to get auth URL');
                      const { url } = await response.json();
                      window.location.href = url;
                    } catch (error) {
                      console.error('Error connecting Gmail:', error);
                      toast.error('Failed to connect Gmail');
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Google Sheets Integration */}
            <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Google Sheets</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Connect your Google Sheets to automate spreadsheet workflows.
              </p>
              {integrations.find(i => i.service === 'sheets')?.connected ? (
                <div>
                  <p className="text-green-600 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Connected
                  </p>
                  <div className="space-y-2 mb-4">
                    {integrations
                      .filter(i => i.service === 'sheets' && i.email)
                      .map(integration => (
                        <div key={integration._id} className="text-sm">
                          <p className="text-gray-600">{integration.email}</p>
                          <p className="text-gray-500 text-xs">
                            Expires: {new Date(integration.expires_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/integrations/sheets/auth');
                        if (!response.ok) throw new Error('Failed to get auth URL');
                        const { url } = await response.json();
                        window.location.href = url;
                      } catch (error) {
                        console.error('Error connecting Google Sheets:', error);
                        toast.error('Failed to connect Google Sheets');
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Connect Another Account
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/integrations/sheets/auth');
                      if (!response.ok) throw new Error('Failed to get auth URL');
                      const { url } = await response.json();
                      window.location.href = url;
                    } catch (error) {
                      console.error('Error connecting Google Sheets:', error);
                      toast.error('Failed to connect Google Sheets');
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  );
} 