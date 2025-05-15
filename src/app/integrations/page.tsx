'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Integration {
  _id: string;
  provider: string;
  service: string;
  email?: string;
  created_at: string;
  connected: boolean;
}

export default function IntegrationsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await fetch('/api/integrations');
        if (!response.ok) throw new Error('Failed to fetch integrations');
        const data = await response.json();
        setIntegrations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching integrations:', error);
        toast.error('Failed to load integrations');
        setIntegrations([]);
      } finally {
        setLoading(false);
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
      toast.success('Successfully connected!');
      router.replace('/integrations');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        no_code: 'Authorization code missing',
        callback_failed: 'Failed to complete connection',
        invalid_state: 'Invalid integration type'
      };
      toast.error(errorMessages[error] || 'An error occurred');
      router.replace('/integrations');
    }
  }, [searchParams, router]);

  const handleConnect = async (service: 'gmail' | 'sheets') => {
    try {
      const response = await fetch(`/api/integrations/${service}/auth`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error(`Error connecting to ${service}:`, error);
      toast.error(`Failed to connect to ${service}`);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to disconnect');
      
      setIntegrations(prev => prev.filter(i => i._id !== integrationId));
      toast.success('Successfully disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading integrations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-2 text-gray-600">Connect your accounts to enable automation</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Gmail Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <h2 className="ml-3 text-xl font-semibold text-gray-900">Gmail</h2>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Connect your Gmail account to read and send emails</p>
            {integrations.some(i => i.service === 'gmail' && i.connected) ? (
              <div className="space-y-4">
                {integrations
                  .filter(i => i.service === 'gmail' && i.connected)
                  .map(integration => (
                    <div key={integration._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="ml-2 text-sm text-gray-600">{integration.email || 'Connected Account'}</span>
                      </div>
                      <button
                        onClick={() => handleDisconnect(integration._id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                <button
                  onClick={() => handleConnect('gmail')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Connect Another Account
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleConnect('gmail')}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Connect Gmail
              </button>
            )}
          </div>

          {/* Google Sheets Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
                <h2 className="ml-3 text-xl font-semibold text-gray-900">Google Sheets</h2>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Connect your Google Sheets to read and write spreadsheet data</p>
            {integrations.some(i => i.service === 'sheets' && i.connected) ? (
              <div className="space-y-4">
                {integrations
                  .filter(i => i.service === 'sheets' && i.connected)
                  .map(integration => (
                    <div key={integration._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="ml-2 text-sm text-gray-600">Connected Account</span>
                      </div>
                      <button
                        onClick={() => handleDisconnect(integration._id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                <button
                  onClick={() => handleConnect('sheets')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Connect Another Account
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleConnect('sheets')}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Connect Google Sheets
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 