import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, XCircle, File as FileIcon } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
    onSendMessage: (message: string, attachments?: File[]) => void;
    onTyping?: () => void;
    isDisabled?: boolean;
    placeholder?: string;
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() || attachments.length > 0) {
            onSendMessage(message, attachments);
            setMessage('');
            setAttachments([]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
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
            <AnimatePresence>
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
            </AnimatePresence>

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
                                <div className="w-20 h-20 rounded-lg border border-border flex items-center justify-center overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors">
                                    {file.type.startsWith('image/') ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="max-w-full max-h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 p-2">
                                            <FileIcon className="h-8 w-8 text-muted-foreground" />
                                            <div className="text-xs text-center text-muted-foreground">
                                                {file.name.substring(0, 15)}
                                                {file.name.length > 15 ? '...' : ''}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip className="h-5 w-5" />
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                >
                    <Smile className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <Input
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            handleTyping();
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={cn(
                            "bg-muted/50 border-0 focus-visible:ring-0 text-base py-6",
                            "placeholder:text-muted-foreground/70"
                        )}
                    />
                </div>
                <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "text-muted-foreground hover:text-foreground",
                        (message.trim() || attachments.length > 0) && "text-primary hover:text-primary"
                    )}
                    disabled={isDisabled}
                >
                    <Send className="h-5 w-5" />
                </Button>
            </form>
        </Card>
    );
}
