interface StatCardProps {
  label: string;
  value: number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "2rem",
          fontWeight: "600",
          color: "#000",
          marginBottom: "0.5rem",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.875rem",
          color: "#666",
          fontWeight: "500",
        }}
      >
        {label}
      </div>
    </div>
  );
}
