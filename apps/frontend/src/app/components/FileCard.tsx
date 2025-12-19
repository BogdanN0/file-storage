"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { IFileWithUserRole } from "@monorepo/shared";
import { EditFileForm } from "./EditFileForm";
import { CloneModal } from "./CloneModal";
import { createDraggableId } from "../lib/dndTypes";
import { Button } from "./Button";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

interface FileCardProps {
  file: IFileWithUserRole;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClone?: (id: string, newName: string) => void;
  onEdit?: () => void;
}

const formatFileSize = (bytes: number | string | bigint): string => {
  const size = typeof bytes === "string" ? parseInt(bytes) : Number(bytes);
  if (size === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(size) / Math.log(k));

  return Math.round((size / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const getFileIcon = (extension: string): string => {
  const ext = extension.toLowerCase();
  const iconMap: Record<string, string> = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    ppt: "📽️",
    pptx: "📽️",
    txt: "📃",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    mp4: "🎥",
    mp3: "🎵",
    zip: "🗜️",
  };

  return iconMap[ext] || "📎";
};

const getRoleBadge = (
  userRole: string | null,
  isOwner: boolean
): { label: string; color: string; bgColor: string } | null => {
  if (isOwner) {
    return { label: "Owner", color: "#1565c0", bgColor: "#e3f2fd" };
  }

  if (userRole === "EDITOR") {
    return { label: "Editor", color: "#2e7d32", bgColor: "#e8f5e9" };
  }

  if (userRole === "VIEWER") {
    return { label: "Viewer", color: "#f57c00", bgColor: "#fff3e0" };
  }

  return null;
};

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onDownload,
  onDelete,
  onClone,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { copy, status } = useCopyToClipboard();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: createDraggableId("file", file.id),
      data: {
        type: "file",
        id: file.id,
        name: file.name,
        currentFolderId: file.folderId,
      },
    });

  const baseDnDStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const cardStyle = {
    ...baseDnDStyle,
    border: "1px solid",
    borderColor: !isDragging && isHovered ? "#999" : "#ddd",
    borderRadius: "10px",
    padding: "14px",
    backgroundColor: "#fff",

    transition:
      "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
    boxShadow:
      !isDragging && isHovered ? "0 8px 24px rgba(0,0,0,0.12)" : "none",
  } as const;

  const handleEditSuccess = () => {
    setIsEditing(false);
    onEdit?.();
  };

  const handleCloneConfirm = (newName: string) => {
    onClone?.(file.id, newName);
    setIsCloning(false);
  };

  const roleBadge = getRoleBadge(file.userRole, file.isOwner);

  return (
    <>
      <div
        ref={setNodeRef}
        style={cardStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        {/* 2-row layout: header + footer */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto 1fr",
            gridTemplateRows: "auto auto",
            columnGap: "12px",
            rowGap: "1px",
            alignItems: "center",
            height: "100%",
          }}
        >
          {/* Drag handle (spans both rows) - disabled if not owner/editor */}
          {file.canEdit ? (
            <div
              {...listeners}
              {...attributes}
              style={{
                gridRow: "1 / span 2",
                fontSize: "16px",
                color: "#999",
                cursor: "grab",
                userSelect: "none",
                padding: "6px 6px",
                lineHeight: 1,
                borderRadius: "6px",
                alignSelf: "center",
              }}
              title="Drag to move"
            >
              ⋮⋮
            </div>
          ) : (
            <div
              style={{
                gridRow: "1 / span 2",
                fontSize: "16px",
                color: "#ccc",
                userSelect: "none",
                padding: "6px 6px",
                lineHeight: 1,
                alignSelf: "center",
                cursor: "not-allowed",
              }}
              title="No permission to move"
            >
              ⋮⋮
            </div>
          )}

          {/* Icon (spans both rows) */}
          <div
            style={{
              gridRow: "1 / span 2",
              fontSize: "32px",
              lineHeight: 1,
              alignSelf: "center",
            }}
          >
            {getFileIcon(file.extension)}
          </div>

          {/* Title + description */}
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1.25,
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {file.name}
            </h3>

            {file.description && (
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: "14px",
                  color: "#666",
                  lineHeight: 1.35,
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {file.description}
              </p>
            )}
          </div>

          {/* Footer: meta + actions (wrap nicely inside 300px cards) */}
          <div
            style={{
              gridColumn: "3",
              display: "flex",
              alignItems: "center",
              gap: "10px 12px",
              flexWrap: "wrap",
              marginTop: "2px",
            }}
          >
            {/* Meta */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                fontSize: "12px",
                color: "#888",
              }}
            >
              {/* Role Badge */}
              {roleBadge && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    backgroundColor: roleBadge.bgColor,
                    borderRadius: "6px",
                    color: roleBadge.color,
                    fontWeight: 600,
                  }}
                >
                  {roleBadge.label}
                </span>
              )}

              {file.isPublic && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    backgroundColor: "#e3f2fd",
                    borderRadius: "6px",
                    color: "#1b5e9a",
                    fontWeight: 600,
                    cursor: "pointer",
                    zIndex: "100",
                  }}
                  onClick={() =>
                    copy(window.location.origin + "/" + file.publicUrl)
                  }
                >
                  {status === "success" ? "Copied!" : "Public"}
                </span>
              )}
              <span>{formatFileSize(file.size)}</span>
              <span style={{ opacity: 0.7 }}>•</span>
              <span>{new Date(file.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {file.canEdit && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="info"
                  size="small"
                  style={{ padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  Edit
                </Button>
              )}

              {file.canDownload && onDownload && (
                <Button
                  onClick={() => onDownload(file.id)}
                  variant="success"
                  size="small"
                  style={{ padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  Download
                </Button>
              )}

              {file.canEdit && onClone && (
                <Button
                  onClick={() => setIsCloning(true)}
                  variant="secondary"
                  size="small"
                  style={{ padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  Clone
                </Button>
              )}

              {file.canDelete && onDelete && (
                <Button
                  onClick={() => onDelete(file.id)}
                  variant="danger"
                  size="small"
                  style={{ padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <EditFileForm
          file={file}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {isCloning && (
        <CloneModal
          type="file"
          originalName={file.name}
          onConfirm={handleCloneConfirm}
          onCancel={() => setIsCloning(false)}
        />
      )}
    </>
  );
};
