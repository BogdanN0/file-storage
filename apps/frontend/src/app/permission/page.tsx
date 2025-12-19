"use client";

import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { apiHooks } from "../api/hooks";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { Loading } from "../components/Loading";
import { Button } from "../components/Button";
import { UserSelector } from "../components/UserSelector";
import { LibrarySelector } from "../components/LibrarySelector";
import { UsersWithAccessList } from "../components/UsersWithAccessList";
import { IUserPublic, PermissionRole } from "@monorepo/shared";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "../api/hooks";

type LibraryItem = {
  id: string;
  name: string;
  type: "folder" | "file";
  description?: string | null;
};

export default function PermissionPage() {
  const logoutMutation = apiHooks.auth.useLogout();
  const { user, isLoading } = useRequireAuth();
  const queryClient = useQueryClient();

  const [selectedUsers, setSelectedUsers] = useState<IUserPublic[]>([]);
  const [selectedItems, setSelectedItems] = useState<LibraryItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<PermissionRole>("VIEWER");
  const [isGranting, setIsGranting] = useState(false);
  const [grantResult, setGrantResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const batchGrantFoldersMutation =
    apiHooks.permissions.useBatchGrantMultipleFolders();
  const batchGrantFilesMutation =
    apiHooks.permissions.useBatchGrantMultipleFiles();

  const handleGrantPermissions = async () => {
    if (selectedUsers.length === 0 || selectedItems.length === 0) {
      setGrantResult({
        success: false,
        message: "Please select at least one user and one folder/file",
      });
      return;
    }

    setIsGranting(true);
    setGrantResult(null);

    try {
      const userIds = selectedUsers.map((u) => u.id);
      const folderIds = selectedItems
        .filter((i) => i.type === "folder")
        .map((i) => i.id);
      const fileIds = selectedItems
        .filter((i) => i.type === "file")
        .map((i) => i.id);

      const promises = [];

      if (folderIds.length > 0) {
        promises.push(
          batchGrantFoldersMutation.mutateAsync({
            folderIds,
            userIds,
            role: selectedRole,
          })
        );
      }

      if (fileIds.length > 0) {
        promises.push(
          batchGrantFilesMutation.mutateAsync({
            fileIds,
            userIds,
            role: selectedRole,
          })
        );
      }

      await Promise.all(promises);

      setGrantResult({
        success: true,
        message: `Successfully granted ${selectedRole} access to ${selectedUsers.length} user(s) for ${selectedItems.length} item(s)`,
      });

      // Invalidate cache to refresh users with access list
      if (user) {
        queryClient.invalidateQueries({
          queryKey: userKeys.usersWithAccess(user.id),
        });
      }

      // Clear selections after success
      setSelectedUsers([]);
      setSelectedItems([]);
    } catch (error: any) {
      setGrantResult({
        success: false,
        message: error.message || "Failed to grant permissions",
      });
    } finally {
      setIsGranting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const folderCount = selectedItems.filter((i) => i.type === "folder").length;
  const fileCount = selectedItems.filter((i) => i.type === "file").length;

  return (
    <>
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
          <h1
            style={{
              margin: "0 0 16px 0",
              fontSize: "32px",
            }}
          >
            Permissions
          </h1>
        </div>

        {/* Grant Permissions Section */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "2rem",
            marginBottom: "3rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1.5rem",
            }}
          >
            Grant New Permissions
          </h2>

          {/* Selection Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            {/* User Selector */}
            <div>
              <UserSelector
                selectedUsers={selectedUsers}
                onUsersChange={setSelectedUsers}
              />
            </div>

            {/* Library Selector */}
            <div>
              <LibrarySelector
                selectedItems={selectedItems}
                onItemsChange={setSelectedItems}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                marginBottom: "0.75rem",
                fontSize: "1.125rem",
                fontWeight: "600",
              }}
            >
              Select Permission Level
            </h3>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setSelectedRole("VIEWER")}
                style={{
                  padding: "0.75rem 1.25rem",
                  fontSize: "0.875rem",
                  border: "2px solid",
                  borderColor: selectedRole === "VIEWER" ? "#4caf50" : "#ccc",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedRole === "VIEWER" ? "#e8f5e9" : "#fff",
                  color: selectedRole === "VIEWER" ? "#2e7d32" : "#666",
                  fontWeight: selectedRole === "VIEWER" ? "600" : "400",
                  transition: "all 0.2s",
                }}
              >
                👁️ VIEWER
                <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                  Can view only
                </div>
              </button>
              <button
                onClick={() => setSelectedRole("EDITOR")}
                style={{
                  padding: "0.75rem 1.25rem",
                  fontSize: "0.875rem",
                  border: "2px solid",
                  borderColor: selectedRole === "EDITOR" ? "#2196f3" : "#ccc",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedRole === "EDITOR" ? "#e3f2fd" : "#fff",
                  color: selectedRole === "EDITOR" ? "#1565c0" : "#666",
                  fontWeight: selectedRole === "EDITOR" ? "600" : "400",
                  transition: "all 0.2s",
                }}
              >
                ✏️ EDITOR
                <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                  Can view & edit
                </div>
              </button>
              <button
                onClick={() => setSelectedRole("OWNER")}
                style={{
                  padding: "0.75rem 1.25rem",
                  fontSize: "0.875rem",
                  border: "2px solid",
                  borderColor: selectedRole === "OWNER" ? "#ff9800" : "#ccc",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor:
                    selectedRole === "OWNER" ? "#fff3e0" : "#fff",
                  color: selectedRole === "OWNER" ? "#e65100" : "#666",
                  fontWeight: selectedRole === "OWNER" ? "600" : "400",
                  transition: "all 0.2s",
                }}
              >
                👑 OWNER
                <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                  Full control
                </div>
              </button>
            </div>
          </div>

          {/* Summary */}
          {(selectedUsers.length > 0 || selectedItems.length > 0) && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f5f5f5",
                borderRadius: "6px",
                marginBottom: "1.5rem",
                fontSize: "0.875rem",
                color: "#666",
              }}
            >
              <strong>Summary:</strong> Grant <strong>{selectedRole}</strong>{" "}
              access to <strong>{selectedUsers.length}</strong> user(s) for{" "}
              <strong>{folderCount}</strong> folder(s) and{" "}
              <strong>{fileCount}</strong> file(s)
            </div>
          )}

          {/* Result Message */}
          {grantResult && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "6px",
                marginBottom: "1.5rem",
                backgroundColor: grantResult.success ? "#e8f5e9" : "#ffebee",
                color: grantResult.success ? "#2e7d32" : "#c62828",
                border: `1px solid ${
                  grantResult.success ? "#4caf50" : "#f44336"
                }`,
              }}
            >
              {grantResult.success ? "✓" : "✕"} {grantResult.message}
            </div>
          )}

          {/* Grant Button */}
          <Button
            onClick={handleGrantPermissions}
            disabled={
              isGranting ||
              selectedUsers.length === 0 ||
              selectedItems.length === 0
            }
            variant="success"
            size="large"
            fullWidth
          >
            {isGranting
              ? "Granting Permissions..."
              : `Grant ${selectedRole} Access`}
          </Button>
        </div>

        {/* Users With Access Section */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "2rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1.5rem",
            }}
          >
            Users With Access to Your Resources
          </h2>
          {user && <UsersWithAccessList userId={user.id} />}
        </div>
      </div>
    </>
  );
}
