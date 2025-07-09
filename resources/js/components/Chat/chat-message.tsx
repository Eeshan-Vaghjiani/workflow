import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
    MoreHorizontal, 
    Reply, 
    Edit, 
    Trash2, 
    Download,
    Eye,
    FileIcon,
    ImageIcon,
    VideoIcon,
    MusicIcon,
    FileTextIcon
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Attachment {
    id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
}

interface MessageUser {
    id: number;
    name: string;
    avatar?: string;
}

interface MessageProps {
    id: number | string;
    content: string;
    user: MessageUser;
    timestamp: string;
    date?: string;
    isFromMe: boolean;
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    attachments?: Attachment[];
    isReply?: boolean;
    replyTo?: {
        id: number | string;
        content: string;
        user: MessageUser;
    };
    onReply?: (messageId: number | string) => void;
    onEdit?: (messageId: number | string) => void;
    onDelete?: (messageId: number | string) => void;
    onReaction?: (messageId: number | string, emoji: string) => void;
}

const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: { 
        opacity: 0, 
        y: -10, 
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};

export function ChatMessage({
    id,
    content,
    user,
    timestamp,
    date,
    isFromMe,
    status = 'delivered',
    attachments = [],
    isReply = false,
    replyTo,
    onReply,
    onEdit,
    onDelete,
    onReaction,
}: MessageProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
        if (fileType.startsWith('video/')) return <VideoIcon className="h-4 w-4" />;
        if (fileType.startsWith('audio/')) return <MusicIcon className="h-4 w-4" />;
        if (fileType.includes('pdf') || fileType.includes('document')) return <FileTextIcon className="h-4 w-4" />;
        return <FileIcon className="h-4 w-4" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownload = (attachment: Attachment) => {
        const link = document.createElement('a');
        link.href = attachment.file_url;
        link.download = attachment.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = () => {
        switch (status) {
            case 'sending': return 'text-yellow-500';
            case 'sent': return 'text-blue-500';
            case 'delivered': return 'text-green-500';
            case 'read': return 'text-green-600';
            case 'failed': return 'text-red-500';
            default: return 'text-muted-foreground';
        }
    };

    const renderAttachment = (attachment: Attachment) => {
        const isImage = attachment.file_type.startsWith('image/');
        const isVideo = attachment.file_type.startsWith('video/');

        if (isImage) {
            return (
                <Card 
                    key={attachment.id} 
                    className="overflow-hidden bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => setImagePreview(attachment.file_url)}
                >
                    <div className="relative">
                        <img
                            src={attachment.file_url}
                            alt={attachment.file_name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                    </div>
                    <div className="p-2">
                        <p className="text-xs text-muted-foreground truncate">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
                    </div>
                </Card>
            );
        }

        if (isVideo) {
            return (
                <Card key={attachment.id} className="overflow-hidden bg-muted/30">
                    <div className="relative">
                        <video
                            src={attachment.file_url}
                            className="w-full h-48 object-cover"
                            controls
                            preload="metadata"
                        />
                    </div>
                    <div className="p-2">
                        <p className="text-xs text-muted-foreground truncate">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
                    </div>
                </Card>
            );
        }

        // File attachment
        return (
            <Card 
                key={attachment.id} 
                className="p-3 bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
                onClick={() => handleDownload(attachment)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        {getFileIcon(attachment.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(attachment);
                        }}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </Card>
        );
    };

    return (
        <>
            <motion.div
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                    "flex gap-3 group px-4 py-2 hover:bg-muted/30 transition-colors duration-200",
                    isFromMe && "flex-row-reverse"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Avatar */}
                <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                {/* Message Content */}
                <div className={cn("flex-1 max-w-[70%] space-y-1", isFromMe && "items-end")}>
                    {/* User name and timestamp */}
                    <div className={cn("flex items-center gap-2", isFromMe && "flex-row-reverse")}>
                        <span className="text-sm font-semibold text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{timestamp}</span>
                        {isFromMe && (
                            <Badge variant="outline" className={cn("text-xs px-1 py-0", getStatusColor())}>
                                {status}
                            </Badge>
                        )}
                    </div>

                    {/* Reply indicator */}
                    {isReply && replyTo && (
                        <Card className="p-2 bg-muted/50 border-l-4 border-primary mb-2">
                            <div className="text-xs text-primary font-medium">{replyTo.user.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {replyTo.content}
                            </div>
                        </Card>
                    )}

                    {/* Message text */}
                    {content && (
                        <Card className={cn(
                            "p-3 max-w-fit transition-all duration-200",
                            isFromMe 
                                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-auto" 
                                : "bg-muted/50 hover:bg-muted/70"
                        )}>
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {content}
                            </p>
                        </Card>
                    )}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-w-md">
                            {attachments.map(renderAttachment)}
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                {(isHovered || false) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                            "flex items-center gap-1",
                            isFromMe ? "flex-row-reverse" : ""
                        )}
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted/50"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isFromMe ? "end" : "start"}>
                                {onReply && (
                                    <DropdownMenuItem onClick={() => onReply(id)}>
                                        <Reply className="h-4 w-4 mr-2" />
                                        Reply
                                    </DropdownMenuItem>
                                )}
                                {isFromMe && onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(id)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {(isFromMe || !isFromMe) && onDelete && (
                                    <DropdownMenuItem 
                                        onClick={() => onDelete(id)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </motion.div>
                )}
            </motion.div>

            {/* Image Preview Modal */}
            {imagePreview && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setImagePreview(null)}
                >
                    <motion.img
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </motion.div>
            )}
        </>
    );
}
