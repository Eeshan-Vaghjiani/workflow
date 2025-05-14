import { ChatHeader } from "@/components/Chat/chat-header"
import { ChatInput } from "@/components/Chat/chat-input"
import { ChatMessage } from "@/components/Chat/chat-message"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"

interface Message {
    id: number
    content: string
    sender: {
        id: number
        name: string
        avatar?: string
    }
    timestamp: string
}

interface ChatWindowProps {
    user: {
        id: number
        name: string
        avatar?: string
        status?: "online" | "offline" | "away"
    }
    messages: Message[]
    currentUserId: number
    onSendMessage: (message: string) => void
    isLoading?: boolean
}

export function ChatWindow({
    user,
    messages,
    currentUserId,
    onSendMessage,
    isLoading
}: ChatWindowProps) {
    const { toast } = useToast()

    const handleSendMessage = (content: string) => {
        try {
            onSendMessage(content)
        } catch {
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="flex flex-col h-full">
            <ChatHeader user={user} />
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            isCurrentUser={message.sender.id === currentUserId}
                        />
                    ))}
                </div>
            </ScrollArea>
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
    )
} 