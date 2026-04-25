"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          backgroundColor: "#0a0e17",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>
          Something went wrong
        </h2>
        <p style={{ color: "#9ca3af", marginBottom: "24px", fontSize: "14px" }}>
          Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            backgroundColor: "#14b8a6",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 24px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}