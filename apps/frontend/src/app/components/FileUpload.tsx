"use client";

import { useMemo, useRef, useState } from "react";
import { apiHooks } from "../api/hooks";
import { IUploadFileMetadata } from "@monorepo/shared";
import { Button } from "./Button";

interface FileUploadProps {
  folderId?: string;
  onSuccess?: () => void;
}

function stripExtension(filename: string) {
  // "photo.png" -> "photo", "archive.tar.gz" -> "archive.tar"
  return filename.replace(/\.[^/.]+$/, "");
}

export const FileUpload: React.FC<FileUploadProps> = ({
  folderId,
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const initialMetadata = useMemo<IUploadFileMetadata>(
    () => ({
      description: "",
      folderId,
      isPublic: false,
    }),
    [folderId]
  );

  const [metadata, setMetadata] =
    useState<IUploadFileMetadata>(initialMetadata);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = apiHooks.library.useUploadFile();

  const resetAndClose = () => {
    setFile(null);
    setFileName("");
    setMetadata(initialMetadata);
    setIsOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);

    if (f && !fileName.trim()) {
      setFileName(stripExtension(f.name));
    }
  };

  const handleUpload = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!file) return;

    try {
      const name = fileName.trim();
      const meta = {
        ...metadata,
        folderId: folderId ?? metadata.folderId,
        ...(name ? { name } : {}),
      };
      console.log({
        meta,
      });

      await uploadMutation.mutateAsync({
        file,

        metadata: meta as any,
      });

      resetAndClose();
      onSuccess?.();
    } catch (error) {
      console.error("Upload failed:", error);
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
      <div style={{ ...shellStyle, maxWidth: 240 }}>
        <Button onClick={() => setIsOpen(true)} variant="success">
          📤 Upload File
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
            Upload File
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

        <form onSubmit={handleUpload}>
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
                Select File *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "14px",
                }}
              />
              <p
                style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#777" }}
              >
                Max 50Mb
              </p>
              {file && (
                <p
                  style={{
                    margin: "8px 0 0 0",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* НОВОЕ: имя файла */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                File name (you can change)
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={
                  file ? stripExtension(file.name) : "Enter file name"
                }
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
              <p
                style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#777" }}
              >
                If left blank, the name of the selected file will be used.
              </p>
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
                value={metadata.description || ""}
                onChange={(e) =>
                  setMetadata((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Enter file description"
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
                checked={metadata.isPublic}
                onChange={(e) =>
                  setMetadata((p) => ({ ...p, isPublic: e.target.checked }))
                }
              />
              Make this file public
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
                disabled={!file || uploadMutation.isPending}
                variant="success"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>

              <Button type="button" onClick={resetAndClose} variant="secondary">
                Cancel
              </Button>
            </div>

            {uploadMutation.isError && (
              <p style={{ margin: 0, fontSize: "13px", color: "#d32f2f" }}>
                Upload failed. Please try again.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
