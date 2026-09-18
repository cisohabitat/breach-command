"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Breach Command stopped unexpectedly.", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "48px 20px",
        background: "#101817",
        color: "#e7ede8",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: "520px" }}>
        <p style={{ fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: "0.75rem", letterSpacing: "0.09em", color: "#9eafa6", margin: 0 }}>
          BREACH COMMAND <span aria-hidden="true">/</span> UNEXPECTED FAULT
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 500, letterSpacing: "-0.03em", margin: "16px 0 12px" }}>
          The console stopped responding.
        </h1>
        <p style={{ color: "#aebfb3", lineHeight: 1.7, margin: "0 0 24px" }}>
          This operation is saved on your device. Reloading returns you to the assignment screen with the current
          investigation intact.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: 46,
            width: "100%",
            border: 0,
            borderRadius: 6,
            background: "#c3ee8d",
            color: "#182214",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload the console
        </button>
      </div>
    </main>
  );
}
