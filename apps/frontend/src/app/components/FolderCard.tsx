"use client";

import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { IFolderWithUserRole } from "@monorepo/shared";
import { useRouter } from "next/navigation";
import { EditFolderForm } from "./EditFolderForm";
import { CloneModal } from "./CloneModal";
import { createDraggableId } from "../lib/dndTypes";
import { Button } from "./Button";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

interface FolderCardProps {
  folder: IFolderWithUserRole;
  onDelete?: (id: string) => void;
  onClone?: (id: string, newName: string) => void;
  onEdit?: () => void;
}

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

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onDelete,
  onClone,
  onEdit,
}) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const { copy, status } = useCopyToClipboard();

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: createDraggableId("folder", folder.id),
    data: {
      type: "folder",
      id: folder.id,
      name: folder.name,
      currentFolderId: folder.parentId,
    },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `drop-${folder.id}`,
    data: {
      type: "folder",
      folderId: folder.id,
    },
  });

  const setRefs = (element: HTMLDivElement | null) => {
    setDraggableRef(element);
    setDroppableRef(element);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "pointer",
    backgroundColor: isOver ? "#f0f0f0" : "#fff",
    borderColor: isOver ? "#333" : "#ddd",
    borderWidth: isOver ? "2px" : "1px",
    borderStyle: isOver ? "dashed" : "solid",
  };

  const handleClick = () => {
    if (!isDragging) {
      router.push(`/library/folders/${folder.id}`);
    }
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit();
    }
  };

  const handleCloneConfirm = (newName: string) => {
    if (onClone) {
      onClone(folder.id, newName);
    }
    setIsCloning(false);
  };

  const roleBadge = getRoleBadge(folder.userRole, folder.isOwner);

  return (
    <>
      <div
        ref={setRefs}
        style={{
          ...style,
          borderRadius: "8px",
          padding: "16px",
          transition: "all 0.2s",
        }}
        onClick={handleClick}
        onMouseEnter={(e) => {
          if (!isDragging && !isOver) {
            e.currentTarget.style.borderColor = "#999";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging && !isOver) {
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.boxShadow = "none";
          }
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            height: "100%",
          }}
        >
          {/* Drag handle - disabled if not owner/editor */}
          {folder.canEdit ? (
            <div
              {...listeners}
              {...attributes}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: "16px",
                color: "#999",
                cursor: "grab",
                userSelect: "none",
                padding: "4px",
              }}
              title="Drag to move"
            >
              ⋮⋮
            </div>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: "16px",
                color: "#ccc",
                userSelect: "none",
                padding: "4px",
                cursor: "not-allowed",
              }}
              title="No permission to move"
            >
              ⋮⋮
            </div>
          )}

          {/* Folder Icon */}
          <div style={{ fontSize: "32px" }}>📁</div>

          {/* Folder Info */}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
              {folder.name}
            </h3>
            {folder.description && (
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                {folder.description}
              </p>
            )}
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#999",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {/* Role Badge */}
              {roleBadge && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    backgroundColor: roleBadge.bgColor,
                    borderRadius: "4px",
                    color: roleBadge.color,
                    fontWeight: 600,
                  }}
                >
                  {roleBadge.label}
                </span>
              )}

              {folder.isPublic && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    backgroundColor: "#e3f2fd",
                    borderRadius: "4px",
                    color: "#1b5e9a",
                    fontWeight: 600,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    copy(window.location.origin + "/" + folder.publicUrl);
                  }}
                >
                  {status === "success" ? "Copied!" : "Public"}
                </span>
              )}
              <span>{new Date(folder.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Drop indicator */}
          {isOver && (
            <div
              style={{
                fontSize: "24px",
                animation: "pulse 1s infinite",
              }}
            >
              ⬇️
            </div>
          )}

          {/* Actions */}
          <div
            style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
            onClick={(e) => e.stopPropagation()}
          >
            {folder.canEdit && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="info"
                size="small"
                style={{
                  padding: "4px 8px",
                }}
              >
                Edit
              </Button>
            )}
            {folder.canEdit && onClone && (
              <Button
                onClick={() => setIsCloning(true)}
                variant="secondary"
                size="small"
                style={{
                  padding: "4px 8px",
                }}
              >
                Clone
              </Button>
            )}
            {folder.canDelete && onDelete && (
              <Button
                onClick={() => onDelete(folder.id)}
                variant="danger"
                size="small"
                style={{
                  padding: "4px 8px",
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <EditFolderForm
          folder={folder}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* Clone Modal */}
      {isCloning && (
        <CloneModal
          type="folder"
          originalName={folder.name}
          onConfirm={handleCloneConfirm}
          onCancel={() => setIsCloning(false)}
        />
      )}
    </>
  );
};
