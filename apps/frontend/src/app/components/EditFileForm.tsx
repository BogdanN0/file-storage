"use client";

import { useState } from "react";
import { apiHooks } from "../api/hooks";
import { IFile, IUpdateFileInput } from "@monorepo/shared";
import { Button } from "./Button";

interface EditFileFormProps {
  file: IFile;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EditFileForm: React.FC<EditFileFormProps> = ({
  file,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<IUpdateFileInput>({
    name: file.name,
    description: file.description || "",
    isPublic: file.isPublic,
  });

  const updateMutation = apiHooks.library.useUpdateFile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: file.id,
        data: formData,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Update file failed:", error);
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
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 20px 0", fontSize: "20px" }}>Edit File</h3>

        <form onSubmit={handleSubmit}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Name */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                File Name *
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter file name"
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <p
                style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}
              >
                Original: {file.originalName}
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Description (optional)
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter file description"
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            {/* isPublic */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={!!formData.isPublic}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, isPublic: e.target.checked }))
                }
              />
              Make this file public
            </label>

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
                disabled={!formData.name?.trim() || updateMutation.isPending}
                variant="info"
                style={{
                  width: "50%",
                }}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>

              <Button
                type="button"
                onClick={onCancel}
                variant="secondary"
                style={{
                  width: "50%",
                }}
              >
                Cancel
              </Button>
            </div>

            {updateMutation.isError && (
              <p style={{ margin: 0, fontSize: "14px", color: "#ff4444" }}>
                Failed to update file. Please try again.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
