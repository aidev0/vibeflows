'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('/api/test');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStatus('success');
        setMessage(JSON.stringify(data, null, 2));
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              MongoDB Connection Test
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Testing connection to MongoDB...</p>
            </div>
            <div className="mt-5">
              {status === 'loading' && (
                <div className="text-blue-600">Loading...</div>
              )}
              {status === 'success' && (
                <div>
                  <div className="text-green-600 mb-4">Connection successful!</div>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-auto">
                    {message}
                  </pre>
                </div>
              )}
              {status === 'error' && (
                <div>
                  <div className="text-red-600 mb-4">Connection failed!</div>
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 