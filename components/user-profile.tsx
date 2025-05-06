import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserProfileProps {
  username: string
  avatarUrl: string
  className?: string
}

export function UserProfile({ username, avatarUrl, className }: UserProfileProps) {
  const initials = username
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium hidden sm:inline-block">{username}</span>
      <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm">
        <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={username} />
        <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
      </Avatar>
    </div>
  )
}
