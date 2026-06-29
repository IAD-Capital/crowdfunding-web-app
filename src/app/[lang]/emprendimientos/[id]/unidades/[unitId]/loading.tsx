import Skeleton from "@/components/Skeleton";

export default function UnitLoading() {
  return (
    <div style={{ background: "var(--c-bg)" }}>
      {/* Hero cover */}
      <Skeleton style={{ height: 320, borderRadius: 0 }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 320px", gap: "2.5rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Skeleton style={{ width: 90, height: 28, borderRadius: 999 }} />
            <Skeleton style={{ width: 90, height: 28, borderRadius: 999 }} />
            <Skeleton style={{ width: 90, height: 28, borderRadius: 999 }} />
          </div>
          <Skeleton style={{ width: "100%", height: 16 }} />
          <Skeleton style={{ width: "90%", height: 16 }} />
          <Skeleton style={{ width: "100%", height: 240, borderRadius: 14 }} />
        </div>

        {/* Buy panel */}
        <Skeleton style={{ height: 280, borderRadius: 16 }} />
      </div>
    </div>
  );
}
