"use client";

import React from "react";

interface ButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "danger" | "info";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium" | "large";
  style?: React.CSSProperties;
}

export function Button({
  onClick,
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  fullWidth = false,
  size = "medium",
  style: customStyle,
}: ButtonProps) {
  // Base styles
  const baseStyle: React.CSSProperties = {
    borderRadius: "4px",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "none",
    display: fullWidth ? "block" : "inline-block",
    width: fullWidth ? "100%" : "auto",
    fontWeight: "500",
    transition: "all 0.2s",
    opacity: disabled ? 0.6 : 1,
  };

  // Size styles
  const sizeStyles: Record<string, React.CSSProperties> = {
    small: {
      padding: "0.25rem 0.75rem",
      fontSize: "0.75rem",
    },
    medium: {
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
    },
    large: {
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
    },
  };

  // Variant styles
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "#000",
      color: "#fff",
      border: "1px solid #000",
    },
    secondary: {
      backgroundColor: "#fff",
      color: "#000",
      border: "1px solid #000",
    },
    success: {
      backgroundColor: "#4CAF50",
      color: "#fff",
      border: "1px solid #4CAF50",
    },
    danger: {
      backgroundColor: "#ff4444",
      color: "#fff",
      border: "1px solid #ff4444",
    },
    info: {
      backgroundColor: "#1976d2",
      color: "#fff",
      border: "1px solid #1976d2",
    },
  };

  // Hover styles for each variant
  const getHoverStyles = (variant: string): React.CSSProperties => {
    const hoverMap: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: "#333",
      },
      secondary: {
        backgroundColor: "#f5f5f5",
      },
      success: {
        backgroundColor: "#45a049",
      },
      danger: {
        backgroundColor: "#cc0000",
      },
      info: {
        backgroundColor: "#1565c0",
      },
    };
    return hoverMap[variant] || {};
  };

  const finalStyle = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...customStyle,
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={
        isHovered && !disabled
          ? { ...finalStyle, ...getHoverStyles(variant) }
          : finalStyle
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
}
