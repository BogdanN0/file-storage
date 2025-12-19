"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { apiHooks } from "../api/hooks";
import { IUserPublic } from "@monorepo/shared";

interface UserSelectorProps {
  selectedUsers: IUserPublic[];
  onUsersChange: (users: IUserPublic[]) => void;
}

export function UserSelector({
  selectedUsers,
  onUsersChange,
}: UserSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults, isLoading } = apiHooks.users.useSearchUsers({
    query: searchQuery,
    page: 1,
    limit: 20,
  });

  const handleUserToggle = (user: IUserPublic) => {
    const isSelected = selectedUsers.some((u) => u.id === user.id);
    if (isSelected) {
      onUsersChange(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      onUsersChange([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    onUsersChange(selectedUsers.filter((u) => u.id !== userId));
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3
        style={{
          marginBottom: "1rem",
          fontSize: "1.125rem",
          fontWeight: "600",
        }}
      >
        Select Users
      </h3>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#666",
              marginBottom: "0.5rem",
            }}
          >
            Selected: {selectedUsers.length} user
            {selectedUsers.length !== 1 ? "s" : ""}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                }}
              >
                <span>{user.name}</span>
                <span style={{ color: "#666" }}>({user.email})</span>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    color: "#666",
                  }}
                  aria-label={`Remove ${user.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <SearchBar
        onSearch={setSearchQuery}
        onClear={() => setSearchQuery("")}
        placeholder="Search users by email or name..."
      />

      {/* Search Results */}
      {searchQuery && (
        <div
          style={{
            marginTop: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            maxHeight: "300px",
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

          {!isLoading && searchResults?.users.length === 0 && (
            <div
              style={{ padding: "1rem", textAlign: "center", color: "#666" }}
            >
              No users found
            </div>
          )}

          {!isLoading &&
            searchResults?.users.map((user) => {
              const isSelected = selectedUsers.some((u) => u.id === user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => handleUserToggle(user)}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#f0f8ff" : "transparent",
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
                      <div style={{ fontWeight: "500" }}>{user.name}</div>
                      <div style={{ fontSize: "0.875rem", color: "#666" }}>
                        {user.email}
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ color: "#1976d2", fontSize: "1.25rem" }}>
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
  );
}
