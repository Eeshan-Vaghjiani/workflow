import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useForm } from '@inertiajs/react';

interface Message {
    id: number;
    user_id: number;
    message: string;
    created_at: string;
    user: {
        id: number;
        name: string;
    };
}

interface ChatBoxProps {
    groupId: number;
    currentUserId: number;
}

export default function ChatBox({ groupId, currentUserId }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { data, setData, reset } = useForm({
        message: '',
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            const response = await axios.get(`/api/groups/${groupId}/messages`);
            setMessages(response.data.data.reverse());
            setLoading(false);
            scrollToBottom();
        } catch (error) {
            console.error('Error loading messages:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
        // Set up polling for new messages every 5 seconds
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [groupId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.message.trim() || sending) return;

        setSending(true);
        try {
            const response = await axios.post(`/api/groups/${groupId}/messages`, {
                message: data.message,
            });
            setMessages([...messages, response.data]);
            reset('message');
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold">Group Chat</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.user_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-3 ${message.user_id === currentUserId
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-700'
                                    }`}
                            >
                                <div className="text-sm font-medium mb-1">
                                    {message.user_id === currentUserId ? 'You' : message.user.name}
                                </div>
                                <div className="break-words">{message.message}</div>
                                <div className="text-xs mt-1 opacity-70">
                                    {formatTimestamp(message.created_at)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Type your message..."
                        value={data.message}
                        onChange={(e) => setData('message', e.target.value)}
                        disabled={sending}
                    />
                    <Button type="submit" disabled={sending || !data.message.trim()}>
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
} 