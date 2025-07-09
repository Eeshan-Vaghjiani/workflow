import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, XCircle, File as FileIcon, Image, Video, Music } from 'lucide-react';
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
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
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
            const newFiles = Array.from(e.target.files);
            setAttachments((prev: File[]) => [...prev, ...newFiles]);
        }
    };

    const handleEmojiSelect = (emoji: EmojiObject) => {
        setMessage(prev => prev + emoji.native);
        setIsEmojiPickerOpen(false);
        
        // Focus back on input after emoji selection
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 100);
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

    const removeAttachment = (index: number) => {
        setAttachments((prev: File[]) => prev.filter((_: File, i: number) => i !== index));
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <Image className="h-6 w-6" />;
        if (fileType.startsWith('video/')) return <Video className="h-6 w-6" />;
        if (fileType.startsWith('audio/')) return <Music className="h-6 w-6" />;
        return <FileIcon className="h-6 w-6" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card className="p-4 m-2 mt-0 border-t-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
            {/* Reply Banner */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 mb-3 border-l-4 border-primary"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <div className="flex flex-col">
                            <span className="text-xs text-primary font-semibold">
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
                            className="text-muted-foreground hover:text-foreground h-8 w-8"
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attachments Preview */}
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4"
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
                                <div className="w-full h-24 rounded-lg border-2 border-dashed border-border bg-gradient-to-br from-muted/50 to-muted/30 flex flex-col items-center justify-center overflow-hidden hover:bg-muted/50 transition-all duration-200 group-hover:border-primary/50">
                                    {file.type.startsWith('image/') ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="w-full h-full object-cover rounded-md"
                                        />
                                    ) : (
                                        <>
                                            <div className="text-muted-foreground mb-1">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div className="text-xs text-center text-muted-foreground px-2">
                                                <div className="truncate max-w-full">
                                                    {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                                                </div>
                                                <div className="text-xs opacity-70">
                                                    {formatFileSize(file.size)}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    onClick={() => removeAttachment(index)}
                                >
                                    <XCircle className="h-3 w-3" />
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
                {/* Attachment Button */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Attach files</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                />

                {/* Emoji Button */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200",
                                            isEmojiPickerOpen && "text-primary bg-primary/10"
                                        )}
                                    >
                                        <Smile className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent 
                                    className="w-auto p-0 border-0 shadow-2xl"
                                    side="top"
                                    align="start"
                                >
                                    <div className="rounded-lg overflow-hidden">
                                        <Picker
                                            data={data}
                                            onEmojiSelect={handleEmojiSelect}
                                            theme="auto"
                                            set="native"
                                            searchPosition="sticky"
                                            skinTonePosition="search"
                                            previewPosition="none"
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Add emoji</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Message Input */}
                <div className="flex-1">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={cn(
                            "min-h-[44px] max-h-[150px] resize-none bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/50 text-base py-3 px-4 rounded-xl",
                            "placeholder:text-muted-foreground/70 transition-all duration-200",
                            "hover:bg-muted/40 focus:bg-background"
                        )}
                        rows={1}
                    />
                </div>

                {/* Send Button */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="submit"
                                size="icon"
                                className={cn(
                                    "h-11 w-11 rounded-xl transition-all duration-200 shadow-lg",
                                    (message.trim() || attachments.length > 0) 
                                        ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground hover:shadow-xl hover:scale-105" 
                                        : "bg-muted text-muted-foreground hover:bg-muted/80 cursor-not-allowed"
                                )}
                                disabled={isDisabled || (!message.trim() && attachments.length === 0)}
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Send message</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </form>
        </Card>
    );
}
