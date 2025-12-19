"use client";

import { useMemo, useState } from "react";
import { apiHooks } from "../api/hooks";
import { ICreateFolderInput } from "@monorepo/shared";
import { Button } from "./Button";

interface CreateFolderFormProps {
  parentId?: string;
  onSuccess?: () => void;
}

export const CreateFolderForm: React.FC<CreateFolderFormProps> = ({
  parentId,
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const initialFormData = useMemo<ICreateFolderInput>(
    () => ({
      name: "",
      description: "",
      parentId,
      isPublic: false,
    }),
    [parentId]
  );
  const [formData, setFormData] = useState<ICreateFolderInput>(initialFormData);

  const createMutation = apiHooks.library.useCreateFolder();

  const resetAndClose = () => {
    setFormData(initialFormData);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await createMutation.mutateAsync({
        ...formData,
        parentId: parentId ?? formData.parentId,
      });

      resetAndClose();
      onSuccess?.();
    } catch (error) {
      console.error("Create folder failed:", error);
    }
  };

  const shellStyle: React.CSSProperties = {
    alignSelf: "flex-start",
    width: "100%",
    maxWidth: 520,
    boxSizing: "border-box",
  };

  if (!isOpen) {
    return (
      <div
        style={{
          ...shellStyle,
          maxWidth: 240,
        }}
      >
        <Button variant="info" onClick={() => setIsOpen(true)}>
          📁 New Folder
        </Button>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: "12px",
          padding: "16px",
          backgroundColor: "#fff",
          boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", lineHeight: 1.2 }}>
            Create Folder
          </h3>
          <Button
            onClick={resetAndClose}
            style={{
              border: "1px solid #e5e5e5",
              background: "#fff",
              borderRadius: "10px",
              padding: "6px 10px",
              cursor: "pointer",
              lineHeight: 1,
            }}
            type="button"
            variant="secondary"
          >
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "12px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Folder Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Enter folder name"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Description (optional)
              </label>
              <input
                type="text"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Enter folder description"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

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
              Make this folder public
            </label>

            <div
              style={{
                display: "grid",
                gap: "10px",
                gridTemplateColumns: "1fr 1fr",
                marginTop: "4px",
              }}
            >
              <Button
                type="submit"
                disabled={!formData.name.trim() || createMutation.isPending}
                variant="success"
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>

              <Button type="button" onClick={resetAndClose} variant="secondary">
                Cancel
              </Button>
            </div>

            {createMutation.isError && (
              <p style={{ margin: 0, fontSize: "13px", color: "#d32f2f" }}>
                Failed to create folder. Please try again.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
