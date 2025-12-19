"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
} from "@dnd-kit/core";
import { useParams } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { apiHooks } from "../../../api/hooks";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { FolderCard } from "../../../components/FolderCard";
import { FileCard } from "../../../components/FileCard";
import { CreateFolderForm } from "../../../components/CreateFolderForm";
import { FileUpload } from "../../../components/FileUpload";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { api } from "../../../api/api";
import { Loading } from "../../../components/Loading";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { useConfirm } from "../../../hooks/useConfirm";

interface DragItem {
  type: "file" | "folder";
  id: string;
  name: string;
  currentFolderId?: string | null;
}

export default function FoldersPage() {
  const { id } = useParams<{ id: string }>();
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const logoutMutation = apiHooks.auth.useLogout();
  const { user, isLoading: isAuthLoading } = useRequireAuth();

  const {
    data: folderContent,
    isLoading: isFolderLoading,
    error,
    refetch,
  } = apiHooks.library.useFolderContent(id);

  // Drag and drop mutations
  const moveFileMutation = apiHooks.library.useMoveFile();
  const moveFolderMutation = apiHooks.library.useMoveFolder();

  const deleteFolderMutation = apiHooks.library.useDeleteFolder();
  const deleteFileMutation = apiHooks.library.useDeleteFile();
  const cloneFolderMutation = apiHooks.library.useCloneFolder();
  const cloneFileMutation = apiHooks.library.useCloneFile();

  if (isAuthLoading || isFolderLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          Error loading folder. It may not exist or you don't have access.
        </div>
      </div>
    );
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = active.data.current as DragItem;

    console.log("🎯 DRAG START:", {
      item,
      activeId: active.id,
    });

    setActiveItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("🎯 DRAG END:", {
      active: {
        id: active.id,
        data: active.data.current,
      },
      over: over
        ? {
            id: over.id,
            data: over.data.current,
          }
        : null,
    });

    setActiveItem(null);

    if (!over) {
      console.log("❌ No drop target");
      return;
    }

    const draggedItem = active.data.current as DragItem;
    const dropTarget = over.data.current;

    console.log("📦 Processing drop:", {
      draggedItem,
      dropTarget,
    });

    if (!draggedItem || !dropTarget) {
      console.log("❌ Missing data");
      return;
    }

    let targetFolderId: string | null = null;

    if (dropTarget.type === "folder") {
      targetFolderId = dropTarget.folderId;
      console.log("📁 Dropping into folder:", targetFolderId);
    } else if (dropTarget.type === "breadcrumb") {
      targetFolderId = dropTarget.folderId;
      console.log("📍 Dropping on breadcrumb:", targetFolderId);
    } else {
      console.log("❌ Unknown drop target type:", dropTarget.type);
      return;
    }

    if (draggedItem.currentFolderId === targetFolderId) {
      console.log("⚠️ Already in this folder, skipping");
      alert("Item is already in this folder!");
      return;
    }

    if (draggedItem.type === "folder" && draggedItem.id === targetFolderId) {
      console.log("⚠️ Cannot move folder into itself");
      alert("Cannot move folder into itself!");
      return;
    }

    console.log("✅ Validation passed, moving...");

    try {
      if (draggedItem.type === "file") {
        console.log(
          "📄 Moving file:",
          draggedItem.id,
          "to folder:",
          targetFolderId
        );
        await moveFileMutation.mutateAsync({
          id: draggedItem.id,
          data: { folderId: targetFolderId },
        });
      } else if (draggedItem.type === "folder") {
        console.log(
          "📁 Moving folder:",
          draggedItem.id,
          "to parent:",
          targetFolderId
        );
        await moveFolderMutation.mutateAsync({
          id: draggedItem.id,
          data: { parentId: targetFolderId },
        });
      }

      console.log("✅ Move successful, refetching data...");
      refetch();
    } catch (error) {
      console.error("❌ Error moving item:", error);
      alert(
        `Failed to move item: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDragCancel = () => {
    console.log("🚫 Drag cancelled");
    setActiveItem(null);
  };

  const handleDeleteFolder = async (folderId: string) => {
    const confirmed = await confirm({
      title: "Delete Folder",
      message:
        "Are you sure you want to delete this folder? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      await deleteFolderMutation.mutateAsync({ id: folderId, cascade: true });
      refetch();
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const confirmed = await confirm({
      title: "Delete File",
      message:
        "Are you sure you want to delete this file? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (confirmed) {
      await deleteFileMutation.mutateAsync(fileId);
      refetch();
    }
  };

  const handleCloneFolder = async (folderId: string, newName: string) => {
    try {
      await cloneFolderMutation.mutateAsync({
        id: folderId,
        data: { newName, parentId: id },
      });
    } catch (error) {
      alert("Failed to clone folder");
    }
  };

  const handleCloneFile = async (fileId: string, newName: string) => {
    try {
      await cloneFileMutation.mutateAsync({
        id: fileId,
        data: { newName, folderId: id },
      });
    } catch (error) {
      alert("Failed to clone file");
    }
  };

  const handleDownloadFile = (fileId: string) => {
    api.library.files.download(fileId);
  };

  const folder = folderContent?.data.folder;
  const breadcrumbs = folderContent?.data.breadcrumbs || [];
  const subfolders = folderContent?.data.subfolders || [];
  const files = folderContent?.data.files || [];

  const isMoving = moveFileMutation.isPending || moveFolderMutation.isPending;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      collisionDetection={pointerWithin}
    >
      <Navbar onLogout={() => logoutMutation.mutate()} />

      <div
        style={{
          padding: "2rem 1rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <Breadcrumbs breadcrumbs={breadcrumbs} currentFolderId={id} />

        {/* Debug info в development */}
        {process.env.NODE_ENV === "development" && activeItem && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fff3cd",
              borderRadius: "8px",
              marginBottom: "16px",
              border: "1px solid #ffc107",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            <strong>🔍 Debug:</strong> Dragging {activeItem.type} "
            {activeItem.name}" from folder{" "}
            {activeItem.currentFolderId || "root"}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "32px" }}>
            {folder?.name}
          </h1>
          {folder?.description && (
            <p style={{ margin: 0, color: "#666", fontSize: "16px" }}>
              {folder.description}
            </p>
          )}
          {folder?.isPublic && (
            <div style={{ marginTop: "12px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Public Folder
              </span>
            </div>
          )}

          {/* Moving indicator */}
          {isMoving && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f0f0f0",
                borderRadius: "8px",
                marginTop: "12px",
                textAlign: "center",
                border: "1px solid #ddd",
                fontSize: "14px",
              }}
            >
              ⏳ Moving item...
            </div>
          )}
        </div>

        {/* Drag & Drop hint */}
        {(subfolders.length > 0 || files.length > 0) && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#e3f2fd",
              borderRadius: "8px",
              marginBottom: "24px",
              border: "1px solid #1976d2",
              fontSize: "14px",
              color: "#0d47a1",
            }}
          >
            <strong>💡 Tip:</strong> Drag items into folders below, or onto any
            folder in the breadcrumb path above to move them!
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            gap: "12px",
            marginBottom: "32px",
            flexWrap: "wrap",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CreateFolderForm parentId={id} />
          <FileUpload folderId={id} />
        </div>

        {/* Subfolders */}
        {subfolders.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              📁 Folders ({subfolders.length})
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {subfolders.map((subfolder) => (
                <FolderCard
                  key={subfolder.id}
                  folder={subfolder}
                  onDelete={handleDeleteFolder}
                  onClone={handleCloneFolder}
                />
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        <div>
          <h2
            style={{
              margin: "0 0 16px 0",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            📄 Files ({files.length})
          </h2>
          {files.length === 0 ? (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: "#999",
                border: "2px dashed #ddd",
                borderRadius: "8px",
              }}
            >
              <p style={{ fontSize: "18px", margin: 0 }}>
                No files in this folder. Upload your first file!
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDownload={handleDownloadFile}
                  onDelete={handleDeleteFile}
                  onClone={handleCloneFile}
                />
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {subfolders.length === 0 && files.length === 0 && (
          <div
            style={{
              padding: "64px",
              textAlign: "center",
              color: "#999",
              border: "2px dashed #ddd",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📂</div>
            <p style={{ fontSize: "20px", margin: "0 0 8px 0" }}>
              This folder is empty
            </p>
            <p style={{ fontSize: "16px", margin: 0 }}>
              Create a subfolder or upload a file to get started
            </p>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#fff",
              border: "2px solid #333",
              borderRadius: "8px",
              boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "20px" }}>
              {activeItem.type === "file" ? "📄" : "📁"}
            </span>
            <span>{activeItem.name}</span>
          </div>
        )}
      </DragOverlay>
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </DndContext>
  );
}
