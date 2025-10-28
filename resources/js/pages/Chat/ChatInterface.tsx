import React, { useState, useEffect } from 'react';
import { ChatHeader } from '@/components/Chat/chat-header';
import { ChatInput } from '@/components/Chat/chat-input';
import { ChatList, Message as ChatListMessage } from '@/components/Chat/chat-list';
import { ChatSidebar } from '@/components/Chat/chat-sidebar';
import { useToast } from '@/components/ui/use-toast';
import axios, { AxiosError } from 'axios';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, UserPlus, Users, Info, MessageSquare, Plus, Loader2, Upload } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { containerVariants, itemVariants } from '@/lib/theme-constants';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// If you have interfaces or types for your chats/messages, define or import them
interface ChatInterfaceProps {
  currentUser: {
    id: number | string;
    name: string;
    avatar?: string;
  };
}

interface Chat {
  id: number;
  name: string;
  participants: string[];
}

interface Message {
  id: number;
  senderId: number | string;
  content: string;
  timestamp: string;
}

export function ChatInterface({ currentUser }: ChatInterfaceProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();

  // Load chats
  useEffect(() => {
    async function loadChats() {
      try {
        const { data } = await axios.get(`/api/chats?userId=${currentUser.id}`);
        setChats(data);
      } catch (error) {
        console.error(error);
        toast({ title: 'Error loading chats', description: 'Please try again.' });
      } finally {
        setIsLoading(false);
      }
    }
    loadChats();
  }, [currentUser.id]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    async function loadMessages() {
      setIsLoadingMessages(true);
      try {
        const { data } = await axios.get(`/api/chats/${selectedChat.id}/messages`);
        setMessages(data);
      } catch (error) {
        console.error(error);
        toast({ title: 'Error loading messages', description: 'Please try again.' });
      } finally {
        setIsLoadingMessages(false);
      }
    }
    loadMessages();
  }, [selectedChat]);

  // Handle message send
  async function handleSendMessage(content: string) {
    if (!selectedChat || !content.trim()) return;
    setIsSending(true);
    try {
      const { data } = await axios.post(`/api/chats/${selectedChat.id}/messages`, {
        senderId: currentUser.id,
        content,
      });
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error sending message', description: 'Try again later.' });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
        <ChatSidebar
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          isLoading={isLoading}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <ChatHeader chat={selectedChat} />
            <ScrollArea className="flex-1 p-4">
              <ChatList
                messages={messages}
                currentUser={currentUser}
                isLoading={isLoadingMessages}
              />
            </ScrollArea>
            <ChatInput onSend={handleSendMessage} disabled={isSending} />
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500 dark:text-gray-400">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
// ✅ Add this exact line:
export default ChatInterface;
