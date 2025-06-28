import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, XCircle } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
    onSendMessage: (message: string, attachments?: File[]) => void;
    onTyping?: () => void;
    isDisabled?: boolean;
    placeholder?: string;
    conversationId?: number | string;
    replyingTo?: {
        id: number | string;
        content: string;
        sender?: string;
    } | null;
    onCancelReply?: () => void;
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
    replyingTo = null,
    onCancelReply,
}: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastTypingTime = useRef<number | null>(null);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);

    // Resize textarea as content changes
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`; // Max height of 150px
        }
    }, [message]);

    const handleSend = () => {
        if (message.trim() || attachments.length > 0) {
            onSendMessage(message, attachments);
            setMessage('');
            setAttachments([]);

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        handleTyping();
    };

    return (
        <Card className="p-3 m-2 mt-0 border-t-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Reply Banner */}
            {replyingTo && (
                <motion.div
                    className="flex items-center justify-between bg-muted/50 dark:bg-muted/20 rounded-lg p-2 mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                >
                    <div className="flex flex-col">
                        <span className="text-xs text-primary font-medium">
                            Replying to {replyingTo.sender || 'message'}
                        </span>
                        <span className="text-sm text-foreground/80 truncate max-w-[250px]">
                            {replyingTo.content}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancelReply}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <XCircle className="h-5 w-5" />
                    </Button>
                </motion.div>
            )}

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
                                key={`${file.name}-${index}`}
                                className="relative group"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                                <div className="w-20 h-20 rounded-md border border-border flex items-center justify-center overflow-hidden bg-muted/30">
                                    {file.type.startsWith('image/') ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="max-w-full max-h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-xs text-center p-1 text-muted-foreground">
                                            {file.name.substring(0, 15)}
                                            {file.name.length > 15 ? '...' : ''}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                                    onClick={() => removeAttachment(index)}
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="flex items-start gap-2">
                <div className="flex-1 flex items-start gap-2 rounded-full bg-muted/50 dark:bg-muted/20 backdrop-blur-sm px-4 py-2 border border-border">
                    {/* Emoji Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full self-end flex-shrink-0 text-muted-foreground hover:text-foreground"
                            >
                                <Smile className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="top"
                            align="start"
                            className="w-auto p-0 border-none shadow-lg mb-1"
                        >
                            <div className="rounded-lg overflow-hidden border border-border bg-popover">
                                <Picker
                                    data={data}
                                    onEmojiSelect={handleEmojiSelect}
                                    previewPosition="none"
                                    theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                                />
                            </div>
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
                        className="h-8 w-8 rounded-full self-end flex-shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={triggerFileInput}
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>

                    {/* Message Input */}
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-foreground placeholder:text-muted-foreground min-h-[36px] resize-none py-2 overflow-auto"
                        disabled={isDisabled}
                        data-conversation-id={conversationId}
                        rows={1}
                    />

                    {/* Voice Message Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full self-end flex-shrink-0 text-muted-foreground hover:text-foreground"
                    >
                        <Mic className="h-5 w-5" />
                    </Button>
                </div>

                {/* Send Button */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="self-end"
                >
                    <Button
                        onClick={handleSend}
                        size="icon"
                        className={cn(
                            "h-10 w-10 rounded-full",
                            "bg-primary hover:bg-primary/90",
                            "dark:bg-primary dark:hover:bg-primary/90",
                            "transition-colors duration-200"
                        )}
                        disabled={isDisabled || (!message.trim() && attachments.length === 0)}
                    >
                        <Send className="h-5 w-5 text-primary-foreground" />
                    </Button>
                </motion.div>
            </div>
        </Card>
    );
}
