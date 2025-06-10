'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { toast } from 'react-hot-toast';

interface Integration {
  _id: string;
  provider?: string;
  service?: string;
  email?: string;
  created_at?: string;
  connected?: boolean;
  expires_at?: number;
  type?: string;
  name?: string;
  data?: {
    N8N_API_KEY?: string;
    N8N_URL?: string;
  };
  user_id?: string;
}

interface N8nIntegration {
  _id: string;
  name: string;
  type: string;
  data: {
    N8N_API_KEY: string;
    N8N_URL: string;
  };
  user_id: string;
}

function IntegrationsContent() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);
  const [n8nName, setN8nName] = useState('');
  const [n8nApiKey, setN8nApiKey] = useState('');
  const [n8nUrl, setN8nUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [n8nIntegrations, setN8nIntegrations] = useState<N8nIntegration[]>([]);

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
        const n8nIntegrations = data.filter((i: Integration) => i.type === 'n8n');
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
    const fetchN8nIntegrations = async () => {
      try {
        const response = await fetch('/api/integrations/n8n');
        if (!response.ok) throw new Error('Failed to fetch n8n integrations');
        const data = await response.json();
        setN8nIntegrations(data);
      } catch (error) {
        console.error('Error fetching n8n integrations:', error);
        toast.error('Failed to load n8n integrations');
      } finally {
        setIsLoadingIntegrations(false);
      }
    };
    if (user) {
      fetchN8nIntegrations();
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

  useEffect(() => {
    if (n8nIntegrations.length > 0) {
      const latest = n8nIntegrations[n8nIntegrations.length - 1];
      setN8nName(latest.name || '');
      setN8nUrl(latest.data?.N8N_URL || '');
      setN8nApiKey(latest.data?.N8N_API_KEY || '');
    } else {
      setN8nName('');
      setN8nUrl('');
      setN8nApiKey('');
    }
  }, [n8nIntegrations]);

  const handleN8nSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.sub) {
      toast.error('User not authenticated');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/integrations/n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: n8nName,
          data: {
            N8N_API_KEY: n8nApiKey,
            N8N_URL: n8nUrl
          }
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save n8n integration');
      }
      toast.success('n8n integration saved successfully!');
      setN8nName('');
      setN8nApiKey('');
      setN8nUrl('');
      // Refresh n8n integrations and update form fields
      const refreshed = await fetch('/api/integrations/n8n');
      const refreshedData = await refreshed.json();
      setN8nIntegrations(refreshedData);
      if (refreshedData.length > 0) {
        const latest = refreshedData[refreshedData.length - 1];
        setN8nName(latest.name || '');
        setN8nUrl(latest.data?.N8N_URL || '');
        setN8nApiKey(latest.data?.N8N_API_KEY || '');
      }
    } catch (error) {
      console.error('Error saving n8n integration:', error);
      toast.error('Failed to save n8n integration');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                            Expires: {integration.expires_at ? new Date(integration.expires_at).toLocaleString() : 'N/A'}
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
                            Expires: {integration.expires_at ? new Date(integration.expires_at).toLocaleString() : 'N/A'}
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

            {/* n8n Integration */}
            <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">n8n</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Connect your n8n instance to automate workflows.
              </p>
              {n8nIntegrations.length > 0 ? (
                <div>
                  <p className="text-green-600 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Connected
                  </p>
                  <div className="space-y-2 mb-4">
                    {n8nIntegrations.map(integration => (
                      <div key={integration._id} className="text-sm">
                        <p className="text-gray-600">{integration.name}</p>
                        <p className="text-gray-500 text-xs">
                          URL: {integration.data?.N8N_URL || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <form onSubmit={handleN8nSubmit} className="space-y-4">
                <div>
                  <label htmlFor="n8nName" className="block text-sm font-medium text-gray-700 mb-1">
                    Integration Name
                  </label>
                  <input
                    type="text"
                    id="n8nName"
                    value={n8nName}
                    onChange={(e) => setN8nName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="e.g., My n8n Instance"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="n8nUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    n8n URL
                  </label>
                  <input
                    type="url"
                    id="n8nUrl"
                    value={n8nUrl}
                    onChange={(e) => setN8nUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="https://your-n8n-instance.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="n8nApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      id="n8nApiKey"
                      value={n8nApiKey}
                      onChange={(e) => setN8nApiKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder=""
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Saving...' : 'Save Integration'}
                </button>
              </form>
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