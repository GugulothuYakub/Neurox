// src/components/chat-input.tsx

"use client";

import type React from "react";
import { type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PaperclipIcon, SendIcon, XIcon } from "lucide-react"; // Added XIcon
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  // Modified handleSubmit to accept the original event and an optional file
  handleSubmit: (e: FormEvent<HTMLFormElement>, file?: File | null) => void;
  isLoading: boolean;
  selectedFile: File | null; // New prop to hold the selected file
  setSelectedFile: (file: File | null) => void; // New prop to update the selected file
  // You might add other props like handling file uploads if needed
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  selectedFile,
  setSelectedFile,
}: ChatInputProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    // Reset the input value to allow selecting the same file again if removed and re-added
    e.target.value = '';
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Allow submission if there's input OR a file, and not loading
    if ((!input.trim() && !selectedFile) || isLoading) return;

    handleSubmit(e, selectedFile);
    // Clearing the file (setSelectedFile(null)) and input should happen
    // in the parent component after successful submission logic within its handleSubmit wrapper.
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <form onSubmit={onSubmit} className="relative backdrop-blur-sm bg-background/80 border rounded-2xl shadow-lg">
      {/* Display selected file name and a clear button */}
      {selectedFile && (
        <div className="px-4 pt-3 pb-1 text-sm text-muted-foreground flex justify-between items-center border-b border-border/50">
          <div className="flex items-center gap-2 overflow-hidden">
            {selectedFile.type.startsWith("image/") && (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="h-8 w-8 object-cover rounded"
                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)} // Clean up object URL
              />
            )}
            <span className="truncate" title={selectedFile.name}>
              {selectedFile.name} ({ (selectedFile.size / 1024).toFixed(2) } KB)
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearFile}
            disabled={isLoading}
            className="h-6 w-6 p-0 shrink-0"
            title="Remove file"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex items-end p-2">
        <div className="relative flex-1">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder={
              isLoading
                ? "Processing..."
                : selectedFile
                ? "Add an optional message for your image..."
                : "Type your message..."
            }
            className="min-h-[10px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl pr-20 bg-transparent"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if ((input.trim() || selectedFile) && !isLoading) {
                  const form = e.currentTarget.form;
                  if (form) {
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
                disabled={isLoading}
                accept="image/*" // Accept only images for this example
              />
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-colors",
                  selectedFile
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80",
                  isLoading ? "cursor-not-allowed opacity-50" : ""
                )}
                title="Attach image"
              >
                <PaperclipIcon className="h-5 w-5" />
                <span className="sr-only">Attach image</span>
              </label>
            </div>

            <Button
              type="submit"
              size="icon"
              className="rounded-full h-9 w-9 bg-primary text-primary-foreground"
              disabled={isLoading || (!input.trim() && !selectedFile)}
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