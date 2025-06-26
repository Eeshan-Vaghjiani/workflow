import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smile, Paperclip, Send, Mic, Image, XCircle } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface ChatInputProps {
    onSendMessage: (message: string, attachments?: File[]) => void;
    onTyping?: () => void;
    isDisabled?: boolean;
    placeholder?: string;
    conversationId?: number | string;
}

export function ChatInput({
    onSendMessage,
    onTyping,
    isDisabled = false,
    placeholder = "Type a message...",
    conversationId,
}: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastTypingTime = useRef<number | null>(null);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleSend = () => {
        if (message.trim() || attachments.length > 0) {
            onSendMessage(message, attachments);
            setMessage('');
            setAttachments([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileList = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...fileList]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleEmojiSelect = (emoji: any) => {
        setMessage(prev => prev + emoji.native);
    };

    const handleTyping = () => {
        const now = Date.now();

        // Only trigger typing event if it's been more than 3 seconds since last event
        if (!lastTypingTime.current || now - lastTypingTime.current > 3000) {
            lastTypingTime.current = now;
            if (onTyping) onTyping();
        }

        // Reset typing timeout
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        // Set timeout to reset typing state
        typingTimeout.current = setTimeout(() => {
            lastTypingTime.current = null;
        }, 3000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        handleTyping();
    };

    return (
        <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map((file, index) => (
                        <div key={index} className="relative group">
                            <div className="w-20 h-20 rounded-md border border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700">
                                {file.type.startsWith('image/') ? (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="max-w-full max-h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-xs text-center p-1 text-gray-600 dark:text-gray-300">
                                        {file.name.substring(0, 15)}
                                        {file.name.length > 15 ? '...' : ''}
                                    </div>
                                )}
                            </div>
                            <button
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full"
                                onClick={() => removeAttachment(index)}
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 px-4 py-2">
                    {/* Emoji Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <Smile className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="top"
                            align="start"
                            className="w-auto p-0 border-none shadow-lg mb-1"
                            avoidCollisions={false}
                        >
                            <Picker
                                data={data}
                                onEmojiSelect={handleEmojiSelect}
                                previewPosition="none"
                                theme="light"
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Attachment Button */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        multiple
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={triggerFileInput}
                    >
                        <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </Button>

                    {/* Message Input */}
                    <Input
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        disabled={isDisabled}
                        data-conversation-id={conversationId}
                    />

                    {/* Voice Message Button */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <Mic className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </Button>
                </div>

                {/* Send Button */}
                <Button
                    onClick={handleSend}
                    size="icon"
                    className="rounded-full h-10 w-10 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    disabled={isDisabled || (!message.trim() && attachments.length === 0)}
                >
                    <Send className="h-5 w-5 text-white" />
                </Button>
            </div>
        </div>
    );
}
