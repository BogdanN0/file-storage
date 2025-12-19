"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { Navbar } from "../components/Navbar";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { apiHooks } from "../api/hooks";
import { FolderCard } from "../components/FolderCard";
import { FileCard } from "../components/FileCard";
import { CreateFolderForm } from "../components/CreateFolderForm";
import { FileUpload } from "../components/FileUpload";
import { api } from "../api/api";
import { Loading } from "../components/Loading";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { SearchBar } from "../components/SearchBar";

interface DragItem {
  type: "file" | "folder";
  id: string;
  name: string;
  currentFolderId?: string | null;
}

export default function LibraryPage() {
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const logoutMutation = apiHooks.auth.useLogout();
  const { user, isLoading: isAuthLoading } = useRequireAuth();

  const {
    data: libraryData,
    isLoading: isLibraryLoading,
    refetch,
  } = apiHooks.library.useUserLibrary({
    foldersLimit: 50,
    filesLimit: 50,
  });

  const { data: searchData, isLoading: isSearchLoading } =
    apiHooks.library.useLibrarySearch(searchQuery, {
      type: "all",
    });

  // Drag and drop mutations
  const moveFileMutation = apiHooks.library.useMoveFile();
  const moveFolderMutation = apiHooks.library.useMoveFolder();

  const deleteFolderMutation = apiHooks.library.useDeleteFolder();
  const deleteFileMutation = apiHooks.library.useDeleteFile();
  const cloneFolderMutation = apiHooks.library.useCloneFolder();
  const cloneFileMutation = apiHooks.library.useCloneFile();

  if (isLibraryLoading) {
    return <Loading />;
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = active.data.current as DragItem;
    setActiveItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const draggedItem = active.data.current as DragItem;
    const dropTarget = over.data.current;

    if (!draggedItem || !dropTarget) return;

    let targetFolderId: string | null = null;

    if (dropTarget.type === "folder") {
      targetFolderId = dropTarget.folderId;
    } else if (dropTarget.type === "breadcrumb") {
      targetFolderId = dropTarget.folderId;
    }

    if (draggedItem.currentFolderId === targetFolderId) {
      return;
    }

    if (draggedItem.type === "folder" && draggedItem.id === targetFolderId) {
      return;
    }

    try {
      if (draggedItem.type === "file") {
        await moveFileMutation.mutateAsync({
          id: draggedItem.id,
          data: { folderId: targetFolderId },
        });
      } else if (draggedItem.type === "folder") {
        await moveFolderMutation.mutateAsync({
          id: draggedItem.id,
          data: { parentId: targetFolderId },
        });
      }

      refetch();
    } catch (error) {
      console.error("Error moving item:", error);
      alert("Failed to move item. Please try again.");
    }
  };

  const handleDragCancel = () => {
    setActiveItem(null);
  };

  const handleDeleteFolder = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Folder",
      message:
        "Are you sure you want to delete this folder? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      await deleteFolderMutation.mutateAsync({ id, cascade: true });
    }
  };

  const handleDeleteFile = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete File",
      message:
        "Are you sure you want to delete this file? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      await deleteFileMutation.mutateAsync(id);
    }
  };

  const handleCloneFolder = async (id: string, newName: string) => {
    try {
      await cloneFolderMutation.mutateAsync({
        id,
        data: { newName: newName },
      });
    } catch (error) {
      alert("Failed to clone folder");
    }
  };

  const handleCloneFile = async (id: string, newName: string) => {
    try {
      await cloneFileMutation.mutateAsync({
        id,
        data: { newName: newName },
      });
    } catch (error) {
      alert("Failed to clone file");
    }
  };

  const handleDownloadFile = (id: string) => {
    api.library.files.download(id);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Determine what data to show
  const isSearchActive = searchQuery.trim().length > 0;

  // Show search results or regular library data
  const folders = isSearchActive
    ? searchData?.data.folders || []
    : (libraryData?.data.folders.data || []).filter(
        (folder) => folder.parentId === null
      );

  const files = isSearchActive
    ? searchData?.data.files || []
    : (libraryData?.data.files.data || []).filter(
        (file) => file.folderId === null
      );

  const stats = libraryData?.data.stats;

  const isMoving = moveFileMutation.isPending || moveFolderMutation.isPending;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Navbar onLogout={() => logoutMutation.mutate()} />

      <div
        style={{
          padding: "2rem 1rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ margin: "0 0 16px 0", fontSize: "32px" }}>Library</h1>

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

          {/* Stats */}
          {stats && (
            <div
              style={{
                display: "flex",
                gap: "24px",
                padding: "16px",
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                marginTop: "12px",
              }}
            >
              <div>
                <strong>{stats.totalFolders}</strong> folders
              </div>
              <div>
                <strong>{stats.totalFiles}</strong> files
              </div>
              <div>
                <strong>{(stats.totalSize / 1024 / 1024).toFixed(2)} MB</strong>{" "}
                total
              </div>
            </div>
          )}
        </div>

        {/* Drag & Drop hint */}
        {(folders.length > 0 || files.length > 0) && !isSearchActive && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#f1f0f0ff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              marginBottom: "24px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            💡 <strong>Tip:</strong> Use the drag handle (⋮⋮) to move files and
            folders by dragging them
          </div>
        )}

        {/* Search Bar */}
        <div style={{ marginBottom: "32px" }}>
          <SearchBar
            onSearch={handleSearch}
            onClear={handleClearSearch}
            placeholder="Search folders and files..."
          />

          {/* Search Results Info */}
          {isSearchActive && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px 16px",
                backgroundColor: "#f0f9ff",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#0369a1",
                border: "1px solid #bae6fd",
              }}
            >
              {isSearchLoading ? (
                "🔍 Searching..."
              ) : (
                <>
                  Found <strong>{folders.length}</strong> folder(s) and{" "}
                  <strong>{files.length}</strong> file(s) matching "
                  {searchQuery}"
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isSearchActive && (
          <div
            style={{
              gap: "12px",
              marginBottom: "32px",
              flexWrap: "wrap",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CreateFolderForm />
            <FileUpload />
          </div>
        )}

        {/* Folders */}
        {folders.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              📁 {isSearchActive ? "Folders Found" : "Folders"} (
              {folders.length})
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
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
            📄 {isSearchActive ? "Files Found" : "Files"} ({files.length})
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
                {isSearchActive
                  ? "No files found matching your search."
                  : "No files yet. Upload your first file!"}
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
        {folders.length === 0 && files.length === 0 && !isSearchActive && (
          <div
            style={{
              padding: "64px",
              textAlign: "center",
              color: "#999",
              border: "2px dashed #ddd",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
            <p style={{ fontSize: "20px", margin: "0 0 8px 0" }}>
              Your library is empty
            </p>
            <p style={{ fontSize: "16px", margin: 0 }}>
              Create a folder or upload a file to get started
            </p>
          </div>
        )}

        {/* No Search Results */}
        {folders.length === 0 && files.length === 0 && isSearchActive && (
          <div
            style={{
              padding: "64px",
              textAlign: "center",
              color: "#999",
              border: "2px dashed #ddd",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <p style={{ fontSize: "20px", margin: "0 0 8px 0" }}>
              No results found
            </p>
            <p style={{ fontSize: "16px", margin: 0 }}>
              Try a different search term
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
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{activeItem.type === "file" ? "📄" : "📁"}</span>
            <span>{activeItem.name}</span>
          </div>
        )}
      </DragOverlay>

      {/* Confirmation Dialog */}
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
