import Skeleton from "@/components/Skeleton";

export default function WalletLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Skeleton style={{ width: 180, height: 28, marginBottom: "0.5rem" }} />
        <Skeleton style={{ width: 220, height: 16 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 92, borderRadius: 12 }} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton style={{ height: 150, borderRadius: "12px 12px 0 0" }} />
            <div style={{ border: "1px solid var(--c-border)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "1rem 1.1rem" }}>
              <Skeleton style={{ width: "50%", height: 14, marginBottom: "0.5rem" }} />
              <Skeleton style={{ width: "70%", height: 20, marginBottom: "0.75rem" }} />
              <Skeleton style={{ width: "100%", height: 36 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
