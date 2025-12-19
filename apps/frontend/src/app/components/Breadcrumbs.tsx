"use client";

import { useDroppable } from "@dnd-kit/core";
import { IFolderBreadcrumb } from "@monorepo/shared";
import { useRouter } from "next/navigation";

interface BreadcrumbsProps {
  breadcrumbs: IFolderBreadcrumb[];
  currentFolderId?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  breadcrumbs,
  currentFolderId,
}) => {
  const router = useRouter();

  const RootCrumb = () => {
    const isCurrentFolder =
      currentFolderId === null || currentFolderId === undefined;

    const { setNodeRef, isOver } = useDroppable({
      id: "breadcrumb-root",
      data: {
        type: "breadcrumb",
        folderId: null,
      },
      disabled: false,
    });

    return (
      <span
        ref={setNodeRef}
        onClick={() => router.push("/library")}
        style={{
          display: "inline-block",
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: "pointer",
          color: isCurrentFolder ? "#333" : "#1976d2",
          fontWeight: isCurrentFolder ? "600" : "500",
          backgroundColor: isOver ? "#c8e6c9" : "transparent",
          border: isOver ? "2px dashed #4CAF50" : "2px dashed transparent",
          transition: "all 0.2s",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!isOver && !isCurrentFolder) {
            e.currentTarget.style.textDecoration = "underline";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = "none";
        }}
        title={
          isCurrentFolder
            ? "Current location"
            : "Drop here to move to Library root"
        }
      >
        Library
        {isOver && (
          <span style={{ marginLeft: "6px", fontSize: "16px" }}>⬇️</span>
        )}
      </span>
    );
  };

  const BreadcrumbItem = ({
    crumb,
    isLast,
  }: {
    crumb: IFolderBreadcrumb;
    isLast: boolean;
  }) => {
    const isCurrentFolder = crumb.id === currentFolderId;

    const { setNodeRef, isOver } = useDroppable({
      id: `breadcrumb-${crumb.id}`,
      data: {
        type: "breadcrumb",
        folderId: crumb.id,
      },
      disabled: false,
    });

    const handleClick = () => {
      if (!isCurrentFolder) {
        router.push(`/library/folders/${crumb.id}`);
      }
    };

    return (
      <span
        ref={setNodeRef}
        onClick={handleClick}
        style={{
          display: "inline-block",
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: isCurrentFolder ? "default" : "pointer",
          color: isCurrentFolder ? "#333" : "#1976d2",
          fontWeight: isCurrentFolder ? "600" : "500",
          backgroundColor: isOver ? "#c8e6c9" : "transparent",
          border: isOver ? "2px dashed #4CAF50" : "2px dashed transparent",
          transition: "all 0.2s",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!isCurrentFolder && !isOver) {
            e.currentTarget.style.textDecoration = "underline";
          }
        }}
        onMouseLeave={(e) => {
          if (!isCurrentFolder) {
            e.currentTarget.style.textDecoration = "none";
          }
        }}
        title={
          isCurrentFolder
            ? "Current folder"
            : `Drop here to move to ${crumb.name}`
        }
      >
        {crumb.name}
        {isOver && !isCurrentFolder && (
          <span style={{ marginLeft: "6px", fontSize: "16px" }}>⬇️</span>
        )}
      </span>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        padding: "16px 20px",
        marginBottom: "20px",
        backgroundColor: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
      }}
    >
      <span style={{ fontSize: "18px", marginRight: "8px" }}>📍</span>

      <RootCrumb />

      {breadcrumbs &&
        breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <div
              key={crumb.id}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span
                style={{ color: "#999", fontSize: "14px", userSelect: "none" }}
              >
                ›
              </span>
              <BreadcrumbItem crumb={crumb} isLast={isLast} />
            </div>
          );
        })}
    </div>
  );
};
