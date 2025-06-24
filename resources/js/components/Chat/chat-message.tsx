import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Sender {
    id: number;
    name: string;
    avatar?: string;
}

interface ChatMessageProps {
    message: string;
    sender: Sender;
    timestamp?: string;
    isFromCurrentUser: boolean;
    isSystemMessage?: boolean;
    isSequential?: boolean;
    onDelete?: () => void;
}

export function ChatMessage({
    message,
    sender,
    timestamp,
    isFromCurrentUser,
    isSystemMessage = false,
    isSequential = false,
    onDelete
}: ChatMessageProps) {
    if (isSystemMessage) {
        return (
            <div className="flex justify-center py-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3" />
                    <span>{message}</span>
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            "flex items-start gap-3",
            isFromCurrentUser ? "flex-row-reverse" : "flex-row"
        )}>
            {!isSequential ? (
                <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarImage src={sender?.avatar} alt={sender?.name} />
                    <AvatarFallback>{sender?.name?.slice(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
                </Avatar>
            ) : (
                <div className="w-8" />
            )}
            <div className={cn(
                "flex flex-col gap-1",
                isFromCurrentUser ? "items-end" : "items-start"
            )}>
                {!isSequential && (
                    <span className="text-xs font-medium">
                        {isFromCurrentUser ? 'You' : sender?.name || 'Unknown'}
                    </span>
                )}
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "rounded-lg px-3 py-2 max-w-[320px] break-words",
                        isFromCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted",
                        isSequential && isFromCurrentUser ? "rounded-tr-sm" : "",
                        isSequential && !isFromCurrentUser ? "rounded-tl-sm" : ""
                    )}>
                        {message}
                    </div>
                    {isFromCurrentUser && onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={onDelete}
                        >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                        {timestamp || ''}
                    </span>
                    {isFromCurrentUser && (
                        <CheckCheck className="h-3 w-3 text-muted-foreground" />
                    )}
                </div>
            </div>
        </div>
    )
}
