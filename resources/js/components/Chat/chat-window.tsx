import { ChatHeader } from "@/components/Chat/chat-header"
import { ChatInput } from "@/components/Chat/chat-input"
import { ChatMessage } from "@/components/Chat/chat-message"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useRef } from "react"

interface Message {
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
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Group messages by date
    const groupedMessages = messages.reduce<{ date: string; messages: Message[] }[]>((groups, message) => {
        // Extract date from timestamp - this assumes timestamp is from Date.toLocaleTimeString()
        const date = new Date().toDateString() // Default to today
        
        // Find existing group or create new one
        const group = groups.find(g => g.date === date)
        if (group) {
            group.messages.push(message)
        } else {
            groups.push({ date, messages: [message] })
        }
        return groups
    }, [])

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
            <ScrollArea className="flex-1 p-4 overflow-auto">
                <div className="space-y-6">
                    {groupedMessages.map((group, groupIndex) => (
                        <div key={groupIndex} className="space-y-4">
                            <div className="flex justify-center">
                                <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-full">
                                    {group.date}
                                </span>
                            </div>
                            
                            {group.messages.map((message, messageIndex) => {
                                // Check if this message is part of a sequence from same sender
                                const prevMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null
                                const isSequential = prevMessage && prevMessage.sender.id === message.sender.id
                                
                                return (
                                    <ChatMessage
                                        key={message.id}
                                        message={message}
                                        isCurrentUser={message.sender.id === currentUserId}
                                        isSequential={isSequential}
                                    />
                                )
                            })}
                        </div>
                    ))}
                    
                    {messages.length === 0 && (
                        <div className="flex items-center justify-center h-40 text-muted-foreground">
                            No messages yet. Start the conversation!
                        </div>
                    )}
                    
                    {isLoading && (
                        <div className="flex justify-center py-4">
                            <div className="animate-pulse flex space-x-2">
                                <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                                <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                                <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
    )
} 