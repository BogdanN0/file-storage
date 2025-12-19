"use client";

import { useState } from "react";
import { Button } from "./Button";

interface CloneModalProps {
  type: "file" | "folder";
  originalName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CloneModal: React.FC<CloneModalProps> = ({
  type,
  originalName,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [newName, setNewName] = useState(`${originalName} (Copy)`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onConfirm(newName.trim());
    }
  };

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
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 20px 0", fontSize: "20px" }}>
          Clone {type === "file" ? "File" : "Folder"}
        </h3>

        <form onSubmit={handleSubmit}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Original Name Info */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                Original name:
              </label>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#333",
                  fontWeight: "500",
                }}
              >
                {originalName}
              </p>
            </div>

            {/* New Name Input */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                New {type === "file" ? "file" : "folder"} name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`Enter new ${type} name`}
                required
                autoFocus
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "8px",
                justifyContent: "center",
              }}
            >
              <Button
                type="submit"
                disabled={!newName.trim() || isLoading}
                variant="info"
                style={{
                  width: "50%",
                }}
              >
                {isLoading ? "Cloning..." : "Clone"}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                variant="secondary"
                style={{
                  width: "50%",
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
