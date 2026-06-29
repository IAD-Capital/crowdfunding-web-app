import Skeleton from "@/components/Skeleton";

export default function DevelopmentLoading() {
  return (
    <div style={{ background: "var(--c-bg)" }}>
      {/* Hero cover */}
      <Skeleton style={{ height: 360, borderRadius: 0 }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Info cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} style={{ height: 64, borderRadius: 10 }} />
            ))}
          </div>

          {/* Description */}
          <div>
            <Skeleton style={{ width: 160, height: 22, marginBottom: "0.75rem" }} />
            <Skeleton style={{ width: "100%", height: 16, marginBottom: "0.4rem" }} />
            <Skeleton style={{ width: "95%", height: 16, marginBottom: "0.4rem" }} />
            <Skeleton style={{ width: "70%", height: 16 }} />
          </div>

          {/* Units grid */}
          <div>
            <Skeleton style={{ width: 220, height: 22, marginBottom: "1rem" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton style={{ height: 130, borderRadius: "10px 10px 0 0" }} />
                  <div style={{ border: "1px solid var(--c-border)", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "0.9rem 1rem" }}>
                    <Skeleton style={{ width: "50%", height: 18 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column (sticky CTA) */}
        <div>
          <Skeleton style={{ height: 220, borderRadius: 16 }} />
        </div>
      </div>
    </div>
  );
}
