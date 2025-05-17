import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Users, Clock, ArrowLeftCircle, Plus, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  avatar?: string;
  email?: string;
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
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.user;

  const breadcrumbs = [{ title: 'Chat', href: '/chat' }];

  // Fetch groups and direct messages to create a unified chat list
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        
        // Get CSRF token from meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const authHeaders = {
          'X-CSRF-TOKEN': csrfToken || '',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        };
        
        // Fetch groups using the correct chat groups endpoint
        const groupsResponse = await axios.get(window.location.origin + '/api/chat/groups', {
          withCredentials: true,
          headers: authHeaders
        });
        
        // Check if the response contains data directly or has a nested data property
        const groupsData = groupsResponse.data.data || groupsResponse.data;
        
        console.log('Groups response:', groupsData);
        
        const groups = Array.isArray(groupsData) ? groupsData.map((group: any) => ({
          id: group.id,
          name: group.name,
          type: 'group' as const,
          avatar: group.avatar,
          lastMessage: group.lastMessage ? {
            content: group.lastMessage.content,
            timestamp: group.lastMessage.timestamp || group.lastMessage.date
          } : undefined,
          unreadCount: group.unreadCount || 0
        })) : [];
        
        // Fetch direct message conversations
        try {
          const directMessagesResponse = await axios.get(window.location.origin + '/api/direct-messages', {
            withCredentials: true,
            headers: authHeaders
          });
          const directMessagesData = directMessagesResponse.data.conversations || directMessagesResponse.data || [];
          
          console.log('Direct messages response:', directMessagesData);
          
          const directChats = Array.isArray(directMessagesData) ? directMessagesData.map((conversation: any) => ({
            id: conversation.user.id,
            name: conversation.user.name,
            type: 'direct' as const,
            avatar: conversation.user.avatar,
            lastMessage: conversation.lastMessage ? {
              content: conversation.lastMessage.content,
              timestamp: conversation.lastMessage.timestamp || conversation.lastMessage.date
            } : undefined,
            unreadCount: conversation.unreadCount || 0
          })) : [];
          
          // Combine groups and direct messages
          setChats([...groups, ...directChats] as Chat[]);
        } catch (dmError) {
          console.error('Error fetching direct messages:', dmError);
          // Continue with just groups if direct messages fail
          setChats(groups as Chat[]);
        }
        
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
          
          // Get CSRF token from meta tag
          const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
          const authHeaders = {
            'X-CSRF-TOKEN': csrfToken || '',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          };
          
          let response;
          
          if (selectedChat.type === 'group') {
            response = await axios.get(window.location.origin + `/api/web/groups/${selectedChat.id}/messages`, {
              withCredentials: true,
              headers: authHeaders
            });
          } else {
            // For direct messages - implement later
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
      try {
        // Check if Echo is properly initialized
        if (typeof window.Echo === 'undefined') {
          console.error('Echo is not defined. Real-time messaging will not work.');
          return;
        }
        
        const channelName = selectedChat.type === 'group' 
          ? `group.${selectedChat.id}` 
          : `chat.${selectedChat.id}`;
        
        console.log('Joining channel:', channelName);
        
        // Use presence channel for group chat, private for direct messages
        const channel = window.Echo.private(channelName);
        
        channel.listen('.new-message', (data: Message) => {
          console.log('Received new message:', data);
          // Only add the message if it's not already in our list
          if (!messages.some(msg => msg.id === data.id)) {
            setMessages(prevMessages => [...prevMessages, data]);
          }
        });
        
        return () => {
          console.log('Leaving channel:', channelName);
          channel.stopListening('.new-message');
          window.Echo.leave(channelName);
        };
      } catch (error) {
        console.error('Error setting up real-time channel:', error);
      }
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
      
      // Get CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const authHeaders = {
        'X-CSRF-TOKEN': csrfToken || '',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };
      
      let response;
      
      if (selectedChat.type === 'group') {
        response = await axios.post(window.location.origin + `/api/web/groups/${selectedChat.id}/messages`, {
          message: newMessage,
        }, {
          withCredentials: true,
          headers: authHeaders
        });
      } else {
        // For direct messages - implement later
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
  
  // Search for users
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearchingUsers(true);
      console.log('Searching for users with query:', query);
      
      // Get CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      console.log('CSRF token available:', !!csrfToken);
      
      // Use an absolute URL to ensure it goes through the web middleware
      const apiUrl = window.location.origin + `/api/chat/search-users?name=${encodeURIComponent(query)}`;
      console.log('Using API URL:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        withCredentials: true,
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      console.log('User search results:', response.data);
      
      // Check if the response contains an error
      if (response.data && response.data.error) {
        console.error('Search API returned error:', response.data.error);
        toast({
          title: 'Search Error',
          description: response.data.error,
          variant: 'destructive',
        });
        setSearchResults([]);
        setIsSearchingUsers(false);
        return;
      }
      
      // Make sure we got an array back
      if (!Array.isArray(response.data)) {
        console.error('Expected array of users but got:', typeof response.data, response.data);
        toast({
          title: 'Unexpected Data Format',
          description: 'The server returned data in an unexpected format.',
          variant: 'destructive',
        });
        setSearchResults([]);
      } else {
        // Valid array response
        setSearchResults(response.data);
      }
      
      setIsSearchingUsers(false);
    } catch (error) {
      console.error('Error searching users:', error);
      
      // Extract the error message from Axios error
      let errorMessage = 'Failed to search for users';
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Error response data:', error.response.data);
          errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
        } else if (error.request) {
          errorMessage = 'No response received from server';
          console.error('No response received:', error.request);
        }
      }
      
      toast({
        title: 'Search Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      setSearchResults([]);
      setIsSearchingUsers(false);
    }
  };
  
  // Handle user search input change
  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (showUserSearch) {
      // Debounce search to avoid too many requests
      const timeoutId = setTimeout(() => {
        searchUsers(query);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  };
  
  // Start a new direct message chat with a user
  const startDirectChat = (user: User) => {
    // Check if we already have a chat with this user
    const existingChat = chats.find(
      chat => chat.type === 'direct' && chat.id === user.id
    );
    
    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      // Create a new chat and select it
      const newChat: Chat = {
        id: user.id,
        name: user.name,
        type: 'direct' as const,
        avatar: user.avatar,
      };
      
      setChats(prevChats => [...prevChats, newChat]);
      setSelectedChat(newChat);
    }
    
    // Reset search
    setShowUserSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  const filteredChats = showUserSearch 
    ? [] 
    : searchQuery
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
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">Chats</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowUserSearch(true);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                title="New chat"
              >
                <Plus size={20} />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Input
                placeholder={showUserSearch ? "Search for a user..." : "Search conversations..."}
                className="pl-8"
                value={searchQuery}
                onChange={handleUserSearchChange}
              />
            </div>
            {showUserSearch && (
              <div className="flex items-center mt-2">
                <button 
                  className="text-sm text-blue-500 flex items-center"
                  onClick={() => {
                    setShowUserSearch(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <ArrowLeftCircle size={16} className="mr-1" />
                  Back to chats
                </button>
              </div>
            )}
          </div>
          
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-neutral-500"></div>
              </div>
            ) : showUserSearch ? (
              // Show user search results
              <div className="p-2 space-y-1">
                {isSearchingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-500"></div>
                    <span className="ml-2 text-sm text-neutral-500">Searching...</span>
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="p-4 text-center text-sm text-neutral-500">
                    Type at least 2 characters to search for users
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-neutral-500">
                    No users found matching "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      className="flex w-full items-center gap-2 rounded-md p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      onClick={() => startDirectChat(user)}
                    >
                      <div className="relative">
                        {user.avatar ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300">
                            <User size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col items-start">
                        <span className="font-medium">{user.name}</span>
                        {user.email && (
                          <span className="text-xs text-neutral-500">{user.email}</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                <p>No conversations found</p>
                <p>Try starting a new conversation</p>
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