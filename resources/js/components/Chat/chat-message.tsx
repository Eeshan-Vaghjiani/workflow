import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

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
    }
    isCurrentUser: boolean
}

export function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
    return (
        <div className={cn(
            "flex items-start gap-3",
            isCurrentUser ? "flex-row-reverse" : "flex-row"
        )}>
            <Avatar className="h-8 w-8">
                <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                <AvatarFallback>{message.sender.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={cn(
                "flex flex-col gap-1",
                isCurrentUser ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                    {message.content}
                </div>
                <span className="text-xs text-muted-foreground">
                    {message.timestamp}
                </span>
            </div>
        </div>
    )
} 