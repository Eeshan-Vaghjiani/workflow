import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ChatComponent({ userId, receiverId }) {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load initial messages
    useEffect(() => {
        if (userId && receiverId) {
            loadMessages();
        }
    }, [userId, receiverId]);

    // Set up Echo listeners
    useEffect(() => {
        if (!window.Echo || !userId || !receiverId) return;

        // Listen for new messages
        const channel = window.Echo.private(`chat.${userId}`);

        channel.listen('.message.new', (data) => {
            console.log('New message received:', data);

            // Add the new message to our messages array
            setMessages(prevMessages => [...prevMessages, data.messageData]);
        });

        // Listen for typing indicators
        channel.listen('.user.typing', (data) => {
            if (data.userId !== userId) {
                setTypingUsers(prev => ({
                    ...prev,
                    [data.userId]: {
                        name: data.userName,
                        timestamp: new Date()
                    }
                }));

                // Clear typing indicator after 3 seconds
                setTimeout(() => {
                    setTypingUsers(prev => {
                        const newState = { ...prev };
                        delete newState[data.userId];
                        return newState;
                    });
                }, 3000);
            }
        });

        // Cleanup
        return () => {
            channel.stopListening('.message.new');
            channel.stopListening('.user.typing');
        };
    }, [userId, receiverId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Clean up typing users that haven't typed in a while
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setTypingUsers(prev => {
                const newState = { ...prev };
                Object.keys(newState).forEach(userId => {
                    if (now - new Date(newState[userId].timestamp) > 3000) {
                        delete newState[userId];
                    }
                });
                return newState;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Load messages from API
    const loadMessages = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`/api/messages/${receiverId}`);

            if (response.data.success) {
                setMessages(response.data.messages);
            } else {
                setError('Failed to load messages');
            }
        } catch (err) {
            console.error('Error loading messages:', err);
            setError('Error loading messages');
        } finally {
            setLoading(false);
        }
    };

    // Send message
    const sendMessage = async (e) => {
        e.preventDefault();

        if (!messageInput.trim()) return;

        try {
            setLoading(true);

            const response = await axios.post('/api/messages', {
                receiver_id: receiverId,
                message: messageInput
            });

            if (response.data.success) {
                // Clear input
                setMessageInput('');

                // Message will be added via Echo broadcast
            } else {
                setError('Failed to send message');
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Error sending message');
        } finally {
            setLoading(false);
        }
    };

    // Handle typing indicator
    const handleTyping = () => {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Only emit if not already typing
        if (!isTyping) {
            setIsTyping(true);

            // Emit typing event
            axios.post('/api/messages/typing', {
                receiver_id: receiverId
            }).catch(err => {
                console.error('Error sending typing indicator:', err);
            });
        }

        // Set timeout to clear typing state
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 3000);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Chat</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
                {loading && messages.length === 0 && (
                    <div className="flex justify-center">
                        <span className="loading loading-spinner"></span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
                        {error}
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`mb-4 ${message.sender.id === userId ? 'text-right' : 'text-left'}`}
                    >
                        <div
                            className={`inline-block p-3 rounded-lg ${
                                message.sender.id === userId
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-800'
                            }`}
                        >
                            {message.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {message.sender.name} • {message.timestamp}
                        </div>
                    </div>
                ))}

                {/* Typing indicators */}
                {Object.keys(typingUsers).length > 0 && (
                    <div className="text-gray-500 text-sm italic">
                        {Object.values(typingUsers).map(user => user.name).join(', ')}
                        {Object.keys(typingUsers).length === 1 ? ' is ' : ' are '}
                        typing...
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
                <form onSubmit={sendMessage} className="flex">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading || !messageInput.trim()}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
