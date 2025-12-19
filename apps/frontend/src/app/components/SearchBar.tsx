"use client";

import { useState, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  onClear,
  placeholder = "Search folders and files...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (query.trim()) {
        onSearch(query.trim());
      } else {
        onClear();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, onSearch, onClear]);

  const handleClear = () => {
    setQuery("");
    onClear();
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "600px",
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "0.75rem 2.5rem 0.75rem 2.5rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
          fontSize: "1rem",
          boxSizing: "border-box",
          outline: "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#000";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#ccc";
        }}
      />

      {/* Search Icon */}
      <span
        style={{
          position: "absolute",
          left: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "1.25rem",
          color: "#666",
          pointerEvents: "none",
        }}
      >
        🔍
      </span>

      {/* Clear Button */}
      {query && (
        <button
          onClick={handleClear}
          style={{
            position: "absolute",
            right: "0.5rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            fontSize: "1.25rem",
            color: "#666",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
