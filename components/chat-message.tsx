// src/components/chat-message.tsx

import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, ChevronRightIcon, ChevronDownIcon } from 'lucide-react'; // Make sure icons are imported
import CodeMessage from '@/components/code-message';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: {
    id: string;
    role: string;
    content: string;
    createdAt?: Date | string;
    type?: string;
  };
}

const thinkRegex = /^\s*(<think>[\s\S]*?<\/think>)\s*([\s\S]*)/i;
const codeBlockRegex = /```\s*(\w+)?\s*\r?\n([\s\S]*?)\r?\n?\s*```/g;

export function ChatMessage({ message }: ChatMessageProps) {
  const [isThinkingVisible, setIsThinkingVisible] = useState(false);
  const isUser = message.role === 'user';

  const { thinkingContent, mainContent, hasThinking } = useMemo(() => {
    const match = message.content.match(thinkRegex);
    if (match && !isUser) {
      return {
        thinkingContent: match[1].slice('<think>'.length, -'</think>'.length).trim(),
        mainContent: match[2].trim(),
        hasThinking: true,
      };
    }
    return {
      thinkingContent: null,
      mainContent: message.content.trim(),
      hasThinking: false,
    };
  }, [message.content, isUser]);

  const toggleThinking = () => {
    if (hasThinking) {
      setIsThinkingVisible((prev) => !prev);
    }
  };

  const renderMainContentWithCodeBlocks = (contentToRender: string) => {
    if (!contentToRender) return null;

    const parts = [];
    let lastIndex = 0;
    let matches = [];
    try {
        matches = [...contentToRender.matchAll(codeBlockRegex)];
    } catch (error) {
      console.error("Error running matchAll on main content:", error);
      return <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentToRender}</ReactMarkdown>;
    }

    if (matches.length === 0) {
      return <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{contentToRender}</ReactMarkdown></div>;
    }

    matches.forEach((match, index) => {
      try {
        const startIndex = match.index!;
        const language = match[1] || 'plaintext';
        const code = (match[2] ?? '').trim();
        const fullMatchString = match[0];

        if (startIndex > lastIndex) {
          const textSegment = contentToRender.substring(lastIndex, startIndex).trim();
          if (textSegment) {
            parts.push(
              <div key={`text-${index}`} className="markdown-content my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {textSegment}
                  </ReactMarkdown>
              </div>
            );
          }
        }

        if (code || code === '') {
           parts.push(
              <CodeMessage key={`code-${index}`} code={code} language={language} />
           );
        }
        lastIndex = startIndex + fullMatchString.length;
      } catch(parseError) {
          console.error(`Error parsing match ${index} in main content:`, parseError, match);
      }
    });

     if (lastIndex < contentToRender.length) {
      const remainingText = contentToRender.substring(lastIndex).trim();
       if(remainingText){
          parts.push(
               <div key="text-last" className="markdown-content my-2">
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
                       {remainingText}
                   </ReactMarkdown>
               </div>
          );
       }
    }

    return parts.length > 0 ? <>{parts}</> : null;
  };

  let formattedTimestamp: string | null = null;
  if (message.createdAt) {
    try {
      formattedTimestamp = format(new Date(message.createdAt), 'p');
    } catch (e) {
      console.error("Failed to format timestamp:", message.createdAt, e);
    }
  }

  // const avatarSrc = isUser ? '/Media.png' : '/placeholder.svg';
  const avatarSrc = isUser ? '/Media.png' : '/Neurox.png';

  return (
    <div className={`flex items-start gap-4 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl`}>
        <Avatar className="h-10 w-10 border border-primary/10 shadow-sm bg-primary/5 flex-shrink-0">
          <AvatarImage src={avatarSrc} alt={isUser ? 'User' : 'Bot'} />
          <AvatarFallback>{isUser ? <User className="h-6 w-6" /> : <Bot className="h-6 w-6" />}</AvatarFallback>
        </Avatar>

        <div className={`flex flex-col flex-grow min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
           <div className={`rounded-2xl px-4 py-3 shadow-sm border border-border ${isUser ? 'bg-transparent' : 'bg-card'} text-card-foreground prose prose-sm dark:prose-invert max-w-none`}>
             {/* Thinking Toggle - Restored */}
             {hasThinking && (
                <div className="border-b border-border/50 pb-2 mb-2 last:mb-0 last:border-b-0 not-prose"> {/* Added 'not-prose' to prevent prose styles interfering with button */}
                    {/* --- THIS BUTTON WAS MISSING --- */}
                    <button
                        onClick={toggleThinking}
                        className="flex items-center text-xs text-muted-foreground hover:text-foreground cursor-pointer w-full text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded mb-1"
                        aria-expanded={isThinkingVisible}
                        aria-controls={`thinking-content-${message.id}`}
                    >
                        {isThinkingVisible ? (
                            <ChevronDownIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                        ) : (
                            <ChevronRightIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                        )}
                        <span>AI Thinking Process</span>
                    </button>
                    {/* --- END OF MISSING BUTTON --- */}

                    {/* Conditionally rendered thinking block */}
                    {isThinkingVisible && (
                      <div
                        id={`thinking-content-${message.id}`}
                        className="mt-1 text-xs bg-muted/50 p-2 rounded border whitespace-pre-wrap font-mono overflow-x-auto" // Keeping styling specific here
                      >
                        {thinkingContent}
                      </div>
                    )}
                </div>
             )}
             {/* --- End Thinking Toggle --- */}

             {/* Render Main Content */}
             {renderMainContentWithCodeBlocks(mainContent)}

             {/* Placeholder */}
             {!mainContent && hasThinking && !isThinkingVisible && ( <span className="text-xs italic text-muted-foreground">(Expand thinking process above)</span> )}
           </div>

           {/* Timestamp */}
           {formattedTimestamp && ( <p className="text-xs text-muted-foreground mt-1 px-1" title={new Date(message.createdAt!).toLocaleString()}> {formattedTimestamp} </p> )}
        </div>
      </div>
    </div>
  );
}