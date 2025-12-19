"use client";

import { Button } from "./Button";
import { NavButton } from "./NavButton";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "#fff",
          border: "2px solid #000",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "400px",
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "18px",
            fontWeight: "600",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: "14px",
            color: "#333",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <Button onClick={onCancel} variant="secondary">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} variant="primary">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
