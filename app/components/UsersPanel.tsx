'use client';

import React, { useState, useEffect } from 'react';
import { User, Clock, Mail, MessageCircle, ChevronRight, X, Search, Calendar, Network } from 'lucide-react';

// Image component with fallback
const UserAvatar: React.FC<{ 
  src?: string; 
  alt: string; 
  size: 'small' | 'large';
  className?: string;
}> = ({ src, alt, size, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const sizeClasses = size === 'small' ? 'w-12 h-12' : 'w-16 h-16';
  const iconSize = size === 'small' ? 20 : 24;
  const borderColor = size === 'small' ? 'border-gray-600' : 'border-gray-500';
  
  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [src]);
  
  if (!src || imageError) {
    return (
      <div className={`${sizeClasses} bg-gray-600 rounded-full flex items-center justify-center border-2 ${borderColor} ${className}`}>
        <User size={iconSize} className="text-gray-400" />
      </div>
    );
  }
  
  return (
    <div className={`${sizeClasses} relative ${className}`}>
      {imageLoading && (
        <div className={`${sizeClasses} bg-gray-600 rounded-full flex items-center justify-center border-2 ${borderColor} absolute inset-0`}>
          <div className="animate-pulse">
            <User size={iconSize} className="text-gray-400" />
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses} rounded-full object-cover border-2 ${borderColor} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={() => {
          setImageLoading(false);
        }}
        onError={(e) => {
          setImageError(true);
          setImageLoading(false);
        }}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
    </div>
  );
};

interface UserProfile {
  _id?: any;
  user_id: string;
  email?: string;
  email_verified?: boolean;
  family_name?: string;
  given_name?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

interface Chat {
  _id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  flow_data?: any;
}

interface UsersPanelProps {
  onClose: () => void;
}

const UsersPanel: React.FC<UsersPanelProps> = ({ onClose }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [userWorkflows, setUserWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);

  // Fetch all users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?action=all');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      alert('Failed to fetch users. You may not have admin access.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserChats = async (userId: string) => {
    try {
      setLoadingChats(true);
      const response = await fetch(`/api/chats?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user chats');
      }
      
      const chats = await response.json();
      setUserChats(chats || []);
    } catch (error) {
      setUserChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchUserWorkflows = async (userId: string) => {
    try {
      setLoadingWorkflows(true);
      const response = await fetch(`/api/flows?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user workflows');
      }
      
      const workflows = await response.json();
      setUserWorkflows(workflows || []);
    } catch (error) {
      setUserWorkflows([]);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  const handleUserClick = async (user: UserProfile) => {
    setSelectedUser(user);
    await Promise.all([
      fetchUserChats(user.user_id),
      fetchUserWorkflows(user.user_id)
    ]);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <User size={24} className="text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Users Management</h2>
            <span className="text-sm text-gray-400">({users.length} users)</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Users List */}
          <div className={`${selectedUser ? 'w-1/2' : 'w-full'} overflow-y-auto p-4 space-y-3 border-r border-gray-700`}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.user_id}
                  onClick={() => handleUserClick(user)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedUser?.user_id === user.user_id
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* User Photo */}
                    <div className="flex-shrink-0">
                      <UserAvatar 
                        src={user.picture} 
                        alt={user.name || 'User'} 
                        size="small"
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {user.name || user.nickname || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-400 truncate flex items-center gap-1">
                        <Mail size={12} />
                        {user.email || 'No email'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Last: {formatRelativeTime(user.last_login)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Joined: {new Date(user.created_at || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* User Details & Chats */}
          {selectedUser && (
            <div className="w-1/2 overflow-y-auto p-4">
              {/* User Details */}
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar 
                    src={selectedUser.picture} 
                    alt={selectedUser.name || 'User'} 
                    size="large"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedUser.name || selectedUser.nickname || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">User ID:</span>
                    <span className="text-gray-300 font-mono text-xs">{selectedUser.user_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-gray-300 text-xs">{selectedUser.email || 'No email'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email Verified:</span>
                    <span className={selectedUser.email_verified ? 'text-green-400' : 'text-red-400'}>
                      {selectedUser.email_verified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-gray-300">{formatDate(selectedUser.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Login:</span>
                    <span className="text-gray-300">{formatDate(selectedUser.last_login)}</span>
                  </div>
                </div>
              </div>

              {/* User Workflows */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Network size={20} className="text-green-400" />
                  User Workflows ({userWorkflows.length})
                </h4>

                {loadingWorkflows ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  </div>
                ) : userWorkflows.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-700/30 rounded-lg">
                    No workflows found for this user
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userWorkflows.map(workflow => (
                      <div
                        key={workflow._id}
                        className="p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-colors"
                      >
                        <h5 className="font-medium text-white truncate">{workflow.name}</h5>
                        {workflow.description && (
                          <p className="text-xs text-gray-400 mt-1 truncate">{workflow.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Created: {formatRelativeTime(workflow.created_at)}</span>
                          <span>Updated: {formatRelativeTime(workflow.updated_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Chats */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <MessageCircle size={20} className="text-purple-400" />
                  User Chats ({userChats.length})
                </h4>

                {loadingChats ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                  </div>
                ) : userChats.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-700/30 rounded-lg">
                    No chats found for this user
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userChats.map(chat => (
                      <div
                        key={chat._id}
                        className="p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-colors"
                      >
                        <h5 className="font-medium text-white truncate">{chat.name}</h5>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>Created: {formatRelativeTime(chat.created_at)}</span>
                          <span>Updated: {formatRelativeTime(chat.updated_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPanel;