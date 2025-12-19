"use client";

import { useState } from "react";
import { apiHooks, userKeys } from "../api/hooks";
import { IUserWithAccess, PermissionRole } from "@monorepo/shared";
import { Button } from "./Button";
import { useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "./ConfirmDialog";

interface UsersWithAccessListProps {
  userId: string;
}

export function UsersWithAccessList({ userId }: UsersWithAccessListProps) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [revokingPermission, setRevokingPermission] = useState<string | null>(
    null
  );
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const queryClient = useQueryClient();
  const { data, isLoading, error } = apiHooks.users.useUsersWithAccess(userId, {
    page,
    limit,
  });

  const revokeFolderPermissionMutation =
    apiHooks.permissions.useRevokeFolderPermission();
  const revokeFilePermissionMutation =
    apiHooks.permissions.useRevokeFilePermission();

  const handleRevokeFolderPermission = async (
    permissionId: string,
    folderName: string
  ) => {
    const confirmed = await confirm({
      title: "Revoke folder permission",
      message:
        "Are you sure you want to revoke folder permission for this user? This action cannot be undone.",
      confirmText: "Revoke",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      return;
    }

    setRevokingPermission(permissionId);
    try {
      await revokeFolderPermissionMutation.mutateAsync(permissionId);

      // Invalidate cache to refresh the list
      queryClient.invalidateQueries({
        queryKey: userKeys.usersWithAccess(userId),
      });
    } catch (error: any) {
      alert(`Failed to revoke permission: ${error.message}`);
    } finally {
      setRevokingPermission(null);
    }
  };

  const handleRevokeFilePermission = async (
    permissionId: string,
    fileName: string
  ) => {
    const confirmed = await confirm({
      title: "Revoke file permission",
      message:
        "Are you sure you want to revoke file permission for this user? This action cannot be undone.",
      confirmText: "Revoke",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      return;
    }

    setRevokingPermission(permissionId);
    try {
      await revokeFilePermissionMutation.mutateAsync(permissionId);

      // Invalidate cache to refresh the list
      queryClient.invalidateQueries({
        queryKey: userKeys.usersWithAccess(userId),
      });
    } catch (error: any) {
      alert(`Failed to revoke permission: ${error.message}`);
    } finally {
      setRevokingPermission(null);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#666",
        }}
      >
        Loading users with access...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#ff4444",
        }}
      >
        Error loading users with access
      </div>
    );
  }

  const users = data?.users || [];
  const meta = data?.meta;

  if (users.length === 0) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#666",
          border: "1px dashed #ccc",
          borderRadius: "4px",
        }}
      >
        No users have been granted access to your resources yet.
      </div>
    );
  }

  const getRoleBadgeColor = (role: PermissionRole) => {
    switch (role) {
      case "OWNER":
        return { bg: "#ff9800", color: "#fff" };
      case "EDITOR":
        return { bg: "#2196f3", color: "#fff" };
      case "VIEWER":
        return { bg: "#4caf50", color: "#fff" };
      default:
        return { bg: "#999", color: "#fff" };
    }
  };

  return (
    <div>
      <div
        style={{
          marginBottom: "1rem",
          fontSize: "0.875rem",
          color: "#666",
        }}
      >
        Showing {users.length} of {meta?.total || 0} users
      </div>

      {/* Users List */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {users.map((userAccess: IUserWithAccess, index) => (
          <div
            key={userAccess.userId}
            style={{
              padding: "1.5rem",
              borderBottom:
                index < users.length - 1 ? "1px solid #eee" : "none",
            }}
          >
            {/* User Info */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1rem",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontWeight: "600", fontSize: "1rem" }}>
                  {userAccess.userName}
                </div>
                <div style={{ color: "#666", fontSize: "0.875rem" }}>
                  {userAccess.userEmail}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    backgroundColor: "#f5f5f5",
                    color: "#666",
                  }}
                >
                  {userAccess.totalFolders} folder(s)
                </div>
                <div
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    backgroundColor: "#f5f5f5",
                    color: "#666",
                  }}
                >
                  {userAccess.totalFiles} file(s)
                </div>
              </div>
            </div>

            {/* Folders */}
            {userAccess.folders.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  📁 Folders ({userAccess.folders.length})
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {userAccess.folders.map((folder) => {
                    const roleColors = getRoleBadgeColor(folder.role);
                    // @ts-ignore - permissionId should be added to backend response
                    const permissionId =
                      folder.permissionId ||
                      `${folder.folderId}-${userAccess.userId}`;
                    const isRevoking = revokingPermission === permissionId;

                    return (
                      <div
                        key={folder.folderId}
                        style={{
                          padding: "0.5rem 0.75rem",
                          backgroundColor: "#f9f9f9",
                          borderRadius: "4px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "150px" }}>
                          <div
                            style={{ fontSize: "0.875rem", fontWeight: "500" }}
                          >
                            {folder.folderName}
                          </div>
                          {folder.folderDescription && (
                            <div style={{ fontSize: "0.75rem", color: "#666" }}>
                              {folder.folderDescription}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "3px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              backgroundColor: roleColors.bg,
                              color: roleColors.color,
                            }}
                          >
                            {folder.role}
                          </span>
                          <button
                            onClick={() =>
                              handleRevokeFolderPermission(
                                permissionId,
                                folder.folderName
                              )
                            }
                            disabled={isRevoking}
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.7rem",
                              border: "1px solid #f44336",
                              borderRadius: "3px",
                              cursor: isRevoking ? "not-allowed" : "pointer",
                              backgroundColor: isRevoking ? "#ffcdd2" : "#fff",
                              color: "#f44336",
                              fontWeight: "500",
                              transition: "all 0.2s",
                              opacity: isRevoking ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isRevoking) {
                                e.currentTarget.style.backgroundColor =
                                  "#ffebee";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isRevoking) {
                                e.currentTarget.style.backgroundColor = "#fff";
                              }
                            }}
                          >
                            {isRevoking ? "Revoking..." : "Revoke"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Files */}
            {userAccess.files.length > 0 && (
              <div>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  📄 Files ({userAccess.files.length})
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {userAccess.files.map((file) => {
                    const roleColors = getRoleBadgeColor(file.role);
                    // @ts-ignore - permissionId should be added to backend response
                    const permissionId =
                      file.permissionId ||
                      `${file.fileId}-${userAccess.userId}`;
                    const isRevoking = revokingPermission === permissionId;

                    return (
                      <div
                        key={file.fileId}
                        style={{
                          padding: "0.5rem 0.75rem",
                          backgroundColor: "#f9f9f9",
                          borderRadius: "4px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "150px" }}>
                          <div
                            style={{ fontSize: "0.875rem", fontWeight: "500" }}
                          >
                            {file.fileName}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#666" }}>
                            {file.fileOriginalName} • {file.fileMimeType}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "3px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              backgroundColor: roleColors.bg,
                              color: roleColors.color,
                            }}
                          >
                            {file.role}
                          </span>
                          <button
                            onClick={() =>
                              handleRevokeFilePermission(
                                permissionId,
                                file.fileName
                              )
                            }
                            disabled={isRevoking}
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.7rem",
                              border: "1px solid #f44336",
                              borderRadius: "3px",
                              cursor: isRevoking ? "not-allowed" : "pointer",
                              backgroundColor: isRevoking ? "#ffcdd2" : "#fff",
                              color: "#f44336",
                              fontWeight: "500",
                              transition: "all 0.2s",
                              opacity: isRevoking ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isRevoking) {
                                e.currentTarget.style.backgroundColor =
                                  "#ffebee";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isRevoking) {
                                e.currentTarget.style.backgroundColor = "#fff";
                              }
                            }}
                          >
                            {isRevoking ? "Revoking..." : "Revoke"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="secondary"
            size="small"
          >
            Previous
          </Button>
          <span style={{ fontSize: "0.875rem" }}>
            Page {page} of {meta.totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            variant="secondary"
            size="small"
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
