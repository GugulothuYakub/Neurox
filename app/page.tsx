// app/page.tsx
"use client";

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { useChat, SessionInfo, Message } from "@/hooks/useChat"; // Message is exported
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfile } from "@/components/user-profile";
import { ChatContainer } from "@/components/chat-container";
import { ChatInput } from "@/components/chat-input";
import { HistoryDropdown } from "@/components/history-dropdown";
import { AuthGate } from "@/components/auth-gate";
import { Loader2 } from "lucide-react";

const AUTH_KEY = "app_authenticated_user_v1";
const USERNAME_KEY = "app_username_v1";

const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function ChatbotPage() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(
    typeof window !== 'undefined'
      ? localStorage.getItem(USERNAME_KEY) || process.env.NEXT_PUBLIC_DEFAULT_USERNAME || "Guest"
      : process.env.NEXT_PUBLIC_DEFAULT_USERNAME || "Guest"
  );
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const appPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;
  // const defaultUsernameFromEnv = process.env.NEXT_PUBLIC_DEFAULT_USERNAME || "User";
  const defaultUsernameFromEnv = process.env.NEXT_PUBLIC_DEFAULT_USERNAME || "Yakub";

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem(AUTH_KEY);
      const storedUsername = localStorage.getItem(USERNAME_KEY);

      if (authStatus === "true" && storedUsername) {
        setIsAuthenticated(true);
        setCurrentUsername(storedUsername);
      } else if (!appPassword) {
        setIsAuthenticated(true);
        setCurrentUsername(storedUsername || defaultUsernameFromEnv);
        localStorage.setItem(AUTH_KEY, "true");
        localStorage.setItem(USERNAME_KEY, storedUsername || defaultUsernameFromEnv);
      }
    }
  }, [appPassword, defaultUsernameFromEnv]);

  const {
    messages, // This is currentMessages from the hook
    input,
    isLoading: isChatLoading,
    activeSessionId,
    sessions,
    handleInputChange,
    handleSubmit: hookHandleSubmit, // Renamed to avoid conflict
    switchSession,
    startNewSession,
    clearAllChatHistory,
    setInput, // <-- Destructure setInput from the hook
  } = useChat({
    api: "/api/chat",
  });

  useEffect(() => {
    if (chatContainerRef.current) {
      // Delay scroll slightly to allow new message to render and affect scrollHeight
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isChatLoading]); // isChatLoading helps if a placeholder is added

  const handleAuthenticationSuccess = (username: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_KEY, "true");
        localStorage.setItem(USERNAME_KEY, username);
    }
    setCurrentUsername(username);
    setIsAuthenticated(true);
  };

  const handleFormSubmitWithFile = async (
    event: FormEvent<HTMLFormElement>,
    fileToSubmit: File | null
  ) => {
    // event.preventDefault(); // The hook's handleSubmit now does this

    let fileDataPayload: Message['data'] | undefined = undefined;

    if (fileToSubmit) {
      try {
        const dataUrl = await fileToDataURL(fileToSubmit);
        fileDataPayload = {
          fileDataUrl: dataUrl,
          fileName: fileToSubmit.name,
          fileType: fileToSubmit.type,
        };
      } catch (err) {
        console.error("Error converting file to Data URL:", err);
        // Optionally, display an error to the user (e.g., using a toast notification)
        return; 
      }
    }

    // Call the hook's handleSubmit with the event and the data payload
    await hookHandleSubmit(event, { data: fileDataPayload });

    // setInput(''); // The hook's handleSubmit now clears its own input state
    setSelectedFile(null); // Clear the locally selected file
  };

  if (!mounted) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            Loading Neurox...
        </div>
     );
  }

  if (appPassword && !isAuthenticated) {
    return (
      <AuthGate
        onAuthenticated={handleAuthenticationSuccess}
        expectedPassword={appPassword}
        defaultUsername={defaultUsernameFromEnv}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background transition-colors duration-300">
      <header className="border-b backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Neurox
          </h1>
          <div className="flex items-center gap-2">
            <HistoryDropdown
               sessions={sessions} // Already SessionInfo[] from getSessionList
               activeSessionId={activeSessionId}
               onSelectSession={switchSession}
               onStartNew={startNewSession}
               onClearAll={clearAllChatHistory} // Optional
             />
            <ThemeToggle />
            <UserProfile username={currentUsername} avatarUrl="/Media.jpg?height=40&width=40" />
            {/* <UserProfile username={currentUsername} avatarUrl="/Media.jpg" /> */}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
           <div ref={chatContainerRef} className="h-full overflow-y-auto p-4 pb-24 md:pb-28">
             <ChatContainer
                 // Ensure roles are correctly typed if Message interface in ChatContainer expects stricter roles
                 messages={messages.map(m => ({ ...m, role: m.role as "user" | "assistant" | "system" }))}
                //  isLoading={isChatLoading && messages.length === 0} // Initial loading
                 isLoading={isChatLoading} 
             />
           </div>
          <div
             className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none"
          >
              <div className="max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto pointer-events-auto">
                   <ChatInput
                       input={input}
                       handleInputChange={handleInputChange}
                       handleSubmit={handleFormSubmitWithFile} // Pass our wrapped handler
                       isLoading={(!isAuthenticated && !!appPassword) || isChatLoading}
                       selectedFile={selectedFile}
                       setSelectedFile={setSelectedFile}
                       key={activeSessionId || 'input-new'}
                   />
              </div>
          </div>
      </main>
    </div>
  );
}