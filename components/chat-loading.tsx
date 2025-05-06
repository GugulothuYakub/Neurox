import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot } from "lucide-react"

export function ChatLoading() {
  return (
    <div className="flex items-start gap-4 max-w-3xl mr-auto">
      <Avatar className="h-10 w-10 border border-primary/10 shadow-sm bg-primary/5">
        <AvatarFallback>
          <Bot className="h-6 w-6" />
        </AvatarFallback>
      </Avatar>

      <div className="rounded-2xl px-4 py-3 shadow-sm bg-card text-card-foreground border border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}
