"use client";

interface CopyButtonProps {
  text: string;
  label?: string;
  big?: boolean;
  onCopied?: () => void;
}

export default function CopyButton({ text, label = "복사", big = false, onCopied }: CopyButtonProps) {
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
      onCopied?.();
    } catch (err) {
      console.error("[CopyButton] copy failed", err);
    }
  };

  if (big) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className="w-full rounded-xl bg-yellow-400 py-4 text-lg font-black text-black shadow-lg transition active:scale-95"
      >
        📋 {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-lg bg-black px-4 py-2 text-center text-sm leading-tight font-bold text-yellow-400 shadow transition active:scale-95"
    >
      📋 {label}
    </button>
  );
}
