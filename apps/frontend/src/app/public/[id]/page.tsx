"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiHooks } from "../../api/hooks";
import { api } from "../../api/api";
import { Button } from "../../components/Button";
import { Loading } from "../../components/Loading";

export default function PublicPage() {
  const params = useParams();
  const router = useRouter();
  const publicUrl = params.id as string;

  // Check resource type first
  const {
    data: resourceCheck,
    isLoading: isCheckLoading,
    error: checkError,
  } = apiHooks.library.usePublicResourceCheck(publicUrl);

  // Render based on resource type
  if (isCheckLoading) {
    return <Loading />;
  }

  if (checkError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
        }}
      >
        <div
          style={{
            fontSize: "64px",
            marginBottom: "16px",
          }}
        >
          🔒
        </div>
        <h1 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
          Resource Not Found
        </h1>
        <p style={{ fontSize: "18px", color: "#666", margin: 0 }}>
          This resource doesn't exist or is not publicly accessible.
        </p>
      </div>
    );
  }

  const resourceType = resourceCheck?.data?.type;

  if (resourceType === "folder") {
    return <PublicFolderView publicUrl={publicUrl} />;
  }

  if (resourceType === "file") {
    return <PublicFileView publicUrl={publicUrl} />;
  }

  return null;
}

// Component for displaying public folder
function PublicFolderView({ publicUrl }: { publicUrl: string }) {
  const router = useRouter();
  const {
    data: folderContent,
    isLoading,
    error,
  } = apiHooks.library.usePublicFolderContent(publicUrl);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        Loading folder...
      </div>
    );
  }

  if (error || !folderContent?.data) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "red",
        }}
      >
        Error loading folder
      </div>
    );
  }

  const folder = folderContent.data.folder;
  const breadcrumbs = folderContent.data.breadcrumbs || [];
  const subfolders = folderContent.data.subfolders || [];
  const files = folderContent.data.files || [];

  const handleDownloadFile = (filePublicUrl: string) => {
    // Extract the ID from publicUrl (remove "public/" prefix)
    const id = filePublicUrl.replace("public/", "");
    api.library.public.downloadFile(id);
  };

  const handleFolderClick = (folderPublicUrl: string) => {
    // Extract the ID from publicUrl
    const id = folderPublicUrl?.replace("public/", "");
    if (id) {
      router.push(`/public/${id}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e0e0e0",
          padding: "1rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "24px" }}>📂</span>
          <h1 style={{ fontSize: "24px", margin: 0 }}>Public Folder</h1>
        </div>
      </header>

      {/* Content */}
      <div
        style={{
          padding: "2rem 1rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "24px",
              fontSize: "14px",
              color: "#666",
              flexWrap: "wrap",
            }}
          >
            {breadcrumbs.map((crumb, index) => (
              <div
                key={crumb.id}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {index > 0 && <span>/</span>}
                <span
                  style={{
                    fontWeight:
                      index === breadcrumbs.length - 1 ? "600" : "400",
                  }}
                >
                  {crumb.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Folder Info */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "24px",
            borderRadius: "8px",
            marginBottom: "32px",
            border: "1px solid #e0e0e0",
          }}
        >
          <h2 style={{ margin: "0 0 8px 0", fontSize: "28px" }}>
            {folder.name}
          </h2>
          {folder.description && (
            <p style={{ margin: 0, color: "#666", fontSize: "16px" }}>
              {folder.description}
            </p>
          )}
          <div style={{ marginTop: "12px", fontSize: "14px", color: "#999" }}>
            {subfolders.length} folder{subfolders.length !== 1 ? "s" : ""} •{" "}
            {files.length} file{files.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Subfolders */}
        {subfolders.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              📁 Folders ({subfolders.length})
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              {subfolders.map((subfolder) => (
                <div
                  key={subfolder.id}
                  onClick={() => handleFolderClick(subfolder.publicUrl!)}
                  style={{
                    backgroundColor: "#fff",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>📁</span>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "600",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {subfolder.name}
                    </h4>
                  </div>
                  {subfolder.description && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#666",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {subfolder.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        {files.length > 0 && (
          <div>
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              📄 Files ({files.length})
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              {files.map((file) => {
                const fileId = file.publicUrl?.replace("public/", "") || "";
                return (
                  <div
                    key={file.id}
                    style={{
                      backgroundColor: "#fff",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>📄</span>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: "600",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.name}
                      </h4>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999",
                        marginBottom: "12px",
                      }}
                    >
                      {file.extension.toUpperCase()} •{" "}
                      {formatFileSize(Number(file.size))}
                    </div>
                    <Button
                      variant="info"
                      onClick={() => handleDownloadFile(fileId)}
                      size="medium"
                      style={{
                        width: "100%",
                      }}
                    >
                      📥 Download
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {subfolders.length === 0 && files.length === 0 && (
          <div
            style={{
              padding: "64px",
              textAlign: "center",
              color: "#999",
              backgroundColor: "#fff",
              border: "2px dashed #ddd",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📂</div>
            <p style={{ fontSize: "18px", margin: 0 }}>This folder is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for displaying public file
function PublicFileView({ publicUrl }: { publicUrl: string }) {
  const {
    data: fileData,
    isLoading,
    error,
  } = apiHooks.library.usePublicFile(publicUrl);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        Loading file...
      </div>
    );
  }

  if (error || !fileData?.data) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "red",
        }}
      >
        Error loading file
      </div>
    );
  }

  const file = fileData.data;

  const handleDownload = () => {
    api.library.public.downloadFile(publicUrl);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e0e0e0",
          padding: "1rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "24px" }}>📄</span>
          <h1 style={{ fontSize: "24px", margin: 0 }}>Public File</h1>
        </div>
      </header>

      {/* Content */}
      <div
        style={{
          padding: "2rem 1rem",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "32px",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            textAlign: "center",
          }}
        >
          {/* File Icon */}
          <div style={{ fontSize: "64px", marginBottom: "24px" }}>📄</div>

          {/* File Name */}
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: "28px",
              wordBreak: "break-word",
            }}
          >
            {file.name}
          </h2>

          {/* File Info */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              marginBottom: "24px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            <span>{file.extension.toUpperCase()}</span>
            <span>•</span>
            <span>{formatFileSize(Number(file.size))}</span>
          </div>

          {/* Description */}
          {file.description && (
            <p
              style={{
                margin: "0 0 24px 0",
                color: "#666",
                fontSize: "16px",
              }}
            >
              {file.description}
            </p>
          )}

          {/* Download Button */}
          <Button onClick={handleDownload} variant="info" size="large">
            📥 Download File
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
