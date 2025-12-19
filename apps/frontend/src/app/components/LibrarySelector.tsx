"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { apiHooks } from "../api/hooks";
import { IFolder, IFile } from "@monorepo/shared";

type LibraryItem = {
  id: string;
  name: string;
  type: "folder" | "file";
  description?: string | null;
};

interface LibrarySelectorProps {
  selectedItems: LibraryItem[];
  onItemsChange: (items: LibraryItem[]) => void;
}

export function LibrarySelector({
  selectedItems,
  onItemsChange,
}: LibrarySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "folder" | "file">(
    "all"
  );

  const { data: searchResults, isLoading } = apiHooks.library.useLibrarySearch(
    searchQuery,
    { type: filterType }
  );

  const handleItemToggle = (item: LibraryItem) => {
    const isSelected = selectedItems.some(
      (i) => i.id === item.id && i.type === item.type
    );
    if (isSelected) {
      onItemsChange(
        selectedItems.filter((i) => !(i.id === item.id && i.type === item.type))
      );
    } else {
      onItemsChange([...selectedItems, item]);
    }
  };

  const handleRemoveItem = (id: string, type: "folder" | "file") => {
    onItemsChange(
      selectedItems.filter((i) => !(i.id === id && i.type === type))
    );
  };

  const folders = searchResults?.data.folders || [];
  const files = searchResults?.data.files || [];

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3
        style={{
          marginBottom: "1rem",
          fontSize: "1.125rem",
          fontWeight: "600",
        }}
      >
        Select Folders & Files
      </h3>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#666",
              marginBottom: "0.5rem",
            }}
          >
            Selected: {selectedItems.filter((i) => i.type === "folder").length}{" "}
            folder(s), {selectedItems.filter((i) => i.type === "file").length}{" "}
            file(s)
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {selectedItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor:
                    item.type === "folder" ? "#fff3e0" : "#e3f2fd",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                }}
              >
                <span>{item.type === "folder" ? "📁" : "📄"}</span>
                <span>{item.name}</span>
                <button
                  onClick={() => handleRemoveItem(item.id, item.type)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    color: "#666",
                  }}
                  aria-label={`Remove ${item.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Type */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setFilterType("all")}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            backgroundColor: filterType === "all" ? "#000" : "#fff",
            color: filterType === "all" ? "#fff" : "#000",
          }}
        >
          All
        </button>
        <button
          onClick={() => setFilterType("folder")}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            backgroundColor: filterType === "folder" ? "#000" : "#fff",
            color: filterType === "folder" ? "#fff" : "#000",
          }}
        >
          📁 Folders
        </button>
        <button
          onClick={() => setFilterType("file")}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            backgroundColor: filterType === "file" ? "#000" : "#fff",
            color: filterType === "file" ? "#fff" : "#000",
          }}
        >
          📄 Files
        </button>
      </div>

      {/* Search */}
      <SearchBar
        onSearch={setSearchQuery}
        onClear={() => setSearchQuery("")}
        placeholder="Search folders and files..."
      />

      {/* Search Results */}
      {searchQuery && (
        <div
          style={{
            marginTop: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {isLoading && (
            <div
              style={{ padding: "1rem", textAlign: "center", color: "#666" }}
            >
              Searching...
            </div>
          )}

          {!isLoading && folders.length === 0 && files.length === 0 && (
            <div
              style={{ padding: "1rem", textAlign: "center", color: "#666" }}
            >
              No folders or files found
            </div>
          )}

          {/* Folders */}
          {!isLoading && folders.length > 0 && (
            <div>
              <div
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#f5f5f5",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  borderBottom: "1px solid #ddd",
                }}
              >
                📁 Folders ({folders.length})
              </div>
              {folders.map((folder: IFolder) => {
                const isSelected = selectedItems.some(
                  (i) => i.id === folder.id && i.type === "folder"
                );
                const item: LibraryItem = {
                  id: folder.id,
                  name: folder.name,
                  type: "folder",
                  description: folder.description,
                };
                return (
                  <div
                    key={folder.id}
                    onClick={() => handleItemToggle(item)}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#fff3e0" : "transparent",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "#f9f9f9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "500" }}>
                          📁 {folder.name}
                        </div>
                        {folder.description && (
                          <div style={{ fontSize: "0.875rem", color: "#666" }}>
                            {folder.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <span style={{ color: "#ff9800", fontSize: "1.25rem" }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Files */}
          {!isLoading && files.length > 0 && (
            <div>
              <div
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#f5f5f5",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  borderBottom: "1px solid #ddd",
                }}
              >
                📄 Files ({files.length})
              </div>
              {files.map((file: IFile) => {
                const isSelected = selectedItems.some(
                  (i) => i.id === file.id && i.type === "file"
                );
                const item: LibraryItem = {
                  id: file.id,
                  name: file.name,
                  type: "file",
                  description: file.description,
                };
                return (
                  <div
                    key={file.id}
                    onClick={() => handleItemToggle(item)}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#e3f2fd" : "transparent",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "#f9f9f9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "500" }}>📄 {file.name}</div>
                        <div style={{ fontSize: "0.875rem", color: "#666" }}>
                          {file.originalName} • {file.extension}
                        </div>
                      </div>
                      {isSelected && (
                        <span style={{ color: "#2196f3", fontSize: "1.25rem" }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
