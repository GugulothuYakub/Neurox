// src/components/history-dropdown.tsx
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Assuming Shadcn UI
import { Button } from "@/components/ui/button";
import { History, PlusCircle, Trash2 } from "lucide-react"; // Or other relevant icons
import type { SessionInfo } from '@/hooks/useChat'; // Import the SessionInfo type

interface HistoryDropdownProps {
  sessions: SessionInfo[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onStartNew: () => void;
  // Add clear history handler if implemented in useChat
   onClearAll?: () => void;
}

export function HistoryDropdown({
  sessions,
  activeSessionId,
  onSelectSession,
  onStartNew,
  onClearAll
}: HistoryDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Chat History">
          <History className="h-5 w-5" />
          <span className="sr-only">Chat History</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
         align="end"
         className="w-64 backdrop-blur-sm bg-background/80 border rounded-xl shadow-lg" // Glossy background
       >
        <DropdownMenuLabel>Chat History</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Button to start a new chat */}
        <DropdownMenuItem
          onSelect={onStartNew} // Use onSelect for keyboard navigation etc.
          className="cursor-pointer flex items-center gap-2"
         >
          <PlusCircle className="h-4 w-4 text-primary" />
          Start New Chat
        </DropdownMenuItem>
         <DropdownMenuSeparator />

        {/* List existing sessions */}
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <DropdownMenuItem
              key={session.id}
              onSelect={() => onSelectSession(session.id)}
              disabled={session.id === activeSessionId} // Disable selecting the already active one
              className={`cursor-pointer text-sm ${session.id === activeSessionId ? 'bg-muted font-semibold' : ''}`}
              title={session.firstPrompt} // Show full prompt on hover
             >
               {/* Truncate text for display */}
               <span className="truncate">{session.firstPrompt}</span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No history found</DropdownMenuItem>
        )}

        {/* Optional: Clear History Button */}
        {onClearAll && sessions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onClearAll}
              className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> Clear All History
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Remember to install lucide-react: npm install lucide-react