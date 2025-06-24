import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Send, Smile, Mic } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface ChatInputProps {
    onSendMessage: (message: string) => void
    disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
    const [message, setMessage] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        // Focus the input when the component mounts
        inputRef.current?.focus()
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (message.trim()) {
            onSendMessage(message)
            setMessage("")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t bg-background/95">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
                <Paperclip className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
                <Input
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={disabled}
                    onKeyDown={handleKeyDown}
                    className="pr-10"
                />
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                    <Smile className="h-5 w-5" />
                </Button>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
                <Mic className="h-5 w-5" />
            </Button>
            <Button
                type="submit"
                size="icon"
                disabled={disabled || !message.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
            >
                <Send className="h-4 w-4" />
            </Button>
        </form>
    )
}
