"use client";

import { useEffect, useRef, useState } from "react";
import { config } from "@/data/config";

type Props = {
  ariaLabel: string;
  showClear: boolean;
  clearLabel: string;
  onClear: () => void;
};

// Mobile-only "⋯" menu that holds the social links + Clear action, so the header
// can keep the full name visible on narrow screens.
export default function OverflowMenu({ ariaLabel, showClear, clearLabel, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const { linkedin, github, huggingface, email } = config.socials;
  const links: { label: string; href: string }[] = [];
  if (linkedin) links.push({ label: "LinkedIn", href: linkedin });
  if (github) links.push({ label: "GitHub", href: github });
  if (huggingface) links.push({ label: "Hugging Face", href: huggingface });
  if (email) links.push({ label: "Email", href: `mailto:${email}` });

  const itemClass =
    "flex w-full items-center px-3 py-2 text-left text-sm text-neutral-200 transition-colors hover:bg-neutral-800";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-800 text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 min-w-[11rem] overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl"
        >
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={itemClass}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          {showClear && (
            <>
              <div className="my-1 border-t border-neutral-800" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onClear();
                }}
                className={`${itemClass} text-neutral-300`}
              >
                {clearLabel}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
