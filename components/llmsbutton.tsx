import { Copy } from 'lucide-react';
import React, { useState } from 'react';

export function CopyLLMSButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/llms-full.txt`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-accent transition-colors text-xs hidden lg:flex font-mono"
      title="Copy llms-full.txt URL"
      type="button"
    >
      <Copy className="w-4 h-4" />
      {copied ? 'Copied!' : 'llms-full.txt'}
    </button>
  );
}
