// src/components/auth-gate.tsx
"use client";

import React, { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

interface AuthGateProps {
  onAuthenticated: (username: string) => void;
  expectedPassword?: string; // Will come from env variable
  defaultUsername?: string;
}

export function AuthGate({ onAuthenticated, expectedPassword, defaultUsername = "User" }: AuthGateProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
        // Use default name if provided and name input is empty
        const finalName = defaultUsername;
        setName(finalName); // Set it for potential display, though we authenticate next

        if (!finalName) { // Should not happen if defaultUsername is set
            setError("Please enter your name.");
            return;
        }
    }


    if (!expectedPassword) {
        setError("App password not configured. Please contact support.");
        console.error("AuthGate: Expected password is not defined!");
        return;
    }

    setIsLoading(true);

    // Simulate a small delay for UX if needed, or remove for instant check
    setTimeout(() => {
      if (password === expectedPassword) {
        const finalUsername = name.trim() || defaultUsername;
        onAuthenticated(finalUsername);
      } else {
        setError("Incorrect password. Please try again.");
        setPassword(''); // Clear password field on error
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-6 p-8 rounded-xl shadow-2xl bg-card border">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to NeuroX</h1>
          <p className="text-muted-foreground mt-2">
            Please enter your name and the access password to continue.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder={defaultUsername || "E.g., Ada Lovelace"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              This name will be displayed in the chat. If left blank, "{defaultUsername}" will be used.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Access Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter app password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Enter Chat"}
          </Button>
        </form>
         <p className="text-xs text-center text-muted-foreground pt-4">
            The password is provided by the application administrator.
        </p>
      </div>
    </div>
  );
}