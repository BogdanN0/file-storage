"use client";

import { NavButton } from "../components/NavButton";
import { Navbar } from "../components/Navbar";
import { SessionCard } from "../components/SessionCard";
import { StatCard } from "../components/StatCard";
import { apiHooks } from "../api/hooks";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { Loading } from "../components/Loading";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";

export default function AccountPage() {
  const { user, isLoading } = useRequireAuth();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const logoutMutation = apiHooks.auth.useLogout();
  const deleteSessionMutation = apiHooks.users.useDeleteSession();
  const { data: sessionData, isLoading: sessionsLoading } =
    apiHooks.users.useUserSessions(user?.id);
  const { data: stats, isLoading: statsLoading } = apiHooks.users.useUserStats(
    user?.id
  );

  const handleDeleteSession = async (sessionId: string) => {
    if (!user?.id) return;

    const confirmed = await confirm({
      title: "Delete Session",
      message:
        "Are you sure you want to delete this session? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    await deleteSessionMutation.mutateAsync({
      userId: user.id,
      sessionId,
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  // Extract sessions array from response
  const sessions = sessionData || [];

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
        {/* Page Title */}
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "600",
            marginBottom: "2rem",
            marginTop: 0,
          }}
        >
          Account
        </h1>

        {/* User Information Section */}
        <section style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              marginBottom: "1rem",
              marginTop: 0,
            }}
          >
            User Information
          </h2>
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "1rem",
              }}
            >
              <InfoRow label="ID" value={user?.id} />
              <InfoRow label="Name" value={user?.name} />
              <InfoRow label="Email" value={user?.email} />
              <InfoRow
                label="Member Since"
                value={
                  user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"
                }
              />
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              marginBottom: "1rem",
              marginTop: 0,
            }}
          >
            Statistics
          </h2>
          {statsLoading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              Loading statistics...
            </div>
          ) : stats ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              <StatCard label="Folders" value={stats.foldersCount} />
              <StatCard label="Files" value={stats.filesCount} />
              <StatCard label="Active Sessions" value={stats.sessionsCount} />
            </div>
          ) : null}
        </section>

        {/* Active Sessions Section */}
        <section>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              marginBottom: "1rem",
              marginTop: 0,
            }}
          >
            Active Sessions
          </h2>
          {sessionsLoading ? (
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "2rem",
                textAlign: "center",
                color: "#666",
              }}
            >
              Loading sessions...
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {sessions.length === 0 ? (
                <div
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "2rem",
                    textAlign: "center",
                    color: "#666",
                  }}
                >
                  No active sessions
                </div>
              ) : (
                sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onDelete={() => handleDeleteSession(session.id)}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </div>
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}

// Helper component for user info rows
function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
    >
      <span
        style={{
          fontSize: "0.875rem",
          color: "#666",
          fontWeight: "500",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "1rem",
          color: "#000",
          wordBreak: "break-all",
        }}
      >
        {value || "N/A"}
      </span>
    </div>
  );
}
