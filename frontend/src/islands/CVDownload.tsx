"use client";

import { useState } from "react";
import { registerCVDownload } from "@/lib/api";

/**
 * CV download button — fires a privacy-conscious aggregate counter (no personal data),
 * then opens the PDF from the proxied media route.
 */
export default function CVDownload({ cvId, url, label }: { cvId: string; url: string; label: string }) {
  const [clicked, setClicked] = useState(false);

  function onClick() {
    if (!clicked) {
      setClicked(true);
      void registerCVDownload(cvId);
    }
  }

  return (
    <a
      href={url}
      download={label}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:text-[#0a0c10]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
      </svg>
      Download CV (PDF)
    </a>
  );
}
