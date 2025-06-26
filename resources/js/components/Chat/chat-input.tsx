import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Smile, Paperclip, Send, Mic, XCircle } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
    onSendMessage: (message: string, attachments?: File[]) => void;
    onTyping?: () => void;
    isDisabled?: boolean;
    placeholder?: string;
    conversationId?: number | string;
}

interface EmojiObject {
    id: string;
    name: string;
    native: string;
    unified: string;
    keywords: string[];
    shortcodes: string;
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

    const handleEmojiSelect = (emoji: EmojiObject) => {
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
        <GlassContainer className="p-3 m-2 mt-0 border-t-0">
            {/* Attachments Preview */}
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div
                        className="flex flex-wrap gap-2 mb-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                        {attachments.map((file, index) => (
                            <motion.div
                                key={index}
                                className="relative group"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                                <div className="w-20 h-20 rounded-md border border-white/20 dark:border-gray-700/50 flex items-center justify-center overflow-hidden backdrop-blur-sm bg-white/10 dark:bg-gray-800/30">
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
                                <motion.button
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-80 hover:opacity-100"
                                    onClick={() => removeAttachment(index)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <XCircle className="h-5 w-5" />
                                </motion.button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-full bg-white/10 dark:bg-gray-700/30 backdrop-blur-sm px-4 py-2 border border-white/10 dark:border-gray-700/50">
                    {/* Emoji Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <EnhancedButton variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                                <Smile className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </EnhancedButton>
                        </PopoverTrigger>
                        <PopoverContent
                            side="top"
                            align="start"
                            className="w-auto p-0 border-none shadow-lg mb-1 backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/50"
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
                    <EnhancedButton
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-full"
                        onClick={triggerFileInput}
                    >
                        <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </EnhancedButton>

                    {/* Message Input */}
                    <Input
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        disabled={isDisabled}
                        data-conversation-id={conversationId}
                    />

                    {/* Voice Message Button */}
                    <EnhancedButton variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                        <Mic className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </EnhancedButton>
                </div>

                {/* Send Button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <EnhancedButton
                        onClick={handleSend}
                        size="sm"
                        variant="primary"
                        className="rounded-full h-10 w-10 bg-gradient-to-r from-primary to-blue-500"
                        disabled={isDisabled || (!message.trim() && attachments.length === 0)}
                    >
                        <Send className="h-5 w-5 text-white" />
                    </EnhancedButton>
                </motion.div>
            </div>
        </GlassContainer>
    );
}
