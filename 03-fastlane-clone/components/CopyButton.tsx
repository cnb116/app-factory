"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label = "복사" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (text.trim() === "") return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("[CopyButton] copy failed", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-lg bg-black px-4 py-2 text-base font-bold text-yellow-400 shadow transition active:scale-95"
    >
      {copied ? "복사됨! ✓" : `📋 ${label}`}
    </button>
  );
}
