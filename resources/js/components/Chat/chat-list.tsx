import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Chat {
    id: number
    name: string
    avatar?: string
    lastMessage?: {
        content: string
        timestamp: string
    }
    unreadCount?: number
}

interface ChatListProps {
    chats: Chat[]
    selectedChatId?: number
    onChatSelect: (chatId: number) => void
}

export function ChatList({ chats, selectedChatId, onChatSelect }: ChatListProps) {
    return (
        <div className="flex flex-col divide-y">
            {chats.map((chat) => (
                <button
                    key={chat.id}
                    onClick={() => onChatSelect(chat.id)}
                    className={cn(
                        "flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors",
                        selectedChatId === chat.id && "bg-muted"
                    )}
                >
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={chat.avatar} alt={chat.name} />
                        <AvatarFallback>{chat.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold truncate">{chat.name}</h3>
                            {chat.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                    {chat.lastMessage.timestamp}
                                </span>
                            )}
                        </div>
                        {chat.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                                {chat.lastMessage.content}
                            </p>
                        )}
                    </div>
                    {chat.unreadCount && chat.unreadCount > 0 && (
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs">
                            {chat.unreadCount}
                        </div>
                    )}
                </button>
            ))}
        </div>
    )
} 