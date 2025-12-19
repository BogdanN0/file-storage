// Loading.tsx
"use client";

import React from "react";

type LoadingProps = {
  text?: string;
};

export function Loading({ text = "Loading" }: LoadingProps) {
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    zIndex: 9999,
  };

  const boxStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",

    padding: "0.5rem 1rem",
    borderRadius: "4px",
    fontSize: "0.875rem",

    backgroundColor: "#fff",
    color: "#000",
    border: "1px solid #000",
    userSelect: "none",
  };

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <span>{text}</span>
      </div>
    </div>
  );
}
