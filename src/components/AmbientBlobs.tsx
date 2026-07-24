// Slow-drifting ink-wash color blobs used as an ambient background layer.
// Purely decorative, aria-hidden, and respects prefers-reduced-motion via CSS.
export default function AmbientBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="ambient-blob ambient-blob-1"
        style={{
          width: "38vw",
          height: "38vw",
          top: "-10%",
          left: "-8%",
          background: "hsl(var(--vermillion) / 0.5)",
        }}
      />
      <div
        className="ambient-blob ambient-blob-2"
        style={{
          width: "32vw",
          height: "32vw",
          top: "30%",
          right: "-10%",
          background: "hsl(var(--indigo) / 0.5)",
        }}
      />
      <div
        className="ambient-blob ambient-blob-3"
        style={{
          width: "30vw",
          height: "30vw",
          bottom: "-12%",
          left: "20%",
          background: "hsl(var(--sage) / 0.5)",
        }}
      />
    </div>
  );
}
