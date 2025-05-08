import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"

interface ChatHeaderProps {
    user: {
        id: number
        name: string
        avatar?: string
        status?: "online" | "offline" | "away"
    }
    onMenuClick?: () => void
}

export function ChatHeader({ user, onMenuClick }: ChatHeaderProps) {
    return (
        <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="font-semibold">{user.name}</h2>
                    {user.status && (
                        <span className="text-sm text-muted-foreground capitalize">
                            {user.status}
                        </span>
                    )}
                </div>
            </div>
            {onMenuClick && (
                <Button variant="ghost" size="icon" onClick={onMenuClick}>
                    <MoreVertical className="h-5 w-5" />
                </Button>
            )}
        </div>
    )
} 