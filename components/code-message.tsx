// src/components/code-message.tsx
import React from 'react';
import { FaCopy } from 'react-icons/fa'; // Removed FaSave if not used
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useTheme } from 'next-themes';

interface CodeMessageProps {
  code: string;
  language?: string;
}

const CodeMessage: React.FC<CodeMessageProps> = ({ code, language = 'plaintext' }) => {
  const [copied, setCopied] = React.useState(false);
  const { resolvedTheme } = useTheme();

  // Removed handleSave function if save button is not implemented

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const syntaxTheme = resolvedTheme === 'dark' ? vscDarkPlus : prism;

  return (
    <div className="code-block relative group my-2 border rounded-md bg-muted/30 dark:bg-muted/50"> {/* Adjusted margin slightly */}
      <div className="code-window overflow-auto rounded-md p-3"> {/* Added padding */}
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          customStyle={{
            margin: 0,
            padding: '0', // Reset syntaxhighlighter padding if needed
            background: 'transparent',
            fontSize: '0.875rem',
          }}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"> {/* Adjusted positioning */}
        <CopyToClipboard text={code} onCopy={handleCopy}>
          <button
              className="copy-button text-xs p-1.5 rounded bg-background/70 hover:bg-primary hover:text-primary-foreground backdrop-blur-sm border border-border"
              aria-label="Copy code to clipboard"
              title="Copy code" // Tooltip
          >
            {copied ? 'Copied!' : <FaCopy size={12} />}
          </button>
        </CopyToClipboard>
        {/* Add Save button back here if needed */}
      </div>
    </div>
  );
};

export default CodeMessage;