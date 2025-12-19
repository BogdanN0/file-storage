"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: "primary" | "secondary";

  /**
   * Enables auto-active styling (route-aware).
   * If true -> button detects current page by href and toggles style.
   * If false/undefined -> no auto-active styling.
   */
  beActive?: boolean;
}

function normalizePath(path: string) {
  const clean = path.split("?")[0].split("#")[0];
  if (clean === "/") return "/";
  return clean.replace(/\/+$/, "");
}

function hrefToPathname(href: string) {
  try {
    return normalizePath(new URL(href, "http://local").pathname);
  } catch {
    return normalizePath(href);
  }
}

export function NavButton({
  href,
  onClick,
  children,
  variant = "primary",
  beActive,
}: NavButtonProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const isActive = (() => {
    if (!beActive) return false;
    if (!href) return false;

    const current = normalizePath(pathname);
    const target = hrefToPathname(href);

    if (target === "/") return current === "/";

    return current === target || current.includes(`${target}/`);
  })();

  const baseStyle: CSSProperties = {
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    fontSize: "0.875rem",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    userSelect: "none",
    transition:
      "transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease, color 140ms ease, border-color 140ms ease",
  };

  const primaryStyle: CSSProperties = {
    ...baseStyle,
    backgroundColor: "#000",
    color: "#fff",
  };

  const secondaryStyle: CSSProperties = {
    ...baseStyle,
    backgroundColor: "#fff",
    color: "#000",
    border: "1px solid #000",
  };

  const primaryHover: CSSProperties = {
    transform: "translateY(-1px)",
    backgroundColor: "#111",
    boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
  };

  const secondaryHover: CSSProperties = {
    transform: "translateY(-1px)",
    backgroundColor: "#f5f5f5",
    boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
  };

  const normalStyle = variant === "primary" ? primaryStyle : secondaryStyle;
  const activeStyle = variant === "primary" ? secondaryStyle : primaryStyle;

  const hoverStyle = variant === "primary" ? primaryHover : secondaryHover;

  const style = isActive
    ? activeStyle
    : isHovered
    ? { ...normalStyle, ...hoverStyle }
    : normalStyle;

  const hoverHandlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onFocus: () => setIsHovered(true),
    onBlur: () => setIsHovered(false),
  };

  if (href) {
    return (
      <Link
        href={href}
        style={style}
        aria-current={isActive ? "page" : undefined}
        {...hoverHandlers}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      style={style}
      aria-pressed={isActive}
      {...hoverHandlers}
    >
      {children}
    </button>
  );
}
