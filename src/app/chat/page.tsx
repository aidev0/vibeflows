'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import Chat from '../components/Chat';

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [allChats, setAllChats] = useState<{ id: string; title: string; created_at: string; messageCount: number }[]>([]);
  const [showChatList, setShowChatList] = useState(true);

  useEffect(() => {
    const loadOrCreateChat = async () => {
      if (!isLoading && user?.sub) {
        try {
          // First try to fetch existing chats
          const chatsResponse = await fetch('/api/chats');
          if (!chatsResponse.ok) {
            throw new Error('Failed to fetch chats');
          }
          
          const chatsData = await chatsResponse.json();
          const existingChats = chatsData.chats || [];
          setAllChats(existingChats);
          
          if (existingChats.length > 0) {
            // If there are existing chats, use the most recent one
            const mostRecentChat = existingChats[0];
            setChatId(mostRecentChat.id);
          } else {
            // If no chats exist, create a new one
            const response = await fetch('/api/chat/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: 'New Workflow',
                type: 'workflow'
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to create chat');
            }

            const data = await response.json();
            if (!data?.chatId) {
              throw new Error('Invalid response format');
            }

            // Create welcome message
            const welcomeMessage = {
              chatId: data.chatId,
              message: {
                id: `ai-${Date.now()}`,
                chatId: data.chatId,
                text: `# 🚀 Welcome to VibeFlows, ${user?.given_name || 'there'}!\n\nI'm your **Marketing Automation AI** – ready to transform your marketing ideas into production-ready workflows without a single line of code.\n\n## What I Can Build For You:\n- **Email Marketing Campaigns** with smart segmentation and personalization\n- **Lead Nurturing Sequences** that convert prospects into customers  \n- **Social Media Automation** across all your channels\n- **Customer Journey Workflows** from first touch to retention\n- **Analytics Dashboards** that track what actually matters\n- **CRM Integrations** that sync your entire marketing stack\n\n## Just Tell Me What You Need:\n*\"Set up a welcome email series for new subscribers\"*  \n*\"Create a lead scoring system for our B2B prospects\"*  \n*\"Build a social media campaign for our product launch\"*  \n*\"Automate our customer onboarding process\"*\n\n**No technical jargon required** – describe your marketing challenge in plain English, and I'll architect the perfect solution using our 1000+ integrations and enterprise-grade AI agents.\n\nReady to automate something amazing? What marketing workflow should we build first? 💡"`,
                sender: 'ai',
                timestamp: new Date(),
                type: 'simple_text'
              }
            };

            // Save welcome message to database
            const messageResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(welcomeMessage),
            });

            if (!messageResponse.ok) {
              console.error('Failed to send welcome message');
            }

            // Update state after both operations succeed
            setChatId(data.chatId);
            setAllChats([{
              id: data.chatId,
              title: 'New Workflow',
              created_at: new Date().toISOString(),
              messageCount: 1
            }]);
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setIsLoadingChat(false);
        }
      }
    };

    loadOrCreateChat();
  }, [user, isLoading]);

  const handleDeleteChat = async (chatIdToDelete: string) => {
    try {
      const response = await fetch(`/api/chat?chatId=${chatIdToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Update local state first
      setAllChats(prev => prev.filter(chat => chat.id !== chatIdToDelete));
      
      // If the deleted chat was the current one, switch to another chat
      if (chatIdToDelete === chatId) {
        const remainingChats = allChats.filter(chat => chat.id !== chatIdToDelete);
        if (remainingChats.length > 0) {
          setChatId(remainingChats[0].id);
        } else {
          // If no chats left, create a new one
          const response = await fetch('/api/chat/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'New Workflow',
              type: 'workflow'
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create chat');
          }

          const data = await response.json();
          if (!data?.chatId) {
            throw new Error('Invalid response format');
          }

          // Create welcome message
          const welcomeMessage = {
            chatId: data.chatId,
            message: {
              id: `ai-${Date.now()}`,
              chatId: data.chatId,
              text: `# 🚀 Welcome to VibeFlows, ${user?.given_name || 'there'}!\n\nI'm your **Marketing Automation AI** – ready to transform your marketing ideas into production-ready workflows without a single line of code.\n\n## What I Can Build For You:\n- **Email Marketing Campaigns** with smart segmentation and personalization\n- **Lead Nurturing Sequences** that convert prospects into customers  \n- **Social Media Automation** across all your channels\n- **Customer Journey Workflows** from first touch to retention\n- **Analytics Dashboards** that track what actually matters\n- **CRM Integrations** that sync your entire marketing stack\n\n## Just Tell Me What You Need:\n*\"Set up a welcome email series for new subscribers\"*  \n*\"Create a lead scoring system for our B2B prospects\"*  \n*\"Build a social media campaign for our product launch\"*  \n*\"Automate our customer onboarding process\"*\n\n**No technical jargon required** – describe your marketing challenge in plain English, and I'll architect the perfect solution using our 1000+ integrations and enterprise-grade AI agents.\n\nReady to automate something amazing? What marketing workflow should we build first? 💡"`,
              sender: 'ai',
              timestamp: new Date(),
              type: 'simple_text'
            }
          };

          // Save welcome message to database
          const messageResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(welcomeMessage),
          });

          if (!messageResponse.ok) {
            console.error('Failed to send welcome message');
          }

          // Update state with new chat
          setChatId(data.chatId);
          setAllChats([{
            id: data.chatId,
            title: 'New Workflow',
            created_at: new Date().toISOString(),
            messageCount: 1
          }]);
        }
      }

      // Keep chat list open
      setShowChatList(true);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chat?chatId=${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename chat');
      }

      // Update local state
      setAllChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  if (isLoading || isLoadingChat) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Chat 
        chatId={chatId}
        onChatIdChange={setChatId}
        systemMessage="I am an AI assistant that helps you create and manage workflows. I can help you automate tasks, create integrations, and build complex workflows."
        welcomeMessage={`# 🚀 Welcome to VibeFlows, ${user?.given_name || 'there'}!\n\nI'm your **Marketing Automation AI** – ready to transform your marketing ideas into production-ready workflows without a single line of code.\n\n## What I Can Build For You:\n- **Email Marketing Campaigns** with smart segmentation and personalization\n- **Lead Nurturing Sequences** that convert prospects into customers  \n- **Social Media Automation** across all your channels\n- **Customer Journey Workflows** from first touch to retention\n- **Analytics Dashboards** that track what actually matters\n- **CRM Integrations** that sync your entire marketing stack\n\n## Just Tell Me What You Need:\n*\"Set up a welcome email series for new subscribers\"*  \n*\"Create a lead scoring system for our B2B prospects\"*  \n*\"Build a social media campaign for our product launch\"*  \n*\"Automate our customer onboarding process\"*\n\n**No technical jargon required** – describe your marketing challenge in plain English, and I'll architect the perfect solution using our 1000+ integrations and enterprise-grade AI agents.\n\nReady to automate something amazing? What marketing workflow should we build first? 💡`}
        chatType="workflow"
        allChats={allChats}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        showChatList={showChatList}
        setShowChatList={setShowChatList}
      />
    </div>
  );
} 