"use client";

import Link from "next/link";

export default function PolicyFooter({ style = {} }) {
  return (
    <footer
      style={{
        borderTop: "1px solid #e5e7eb",
        padding: "20px 24px",
        textAlign: "center",
        fontSize: "13px",
        color: "#9ca3af",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/privacy" style={{ color: "#9ca3af", textDecoration: "none" }}>
          Privacy Policy
        </Link>
        <Link href="/terms" style={{ color: "#9ca3af", textDecoration: "none" }}>
          Terms of Use
        </Link>
        <Link href="/cookies" style={{ color: "#9ca3af", textDecoration: "none" }}>
          Cookie Policy
        </Link>
      </div>
    </footer>
  );
}
