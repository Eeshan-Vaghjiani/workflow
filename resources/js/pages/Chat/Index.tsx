import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Users, Clock, ArrowLeftCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  avatar?: string;
}

interface Message {
  id: number;
  content: string;
  message: string;
  user_id: number;
  created_at: string;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
}

interface Chat {
  id: number;
  name: string;
  type: 'group' | 'direct';
  avatar?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
  };
  unreadCount?: number;
}

interface Props {
  auth: {
    user: User;
  };
  initialGroups?: any[];
}

export default function UnifiedChat({ auth, initialGroups = [] }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.user;

  const breadcrumbs = [{ title: 'Chat', href: '/chat' }];

  // Fetch groups and direct messages to create a unified chat list
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch groups
        const groupsResponse = await axios.get('/api/groups');
        const groups = groupsResponse.data.map((group: any) => ({
          id: group.id,
          name: group.name,
          type: 'group',
          avatar: group.avatar,
          lastMessage: group.last_message ? {
            content: group.last_message.message,
            timestamp: group.last_message.created_at
          } : undefined,
          unreadCount: 0 // You'd implement this based on your notification system
        }));
        
        // Fetch direct messages (placeholder - implement your direct message API)
        // const directMessagesResponse = await axios.get('/api/messages');
        // const directMessages = directMessagesResponse.data;
        
        // For now, just use groups
        setChats(groups);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load chats. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    fetchChats();
  }, []);

  // Fetch messages for the selected chat
  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          setLoadingMessages(true);
          let response;
          
          if (selectedChat.type === 'group') {
            response = await axios.get(`/api/groups/${selectedChat.id}/messages`);
          } else {
            // For direct messages
            // response = await axios.get(`/api/messages/${selectedChat.id}`);
            // For now, just return empty for direct messages
            response = { data: [] };
          }
          
          setMessages(response.data);
          setLoadingMessages(false);
        } catch (error) {
          console.error('Error fetching messages:', error);
          setLoadingMessages(false);
          toast({
            title: 'Error',
            description: 'Failed to load messages. Please try again.',
            variant: 'destructive',
          });
        }
      };
      
      fetchMessages();
      
      // Set up Pusher channel for real-time updates based on chat type
      const channelName = selectedChat.type === 'group' 
        ? `group.${selectedChat.id}` 
        : `chat.${selectedChat.id}`;
      
      const channel = window.Echo.join(channelName);
      
      channel.listen('.new-message', (data: Message) => {
        // Only add the message if it's not already in our list
        if (!messages.some(msg => msg.id === data.id)) {
          setMessages(prevMessages => [...prevMessages, data]);
        }
      });
      
      return () => {
        channel.stopListening('.new-message');
        window.Echo.leave(channelName);
      };
    }
  }, [selectedChat?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setSearchQuery('');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return;

    try {
      setIsSending(true);
      let response;
      
      if (selectedChat.type === 'group') {
        response = await axios.post(`/api/groups/${selectedChat.id}/messages`, {
          message: newMessage,
        });
      } else {
        // For direct messages
        // response = await axios.post(`/api/messages`, {
        //   recipient_id: selectedChat.id,
        //   message: newMessage,
        // });
        response = { data: {} };
      }

      // Add the new message to the list locally (the Pusher event will add it properly)
      const tempMessage: Message = {
        id: Date.now(), // Temporary ID until the real one arrives via Pusher
        content: newMessage,
        message: newMessage,
        user_id: currentUser.id,
        created_at: new Date().toISOString(),
        user: currentUser
      };
      
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      setNewMessage('');

      // Update the chat in the list with the last message
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id 
            ? {
                ...chat,
                lastMessage: {
                  content: newMessage,
                  timestamp: new Date().toISOString(),
                },
              }
            : chat
        )
      );
      
      setIsSending(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsSending(false);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const filteredChats = searchQuery
    ? chats.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Chat" />
      <div className="flex h-[80vh] bg-white dark:bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
        {/* Chat Sidebar */}
        <div className={`${selectedChat && window.innerWidth < 768 ? 'hidden' : 'block'} w-full md:w-80 border-r border-neutral-200 dark:border-neutral-700 flex flex-col`}>
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-bold mb-3">Chats</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Input
                placeholder="Search conversations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-neutral-500"></div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                <p>No conversations yet</p>
                <p>Start chatting with your groups or contacts</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    className={`flex w-full items-center gap-2 rounded-md p-2 ${
                      selectedChat?.id === chat.id 
                        ? 'bg-neutral-100 dark:bg-neutral-800' 
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    onClick={() => handleSelectChat(chat)}
                  >
                    <div className="relative">
                      {chat.avatar ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={chat.avatar} alt={chat.name} />
                          <AvatarFallback>
                            {chat.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300">
                          {chat.type === 'group' ? (
                            <Users size={20} />
                          ) : (
                            chat.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                      )}
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col items-start overflow-hidden">
                      <div className="flex w-full justify-between">
                        <span className="font-medium">{chat.name}</span>
                        {chat.lastMessage && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center">
                            <Clock size={10} className="mr-1" />
                            {formatTime(chat.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-sm text-neutral-500 truncate w-full text-left dark:text-neutral-400">
                          {chat.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedChat ? (
          <div className={`${selectedChat && window.innerWidth < 768 ? 'block' : 'hidden'} md:block flex-1 flex flex-col h-full`}>
            {/* Chat Header */}
            <div className="flex items-center p-4 border-b border-neutral-200 dark:border-neutral-700">
              {window.innerWidth < 768 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mr-2"
                  onClick={() => setSelectedChat(null)}
                >
                  <ArrowLeftCircle size={20} />
                </Button>
              )}
              {selectedChat.avatar ? (
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={selectedChat.avatar} alt={selectedChat.name} />
                  <AvatarFallback>
                    {selectedChat.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex h-10 w-10 mr-3 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300">
                  {selectedChat.type === 'group' ? (
                    <Users size={20} />
                  ) : (
                    selectedChat.name.substring(0, 2).toUpperCase()
                  )}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium">{selectedChat.name}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedChat.type === 'group' ? 'Group chat' : 'Direct message'}
                </p>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-neutral-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 dark:text-neutral-400">
                  <p className="mb-2">No messages yet</p>
                  <p>Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.user_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.user_id !== currentUser.id && (
                        <Avatar className="h-8 w-8 mr-2 mt-1">
                          <AvatarImage src={message.user.avatar} alt={message.user.name} />
                          <AvatarFallback>
                            {message.user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.user_id === currentUser.id
                            ? 'bg-blue-500 text-white dark:bg-blue-600'
                            : 'bg-neutral-100 dark:bg-neutral-800'
                        }`}
                      >
                        {message.user_id !== currentUser.id && (
                          <div className="text-xs font-medium mb-1 text-neutral-500 dark:text-neutral-300">
                            {message.user.name}
                          </div>
                        )}
                        <div className="break-words">
                          {message.content || message.message}
                        </div>
                        <div className="text-xs mt-1 opacity-70 text-right">
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            
            {/* Message Input */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
              <form 
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSending}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isSending || !newMessage.trim()}
                >
                  {isSending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-white"></div>
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center text-neutral-500 dark:text-neutral-400">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Send size={24} />
              </div>
              <h3 className="mb-1 text-lg font-medium">Select a chat</h3>
              <p>Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 