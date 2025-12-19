import { useCallback, useState } from "react";

type CopyStatus = "idle" | "success" | "error";

export function useCopyToClipboard(resetMs: number = 1200) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  const copy = useCallback(
    async (text: string) => {
      try {
        // Prefer modern clipboard API (requires secure context: https / localhost)
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          setStatus("success");
          if (resetMs > 0) window.setTimeout(() => setStatus("idle"), resetMs);
          return true;
        }

        // Fallback for older browsers / restricted contexts
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "fixed";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();

        const ok = document.execCommand("copy");
        document.body.removeChild(el);

        setStatus(ok ? "success" : "error");
        if (resetMs > 0) window.setTimeout(() => setStatus("idle"), resetMs);
        return ok;
      } catch {
        setStatus("error");
        if (resetMs > 0) window.setTimeout(() => setStatus("idle"), resetMs);
        return false;
      }
    },
    [resetMs]
  );

  return { copy, status } as const;
}
