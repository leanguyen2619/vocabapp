"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary — catches failures in the root layout itself (not just page
 * content), so it must define its own <html>/<body> and cannot depend on anything the root
 * layout normally provides (LocaleProvider, globals.css custom properties, fonts). Kept
 * intentionally plain/self-contained rather than reusing error.tsx's styling.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#ffffff",
          color: "#1a1a1a",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Đã có lỗi xảy ra</h1>
        <p style={{ fontSize: "14px", color: "#666666", maxWidth: "360px", margin: 0 }}>
          Rất tiếc, trang không thể tải được. Vui lòng thử lại.
        </p>
        {error.digest && (
          <p style={{ fontSize: "12px", color: "#999999", margin: 0 }}>Mã lỗi: {error.digest}</p>
        )}
        <button
          onClick={() => unstable_retry()}
          style={{
            marginTop: "8px",
            padding: "8px 20px",
            borderRadius: "8px",
            border: "1px solid #d4d4d4",
            backgroundColor: "#ffffff",
            color: "#1a1a1a",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Thử lại
        </button>
      </body>
    </html>
  );
}
