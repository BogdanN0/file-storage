"use client";

import { useState } from "react";
import type { ISession } from "@monorepo/shared";
import { Button } from "./Button";

interface SessionCardProps {
  session: ISession;
  onDelete: () => void;
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await onDelete();
    } catch (error) {
      console.error("Failed to delete session:", error);
      setIsDeleting(false);
    }
  };

  const getDeviceInfo = (
    userAgent: string | null
  ): { device: string; browser: string } => {
    if (!userAgent)
      return { device: "Unknown Device", browser: "Unknown Browser" };

    let device = "Desktop";
    let browser = "Unknown";

    // Detect device
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      device = "iOS Device";
    } else if (userAgent.includes("Android")) {
      device = "Android Device";
    } else if (userAgent.includes("Mobile")) {
      device = "Mobile Device";
    } else if (userAgent.includes("Macintosh")) {
      device = "Mac";
    } else if (userAgent.includes("Windows")) {
      device = "Windows";
    } else if (userAgent.includes("Linux")) {
      device = "Linux";
    }

    // Detect browser
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      browser = "Chrome";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browser = "Safari";
    } else if (userAgent.includes("Firefox")) {
      browser = "Firefox";
    } else if (userAgent.includes("Edg")) {
      browser = "Edge";
    }

    return { device, browser };
  };

  const formatLastActivity = (lastActivity: Date | string): string => {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const { device, browser } = getDeviceInfo(session.userAgent);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#000",
              marginBottom: "0.5rem",
            }}
          >
            {device} · {browser}
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#666",
              marginBottom: "0.25rem",
            }}
          >
            IP: {session.ipAddress || "Unknown"}
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#666",
            }}
          >
            Last active: {formatLastActivity(session.lastActivity)}
          </div>
        </div>

        <Button onClick={handleDelete} disabled={isDeleting} variant="danger">
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>

      {/* Session Details (collapsible info) */}
      <details
        style={{
          fontSize: "0.75rem",
          color: "#999",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            userSelect: "none",
            fontWeight: "500",
          }}
        >
          Technical Details
        </summary>
        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            fontFamily: "monospace",
            wordBreak: "break-all",
          }}
        >
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>Session ID:</strong> {session.id}
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>Created:</strong>{" "}
            {new Date(session.createdAt).toLocaleString()}
          </div>
          {session.userAgent && (
            <div>
              <strong>User Agent:</strong> {session.userAgent}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
