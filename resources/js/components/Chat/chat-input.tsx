import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { useState } from "react"

interface ChatInputProps {
    onSendMessage: (message: string) => void
    disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
    const [message, setMessage] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (message.trim()) {
            onSendMessage(message)
            setMessage("")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
            <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={disabled}
                className="flex-1"
            />
            <Button type="submit" size="icon" disabled={disabled || !message.trim()}>
                <Send className="h-4 w-4" />
            </Button>
        </form>
    )
} 