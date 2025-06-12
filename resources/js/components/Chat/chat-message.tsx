import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCheck } from "lucide-react"

interface ChatMessageProps {
    message: {
        id: number
        content: string
        sender: {
            id: number
            name: string
            avatar?: string
        }
        timestamp: string
        isSystemMessage?: boolean
    }
    isCurrentUser: boolean
    isSequential?: boolean
}

export function ChatMessage({ message, isCurrentUser, isSequential = false }: ChatMessageProps) {
    if (message.isSystemMessage) {
        return (
            <div className="flex justify-center py-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3" />
                    <span>{message.content}</span>
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            "flex items-start gap-3",
            isCurrentUser ? "flex-row-reverse" : "flex-row"
        )}>
            {!isSequential ? (
                <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                    <AvatarFallback>{message.sender.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
            ) : (
                <div className="w-8" />
            )}
            <div className={cn(
                "flex flex-col gap-1",
                isCurrentUser ? "items-end" : "items-start"
            )}>
                {!isSequential && (
                    <span className="text-xs font-medium">
                        {isCurrentUser ? 'You' : message.sender.name}
                    </span>
                )}
                <div className={cn(
                    "rounded-lg px-3 py-2 max-w-[320px] break-words",
                    isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted",
                    isSequential && isCurrentUser ? "rounded-tr-sm" : "",
                    isSequential && !isCurrentUser ? "rounded-tl-sm" : ""
                )}>
                    {message.content}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                        {message.timestamp}
                    </span>
                    {isCurrentUser && (
                        <CheckCheck className="h-3 w-3 text-muted-foreground" />
                    )}
                </div>
            </div>
        </div>
    )
}
