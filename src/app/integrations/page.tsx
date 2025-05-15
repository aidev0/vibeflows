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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <div className="flex-1 p-4 md:p-8 pt-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">Integrations</h1>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Gmail Integration */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Gmail</h2>
              <p className="text-gray-400 mb-4">
                Connect your Gmail account to automate email workflows.
              </p>
              {integrations.find(i => i.service === 'gmail')?.connected ? (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/integrations/gmail/disconnect', {
                        method: 'POST',
                      });
                      if (!response.ok) throw new Error('Failed to disconnect');
                      setIntegrations(prev => 
                        prev.map(i => 
                          i.service === 'gmail' ? { ...i, connected: false } : i
                        )
                      );
                      toast.success('Gmail disconnected successfully');
                    } catch (error) {
                      console.error('Error disconnecting Gmail:', error);
                      toast.error('Failed to disconnect Gmail');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Google Sheets Integration */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Google Sheets</h2>
              <p className="text-gray-400 mb-4">
                Connect your Google Sheets to automate spreadsheet workflows.
              </p>
              {integrations.find(i => i.service === 'sheets')?.connected ? (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/integrations/sheets/disconnect', {
                        method: 'POST',
                      });
                      if (!response.ok) throw new Error('Failed to disconnect');
                      setIntegrations(prev => 
                        prev.map(i => 
                          i.service === 'sheets' ? { ...i, connected: false } : i
                        )
                      );
                      toast.success('Google Sheets disconnected successfully');
                    } catch (error) {
                      console.error('Error disconnecting Google Sheets:', error);
                      toast.error('Failed to disconnect Google Sheets');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  );
} 