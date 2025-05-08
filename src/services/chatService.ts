import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { Message, Chat } from '@/models/Chat';

export class ChatService {
  private static instance: ChatService;
  private chatsCollection = 'chats';
  private messagesCollection = 'messages';

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async createChat(userId: string, title: string = 'New Chat'): Promise<string> {
    try {
      console.log('Connecting to MongoDB...');
      const client = await clientPromise;
      console.log('MongoDB connected successfully');
      
      const db = client.db();
      console.log('Using database:', db.databaseName);
      
      const chat: Omit<Chat, 'id'> = {
        userId,
        title,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Creating chat document:', { ...chat, userId });
      const result = await db.collection(this.chatsCollection).insertOne(chat);
      console.log('Chat document created with ID:', result.insertedId);

      return result.insertedId.toString();
    } catch (error) {
      console.error('Error in createChat:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async addMessage(chatId: string, message: Omit<Message, 'id'>): Promise<string> {
    try {
      const client = await clientPromise;
      const db = client.db();
      
      const messageWithId = {
        ...message,
        id: new ObjectId().toString(),
        chatId
      };

      await db.collection(this.messagesCollection).insertOne(messageWithId);
      
      // Update chat's updatedAt timestamp
      await db.collection(this.chatsCollection).updateOne(
        { _id: new ObjectId(chatId) },
        { $set: { updatedAt: new Date() } }
      );

      return messageWithId.id;
    } catch (error) {
      console.error('Error in addMessage:', error);
      throw error;
    }
  }

  async getChat(chatId: string): Promise<Chat | null> {
    try {
      const client = await clientPromise;
      const db = client.db();
      
      const chat = await db.collection(this.chatsCollection).findOne({ _id: new ObjectId(chatId) });
      if (!chat) return null;

      return {
        id: chat._id.toString(),
        userId: chat.userId,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      };
    } catch (error) {
      console.error('Error in getChat:', error);
      throw error;
    }
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    try {
      const client = await clientPromise;
      const db = client.db();
      
      const messages = await db.collection(this.messagesCollection)
        .find({ chatId })
        .sort({ timestamp: 1 })
        .toArray();
      
      return messages.map(msg => ({
        id: msg._id.toString(),
        chatId: msg.chatId,
        text: msg.text,
        nodeList: msg.nodeList,
        sender: msg.sender,
        timestamp: msg.timestamp
      }));
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      throw error;
    }
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const client = await clientPromise;
      const db = client.db();
      
      const chats = await db.collection(this.chatsCollection)
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray();
      
      return chats.map(chat => ({
        id: chat._id.toString(),
        userId: chat.userId,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }));
    } catch (error) {
      console.error('Error in getUserChats:', error);
      throw error;
    }
  }
} 