import type { Message } from "ai"
import { ChatMessage } from "@/components/chat-message"
import { ChatLoading } from "@/components/chat-loading"
import { useEffect } from "react";

interface ChatContainerProps {
  messages: Message[]
  isLoading: boolean
}

export function ChatContainer({ messages, isLoading }: ChatContainerProps) {
  useEffect(() => {
    console.log("Messages received:", messages);
  }, [messages]);

  return (
    <div className="flex flex-col gap-6">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-primary"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Ask Junior</h2>
          <p className="text-muted-foreground max-w-md">
            Ask me anything and I'll do my best to help you. I can answer questions, provide information, or just chat.
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))
      )}
      {isLoading && <ChatLoading />}
    </div>
  );
}