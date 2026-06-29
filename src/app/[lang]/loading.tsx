import Skeleton from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <div style={{ background: "var(--c-bg)" }}>
      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem 2.5rem", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "3.5rem", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <Skeleton style={{ width: 220, height: 30 }} />
          <Skeleton style={{ width: "90%", height: 56 }} />
          <Skeleton style={{ width: "70%", height: 56 }} />
          <Skeleton style={{ width: "85%", height: 24, marginTop: "0.5rem" }} />
          <Skeleton style={{ width: "60%", height: 24 }} />
          <div style={{ display: "flex", gap: "0.85rem", marginTop: "0.5rem" }}>
            <Skeleton style={{ width: 180, height: 52, borderRadius: 11 }} />
            <Skeleton style={{ width: 160, height: 52, borderRadius: 11 }} />
          </div>
        </div>
        <Skeleton style={{ aspectRatio: "4 / 4.4", borderRadius: 22 }} />
      </section>

      {/* Stats strip */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem 3.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", border: "1px solid var(--c-border)", borderRadius: 18, overflow: "hidden" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: "1.4rem 1.6rem", background: "var(--c-surface)" }}>
              <Skeleton style={{ width: 70, height: 34, marginBottom: "0.4rem" }} />
              <Skeleton style={{ width: "80%", height: 16 }} />
            </div>
          ))}
        </div>
      </section>

      {/* Catalog grid */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <Skeleton style={{ width: 260, height: 32, margin: "0 auto 0.6rem" }} />
        <Skeleton style={{ width: 360, height: 18, margin: "0 auto 1.75rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 110, borderRadius: 14 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton style={{ height: 160, borderRadius: "14px 14px 0 0" }} />
              <div style={{ border: "1px solid var(--c-border)", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "1.1rem 1.2rem" }}>
                <Skeleton style={{ width: "60%", height: 22, marginBottom: "0.5rem" }} />
                <Skeleton style={{ width: "85%", height: 14, marginBottom: "0.75rem" }} />
                <Skeleton style={{ width: "100%", height: 38 }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
