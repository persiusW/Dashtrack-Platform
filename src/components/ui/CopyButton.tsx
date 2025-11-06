
"use client";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className }: CopyButtonProps) {
  const [ok, setOk] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={onCopy}
      className={className || "btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"}
    >
      {ok ? "Copied" : "Copy"}
    </button>
  );
}
  