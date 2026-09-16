"use client";

import { useState, useCallback } from "react";
import { ImagePlus } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  style?: React.CSSProperties;
};

// Renders the illustration at `src` once it exists; until then (or if it 404s)
// shows a placeholder so the storytelling section still looks finished.
// Drop a matching file (e.g. from storyset.com) at that path and it appears automatically.
export default function StoryImage({ src, alt, style }: Props) {
  const [errored, setErrored] = useState(false);

  // A 404 on an SSR'd <img> can fire before hydration attaches onError, so
  // that alone misses it — check the already-settled state via the ref callback too.
  const checkAlreadyBroken = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) setErrored(true);
  }, []);

  if (errored) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
          aspectRatio: "4 / 3",
          borderRadius: 18,
          border: "1.5px dashed var(--c-border)",
          background: "var(--c-surface)",
          color: "var(--c-text-tertiary)",
          ...style,
        }}
      >
        <ImagePlus size={28} strokeWidth={1.5} />
        <span style={{ fontSize: "0.75rem", textAlign: "center", padding: "0 1.5rem" }}>
          Ilustración pendiente<br />({src})
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={checkAlreadyBroken}
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "contain", ...style }}
    />
  );
}
