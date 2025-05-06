// src/hooks/useChat.ts

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid'; // Need UUID for session IDs

// --- Configuration ---
const CHAT_SESSIONS_KEY = "chatSessions_v1"; // Key for ALL sessions
const MAX_HISTORY_PER_SESSION = 20; // Max messages per individual session
// -------------------

// Define the structure for a chat message (ensure createdAt is Date)
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date; // Use Date object consistently
  type?: "json" | "code" | "text";
}

// Interface for the data stored in localStorage (nested structure)
interface StoredMessage extends Omit<Message, 'createdAt'> {
  createdAt: string; // Dates are stored as strings
}

// Structure for the main storage object
type ChatSessions = Record<string, StoredMessage[]>;

// Structure for session info used by the dropdown
export interface SessionInfo {
  id: string;
  firstPrompt: string;
  lastUpdate: Date; // To sort sessions later if needed
}

// Custom hook for managing chat state and interactions with multiple sessions
export function useChat({ api }: { api: string }) {
  // State for all sessions' messages (loaded from storage)
  const [allSessions, setAllSessions] = useState<Record<string, Message[]>>({});
  // State for the ID of the currently active session
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  // Derived state: Messages for the *currently active* session
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Track if history loaded

  // --- Load all sessions from localStorage on initial mount ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let loadedSessionId: string | null = null;
      try {
        const storedSessions = localStorage.getItem(CHAT_SESSIONS_KEY);
        if (storedSessions) {
          const parsedStoredSessions: ChatSessions = JSON.parse(storedSessions);
          const loadedSessions: Record<string, Message[]> = {};
          let latestSessionId: string | null = null;
          let latestTimestamp = new Date(0);

          // Validate and convert stored data
          for (const sessionId in parsedStoredSessions) {
            if (Object.prototype.hasOwnProperty.call(parsedStoredSessions, sessionId) && Array.isArray(parsedStoredSessions[sessionId])) {
              const validMessages = parsedStoredSessions[sessionId]
                .map((msg): Message | null => {
                  if (typeof msg === 'object' && msg !== null && msg.id && msg.role && msg.content && msg.createdAt) {
                    const createdAtDate = new Date(msg.createdAt);
                     // Track the latest message timestamp to find the most recent session
                     if (createdAtDate > latestTimestamp) {
                         latestTimestamp = createdAtDate;
                         latestSessionId = sessionId;
                     }
                    return {
                      ...msg,
                      createdAt: createdAtDate,
                      role: ["user", "assistant", "system"].includes(msg.role) ? msg.role as Message['role'] : "system"
                    };
                  }
                  return null;
                })
                .filter((msg): msg is Message => msg !== null);
              loadedSessions[sessionId] = validMessages;
            }
          }
          setAllSessions(loadedSessions);
          // Activate the most recently updated session, or null if none found
          loadedSessionId = latestSessionId;
        }
      } catch (error) {
        console.error("Failed to load or parse chat sessions:", error);
        localStorage.removeItem(CHAT_SESSIONS_KEY); // Attempt cleanup
      } finally {
          setActiveSessionId(loadedSessionId); // Activate loaded or null
          setIsInitialized(true); // Mark initialization complete
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

   // --- Update currentMessages whenever activeSessionId or allSessions change ---
   useEffect(() => {
      if (activeSessionId && allSessions[activeSessionId]) {
         setCurrentMessages(allSessions[activeSessionId]);
      } else {
         setCurrentMessages([]); // Clear messages if no active session or session doesn't exist
      }
   }, [activeSessionId, allSessions]);


  // --- Save all sessions to localStorage whenever allSessions changes ---
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        const storableSessions: ChatSessions = {};
        for (const sessionId in allSessions) {
           if (Object.prototype.hasOwnProperty.call(allSessions, sessionId)) {
              // Trim and convert messages for storage
               storableSessions[sessionId] = allSessions[sessionId]
                 .slice(-MAX_HISTORY_PER_SESSION) // Trim history PER session
                 .map(msg => ({
                    ...msg,
                    createdAt: msg.createdAt.toISOString(),
                 }));
           }
        }
        localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(storableSessions));
      } catch (error) {
        console.error("Failed to save chat sessions:", error);
      }
    }
  }, [allSessions, isInitialized]);

   // --- Helper Function to update a specific session ---
   const updateSessionMessages = (sessionId: string, newMessages: Message[]) => {
       setAllSessions(prevSessions => ({
           ...prevSessions,
           [sessionId]: newMessages,
       }));
   };


  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // --- Modified handleSubmit to work with active session ---
  const handleSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setIsLoading(true);
    setInput(""); // Clear input early

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedInput,
      createdAt: new Date(),
      type: "text",
    };

    let currentSessionId = activeSessionId;
    let sessionMessages: Message[] = [];

    // If no active session, start a new one
    if (!currentSessionId || !allSessions[currentSessionId]) {
      currentSessionId = uuidv4(); // Generate a new session ID
      sessionMessages = [userMessage];
      setActiveSessionId(currentSessionId); // Activate the new session
      updateSessionMessages(currentSessionId, sessionMessages); // Add to state immediately
      console.log("Starting new session:", currentSessionId);
    } else {
       // Add to existing active session
       sessionMessages = [...allSessions[currentSessionId], userMessage];
       updateSessionMessages(currentSessionId, sessionMessages);
    }


    // Prepare payload using the up-to-date list for the *current* session
    const messagesForApi = sessionMessages.map(({ role, content }) => ({ role, content }));

    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesForApi }),
      });

      const botMessageReceivedAt = new Date();

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      const botTextContent = await response.text();
      if (!botTextContent && botTextContent !== "") {
         throw new Error("Received empty or invalid response content from the API.");
      }

      const botMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: botTextContent,
        createdAt: botMessageReceivedAt,
        type: "text",
      };
      if (isJson(botMessage.content)) botMessage.type = "json";
      else if (isCode(botMessage.content)) botMessage.type = "code";

      // Add bot message to the *current* session's messages
      const finalSessionMessages = [...sessionMessages, botMessage];
      updateSessionMessages(currentSessionId, finalSessionMessages);

    } catch (error) {
        console.error("Error during chat submission or processing:", error);
        const errorMessage: Message = {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Sorry, I encountered an error. Please try again. ${error instanceof Error ? `(${error.message})` : ''}`,
            createdAt: new Date()
        };
        // Add error message to the *current* session's messages
        const finalSessionMessages = [...sessionMessages, errorMessage];
        updateSessionMessages(currentSessionId, finalSessionMessages);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isLoading, api, activeSessionId, allSessions]); // Include dependencies


  // --- Function to switch the active session ---
  const switchSession = useCallback((sessionId: string | null) => {
      if (sessionId === null || allSessions[sessionId]) {
           setActiveSessionId(sessionId);
           setInput(""); // Clear input when switching
      } else {
           console.warn(`Session ID "${sessionId}" not found.`);
      }
  }, [allSessions]);

  // --- Function to start a completely new chat ---
  const startNewSession = useCallback(() => {
      setActiveSessionId(null); // Deactivate current
      setCurrentMessages([]); // Clear displayed messages immediately
      setInput(""); // Clear input
      // A new session ID will be generated on the *next* submit
  }, []);

  // --- Function to get session list for dropdown ---
   const getSessionList = useCallback((): SessionInfo[] => {
       return Object.entries(allSessions)
         .map(([id, messages]) => {
            const firstUserMessage = messages.find(m => m.role === 'user');
            const lastMessage = messages[messages.length - 1];
            return {
               id,
               // Use first user message content, truncated, or a default placeholder
               firstPrompt: firstUserMessage ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') : 'Chat Session',
               lastUpdate: lastMessage ? lastMessage.createdAt : new Date(0), // Use last message date for sorting
            };
         })
         // Sort by most recently updated
         .sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());
   }, [allSessions]);


  // --- Function to clear all history ---
  const clearAllChatHistory = useCallback(() => {
     setAllSessions({});
     setActiveSessionId(null);
     setCurrentMessages([]);
     setInput("");
     localStorage.removeItem(CHAT_SESSIONS_KEY);
  }, []);


  return {
    messages: currentMessages, // Return messages of the ACTIVE session
    input,
    isLoading: isLoading || !isInitialized, // Still loading if not initialized
    activeSessionId,
    sessions: getSessionList(), // Provide the list of session infos
    handleInputChange,
    handleSubmit,
    switchSession,
    startNewSession,
    clearAllChatHistory, // Optional
  };
}

// Utility functions (isJson, isCode) remain the same
function isJson(str: string): boolean {
    if (typeof str !== 'string') return false;
    const trimmed = str.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
         try { JSON.parse(trimmed); return true; } catch { return false; }
    }
    return false;
}

function isCode(str: string): boolean {
  if (typeof str !== 'string') return false;
  if (str.includes('```')) return true;
  const codeIndicators = [ "import ", "export ", "require(", "def ", "class ", "function ", "const ", "let ", "var ", "public ", "private ", "static ", "void ", "SELECT ", "INSERT ", "UPDATE ", "<[a-zA-Z]", "=>", "&&", "||",];
  let indicatorCount = 0;
  const strongIndicatorFound = /^\s*(class|def|function)\s+/.test(str);
  if (strongIndicatorFound) return true;
  for (const indicator of codeIndicators) { const regex = new RegExp(indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); if (regex.test(str)) { indicatorCount++; } }
  return indicatorCount >= 2;
}