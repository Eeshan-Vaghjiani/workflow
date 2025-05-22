import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Info, MoreVertical, Phone, Users, Video } from "lucide-react"

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
        <div className="flex items-center justify-between p-3 border-b bg-background/95 sticky top-0 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {user.status && (
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                            user.status === "online" ? "bg-green-500" : 
                            user.status === "away" ? "bg-yellow-500" : "bg-gray-400"
                        }`} />
                    )}
                </div>
                <div>
                    <h2 className="font-semibold">{user.name}</h2>
                    <div className="flex items-center gap-1.5">
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                            user.status === "online" ? "bg-green-500" : 
                            user.status === "away" ? "bg-yellow-500" : "bg-gray-400"
                        }`} />
                        <span className="text-xs text-muted-foreground capitalize">
                            {user.status || "offline"}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Users className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={onMenuClick}>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
} 