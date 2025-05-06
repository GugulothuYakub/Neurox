// src/components/chat-input.tsx

"use client";

import type React from "react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PaperclipIcon, SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  // You might add other props like handling file uploads if needed
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading, // This prop is key
}: ChatInputProps) {
  const [fileAttached, setFileAttached] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileAttached((e.target.files?.length ?? 0) > 0);
    // NOTE: Actual file handling/uploading logic would go here or be triggered from here
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // If isLoading is true (e.g., due to not being authenticated), this submit might still be triggered
    // by an Enter press, but the actual handleSubmit from useChat should ideally have its own isLoading check.
    // However, the button itself will be disabled, and the form.requestSubmit() on Enter also checks.
    if (!input.trim() || isLoading) return; // Added isLoading check here for good measure

    handleSubmit(e);
    setFileAttached(false);
  };

  return (
    <form onSubmit={onSubmit} className="relative backdrop-blur-sm bg-background/80 border rounded-2xl shadow-lg">
      <div className="flex items-end p-2">
        <div className="relative flex-1">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder={isLoading ? "Authenticating or loading..." : "Type your message..."} // Optional: Change placeholder
            className="min-h-[10px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl pr-20 bg-transparent"
            disabled={isLoading} // This correctly disables the textarea
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                // The form's submit button will be disabled if isLoading is true,
                // so form.requestSubmit() won't proceed if handled correctly by the browser/React
                // based on the button's disabled state.
                // Adding an explicit check here too is good.
                if (input.trim() && !isLoading) {
                  const form = e.currentTarget.form;
                  if (form) {
                    // Attempt to submit the form. If the submit button is disabled due to isLoading,
                    // this should ideally not proceed, or handleSubmit should have its own internal isLoading guard.
                    form.requestSubmit();
                  }
                }
              }
            }}
          />

          <div className="absolute right-2 bottom-2 flex items-end gap-2">
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isLoading} // This correctly disables the file input
              />
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-colors",
                  fileAttached
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80",
                  isLoading ? "cursor-not-allowed opacity-50" : "" // This correctly styles the label
                )}
                title="Attach file"
              >
                <PaperclipIcon className="h-5 w-5" />
                <span className="sr-only">Attach file</span>
              </label>
            </div>

            <Button
              type="submit"
              size="icon"
              className="rounded-full h-9 w-9 bg-primary text-primary-foreground"
              // This correctly disables the button if isLoading is true OR if input is empty
              disabled={isLoading || !input.trim()}
              title="Send message"
            >
              <SendIcon className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}