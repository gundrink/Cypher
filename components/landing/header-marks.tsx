"use client";

import { useState } from "react";

const MARK_CLASS =
  "inline-flex h-7.5 items-center justify-center rounded-full border border-brand/20 bg-white/60 text-foreground backdrop-blur transition-colors duration-200 hover:border-brand hover:text-brand";

interface HeaderMarksProps {
  xUrl: string;
  ca: string;
}

export function HeaderMarks({ xUrl, ca }: HeaderMarksProps) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!ca) return;
    try {
      await navigator.clipboard.writeText(ca);
    } catch {
      copyWithSelection(ca);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <span className="inline-flex flex-none items-center gap-1.5">
      <a
        className={`${MARK_CLASS} w-7.5`}
        href={xUrl || undefined}
        target={xUrl ? "_blank" : undefined}
        rel={xUrl ? "noreferrer" : undefined}
        aria-label="X"
      >
        <XIcon />
      </a>
      <button
        className={`${MARK_CLASS} whitespace-nowrap px-3 text-xs font-semibold tabular-nums tracking-[0.01em]`}
        type="button"
        onClick={copyAddress}
        aria-label={copied ? "Contract address copied" : "Copy contract address"}
      >
        {copied ? "Copied" : formatCa(ca)}
      </button>
    </span>
  );
}

// In-app wallet browsers often block the async Clipboard API.
function copyWithSelection(text: string): void {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

function formatCa(ca: string): string {
  if (ca.length <= 8) return `CA : ${ca}`;
  return `CA : ${ca.slice(0, 4)}....${ca.slice(-4)}`;
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}
