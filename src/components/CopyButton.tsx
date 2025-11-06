"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy as CopyIcon } from "lucide-react";

export interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onCopied?: () =&gt; void;
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "outline",
  size = "sm",
  className,
  onCopied,
}: CopyButtonProps) {
  const [ok, setOk] = useState(false);

  async function doCopy() {
    try {
      if (navigator.clipboard &amp;&amp; window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setOk(true);
      onCopied?.();
      window.setTimeout(() => setOk(false), 1200);
    } catch {
      /* no-op */
    }
  }

  return (
    <Button
      type="button"
      onClick={doCopy}
      variant={variant}
      size={size}
      className={className}
      title={ok ? copiedLabel : label}
      aria-live="polite"
    >
      {ok ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <CopyIcon className="mr-1.5 h-3.5 w-3.5" />}
      <span>{ok ? copiedLabel : label}</span>
    </Button>
  );
}
