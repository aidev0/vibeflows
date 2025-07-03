'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Plus, Edit, Trash2, Eye, EyeOff, Save } from 'lucide-react';

interface KeysManagerProps {
  onClose: () => void;
}

interface UserKey {
  _id?: string;
  key_name: string;
  key_value: string;
  description: string;
  key_type: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

const KeysManager: React.FC<KeysManagerProps> = ({ onClose }) => {
  const [keys, setKeys] = useState<UserKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [selectedPredefined, setSelectedPredefined] = useState('');
  const [showFormKeyValue, setShowFormKeyValue] = useState(false);
  
  const [formData, setFormData] = useState({
    key_name: '',
    key_value: '',
    description: '',
    key_type: 'api_key'
  });

  const predefinedKeys = [
    { name: 'GEMINI_API_KEY', type: 'api_key', description: 'Google Gemini API key for AI model access' },
    { name: 'GMAIL_ACCESS_TOKEN', type: 'oauth_token', description: 'Gmail OAuth access token for email operations' },
    { name: 'OPENAI_API_KEY', type: 'api_key', description: 'OpenAI API key for GPT models' },
    { name: 'MONGODB_URI', type: 'connection_string', description: 'MongoDB connection string' },
    { name: 'GOOGLE_SERVICE_ACCOUNT_JSON', type: 'service_account_json', description: 'Google Cloud service account JSON' },
    { name: 'N8N_API_KEY', type: 'api_key', description: 'n8n workflow automation API key' },
    { name: 'N8N_URL', type: 'url', description: 'n8n instance URL' }
  ];

  const keyTypes = [
    { value: 'api_key', label: 'API Key' },
    { value: 'secret', label: 'Secret' },
    { value: 'token', label: 'Token' },
    { value: 'oauth_token', label: 'OAuth Token' },
    { value: 'connection_string', label: 'Connection String' },
    { value: 'service_account_json', label: 'Service Account JSON' },
    { value: 'url', label: 'URL' },
    { value: 'webhook', label: 'Webhook URL' },
    { value: 'database', label: 'Database Connection' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/credentials');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched credentials data:', data);
        console.log('Individual keys:', data.keys);
        setKeys(data.keys || []);
      } else {
        console.error('Failed to fetch credentials:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const method = editingKey ? 'PUT' : 'POST';
      const body = editingKey 
        ? { key_id: editingKey, ...formData }
        : formData;

      const response = await fetch('/api/credentials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await fetchKeys();
        resetForm();
        setShowAddForm(false);
        setEditingKey(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving key:', error);
      alert('Error saving key');
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this key?')) return;

    try {
      const response = await fetch(`/api/credentials?key_id=${keyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchKeys();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting key:', error);
      alert('Error deleting key');
    }
  };

  const handleEdit = (key: UserKey) => {
    console.log('Editing key:', key);
    const value = key.key_value || '';
    const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    
    setFormData({
      key_name: key.key_name || '',
      key_value: stringValue,
      description: key.description || '',
      key_type: key.key_type || 'api_key'
    });
    setEditingKey(key._id || '');
    setSelectedPredefined(key._id || ''); // Set dropdown to show the selected key
    setShowAddForm(true); // Show the form
    setShowFormKeyValue(false); // Hide value by default when editing
  };

  const resetForm = () => {
    setFormData({
      key_name: '',
      key_value: '',
      description: '',
      key_type: 'api_key'
    });
    setSelectedPredefined('');
    setShowFormKeyValue(false);
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const maskKey = (value: string | any) => {
    if (!value) return '••••••••';
    
    // Convert objects to string
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    if (stringValue.length <= 8) return '*'.repeat(stringValue.length);
    return stringValue.slice(0, 4) + '*'.repeat(stringValue.length - 8) + stringValue.slice(-4);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:p-0">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] md:max-h-[90vh] max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-700 p-4 border-b border-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key size={24} className="text-blue-400" />
            <h2 className="text-lg md:text-xl font-semibold text-white">API Keys & Secrets</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-140px)] md:max-h-[calc(90vh-140px)]">
          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingKey ? 'Edit Key' : 'Add New Key'}
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Existing Key or Predefined Template
                  </label>
                  <select
                    value={selectedPredefined}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setSelectedPredefined(selected);
                      
                      if (selected) {
                        // First check if it's an existing saved key
                        const existingKey = keys.find(k => k._id === selected);
                        if (existingKey) {
                          // Load existing key with its actual value
                          const value = existingKey.key_value || '';
                          const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
                          
                          setFormData({
                            key_name: existingKey.key_name || '',
                            key_value: stringValue,
                            description: existingKey.description || '',
                            key_type: existingKey.key_type || 'api_key'
                          });
                          setEditingKey(existingKey._id || '');
                          setShowFormKeyValue(false); // Hide value by default
                        } else {
                          // It's a predefined template
                          const predefined = predefinedKeys.find(p => p.name === selected);
                          if (predefined) {
                            setFormData({
                              key_name: predefined.name,
                              key_value: '',
                              description: predefined.description,
                              key_type: predefined.type
                            });
                            setEditingKey(null);
                          }
                        }
                      } else {
                        // Clear form when nothing is selected
                        setFormData({
                          key_name: '',
                          key_value: '',
                          description: '',
                          key_type: 'api_key'
                        });
                        setEditingKey(null);
                      }
                    }}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose existing key or template...</option>
                    
                    {/* Existing Saved Keys */}
                    {keys.length > 0 && (
                      <optgroup label="Your Saved Keys">
                        {keys.map(key => (
                          <option key={key._id} value={key._id}>
                            {key.key_name || key.name} ({key.key_type || key.type})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {/* Predefined Templates */}
                    <optgroup label="Predefined Templates">
                      {predefinedKeys.map(predefined => (
                        <option key={predefined.name} value={predefined.name}>
                          {predefined.name} (Template)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Name *
                  </label>
                  <input
                    type="text"
                    value={formData.key_name}
                    onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                    placeholder="e.g., OpenAI API Key"
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Type
                  </label>
                  <select
                    value={formData.key_type}
                    onChange={(e) => setFormData({ ...formData, key_type: e.target.value })}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {keyTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Value *
                  </label>
                  <div className="relative">
                    {formData.key_value && formData.key_value.includes('{') && formData.key_value.includes('}') ? (
                      <textarea
                        value={showFormKeyValue ? formData.key_value : (formData.key_value ? '••••••••••••••••' : '')}
                        onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
                        placeholder={editingKey ? "Click eye to view existing value" : "Enter your JSON credentials"}
                        rows={showFormKeyValue ? 8 : 3}
                        className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                        style={{ resize: 'vertical' }}
                      />
                    ) : (
                      <input
                        type={showFormKeyValue ? "text" : "password"}
                        value={formData.key_value}
                        onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
                        placeholder={editingKey ? "Click eye to view existing value" : "Enter your API key or secret"}
                        className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
                        autoComplete="new-password"
                      />
                    )}
                    {(editingKey || formData.key_value) && (
                      <button
                        type="button"
                        onClick={() => setShowFormKeyValue(!showFormKeyValue)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-500 rounded transition-colors"
                        title={showFormKeyValue ? "Hide value" : "Show value"}
                      >
                        {showFormKeyValue ? 
                          <EyeOff size={16} className="text-gray-400" /> : 
                          <Eye size={16} className="text-gray-400" />
                        }
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description or notes"
                    rows={2}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSave}
                  disabled={!formData.key_name || !formData.key_value}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Save size={16} />
                  {editingKey ? 'Update' : 'Save'} Key
                </button>
                <button
                  onClick={() => {
                    setEditingKey(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Keys List */}
          <div className="mb-4">
            <p className="text-sm text-gray-400">Debug: Keys array length: {keys.length}</p>
            <p className="text-sm text-gray-400">Debug: Loading state: {loading.toString()}</p>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading keys...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8">
              <Key size={48} className="text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No Keys Saved</h3>
              <p className="text-gray-500">Add your first API key or secret to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div key={key._id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-white">{key.key_name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          key.key_type === 'api_key' ? 'bg-blue-500/20 text-blue-300' :
                          key.key_type === 'secret' ? 'bg-red-500/20 text-red-300' :
                          key.key_type === 'token' ? 'bg-green-500/20 text-green-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {keyTypes.find(t => t.value === key.key_type)?.label || key.key_type}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2 mb-2 min-w-0">
                        <code className="bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-300 flex-1 min-w-0 overflow-hidden break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {(() => {
                            const value = key.key_value || key.value;
                            if (!value) return 'No value';
                            
                            if (visibleKeys.has(key._id || '')) {
                              // Show actual value - convert objects to formatted JSON
                              return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
                            } else {
                              // Show masked value
                              return maskKey(value);
                            }
                          })()}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key._id || '')}
                          className="p-1 hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                        >
                          {visibleKeys.has(key._id || '') ? 
                            <EyeOff size={16} className="text-gray-400" /> : 
                            <Eye size={16} className="text-gray-400" />
                          }
                        </button>
                      </div>
                      
                      {key.description && (
                        <p className="text-sm text-gray-400">{key.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(key)}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Edit key"
                      >
                        <Edit size={16} className="text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(key._id || '')}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Delete key"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeysManager;