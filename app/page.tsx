// pages/ChatbotPage.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useChat, SessionInfo } from "@/hooks/useChat"; // Assuming SessionInfo is exported from useChat
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfile } from "@/components/user-profile";
import { ChatContainer } from "@/components/chat-container";
import { ChatInput } from "@/components/chat-input";
import { HistoryDropdown } from "@/components/history-dropdown";
import { AuthGate } from "@/components/auth-gate";
import { Loader2 } from "lucide-react"; // For a loading spinner

const AUTH_KEY = "app_authenticated_user_v1";
const USERNAME_KEY = "app_username_v1";

export default function ChatbotPage() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(
    typeof window !== 'undefined'
      ? localStorage.getItem(USERNAME_KEY) || process.env.NEXT_PUBLIC_DEFAULT_USERNAME || "Guest"
      : process.env.NEXT_PUBLIC_DEFAULT_USERNAME || "Guest"
  );
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const appPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;
  const defaultUsernameFromEnv = process.env.NEXT_PUBLIC_DEFAULT_USERNAME || "User";

  // Effect to check authentication status on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem(AUTH_KEY);
      const storedUsername = localStorage.getItem(USERNAME_KEY);

      if (authStatus === "true" && storedUsername) {
        setIsAuthenticated(true);
        setCurrentUsername(storedUsername);
      } else if (!appPassword) {
        // If no app password is set, consider the user "authenticated" by default as guest
        console.warn("NEXT_PUBLIC_APP_PASSWORD is not set. Bypassing authentication gate.");
        setIsAuthenticated(true);
        // Use default or existing localStorage username if any
        setCurrentUsername(storedUsername || defaultUsernameFromEnv);
        // Optionally, set localStorage items as if authenticated
        localStorage.setItem(AUTH_KEY, "true");
        localStorage.setItem(USERNAME_KEY, storedUsername || defaultUsernameFromEnv);
      }
    }
  }, [appPassword, defaultUsernameFromEnv]); // Rerun if appPassword changes (e.g. during dev)

  // useChat hook initialization
  const {
    messages,
    input,
    isLoading: isChatLoading, // Renamed to avoid conflict with component-level isLoading
    activeSessionId,
    sessions,
    handleInputChange,
    handleSubmit,
    switchSession,
    startNewSession,
    // clearAllChatHistory, // If you added this function to useChat
  } = useChat({
    api: "/api/chat", // Assuming no basePath now
  });

  // Effect to scroll chat container
  useEffect(() => {
    if (chatContainerRef.current) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
             chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isChatLoading]);

  // Callback for successful authentication
  const handleAuthenticationSuccess = (username: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_KEY, "true");
        localStorage.setItem(USERNAME_KEY, username);
    }
    setCurrentUsername(username);
    setIsAuthenticated(true);
  };

  // Loading state before component is mounted
  if (!mounted) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            Loading Junior...
        </div>
     );
  }

  // If password is required and user is not authenticated, show AuthGate
  if (appPassword && !isAuthenticated) {
    return (
      <AuthGate
        onAuthenticated={handleAuthenticationSuccess}
        expectedPassword={appPassword}
        defaultUsername={defaultUsernameFromEnv}
      />
    );
  }

  // Main chat UI
  return (
    <div className="flex flex-col h-screen bg-background transition-colors duration-300">
      <header className="border-b backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Junior
          </h1>
          <div className="flex items-center gap-2">
            <HistoryDropdown
               sessions={sessions as SessionInfo[]} // Cast if necessary, ensure SessionInfo is exported
               activeSessionId={activeSessionId}
               onSelectSession={switchSession}
               onStartNew={startNewSession}
               // onClearAll={clearAllChatHistory} // Optional
             />
            <ThemeToggle />
            <UserProfile username={currentUsername} avatarUrl="/profile.jpg?height=40&width=40" /> {/* Update with your avatar logic */}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
           <div ref={chatContainerRef} className="h-full overflow-y-auto p-4 pb-24 md:pb-28">
             <ChatContainer
                 messages={messages.map(m => ({ ...m, role: m.role as "user" | "system" | "assistant" }))}
                 isLoading={isChatLoading} // Pass the loading state from useChat
             />
           </div>
          <div
             className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none"
          >
              <div className="max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto pointer-events-auto">
                   <ChatInput
                       input={input}
                       handleInputChange={handleInputChange}
                       handleSubmit={handleSubmit}
                       // Disable input if not authenticated (and password is set) OR if chat is loading a response
                       isLoading={(!isAuthenticated && !!appPassword) || isChatLoading}
                       key={activeSessionId || 'input-new'} // Re-key to reset on session switch if desired
                   />
              </div>
          </div>
      </main>
    </div>
  );
}