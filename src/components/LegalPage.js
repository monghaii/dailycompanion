import Link from "next/link";

export default function LegalPage({ html }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "14px",
            color: "#6b7280",
            textDecoration: "none",
          }}
        >
          ← Back to Daily Companion
        </Link>
      </header>
      <main
        style={{
          flex: 1,
          maxWidth: "800px",
          margin: "0 auto",
          padding: "40px 24px",
          width: "100%",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <footer
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "24px",
          textAlign: "center",
          fontSize: "13px",
          color: "#9ca3af",
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/privacy" style={{ color: "#6b7280", textDecoration: "none" }}>
          Privacy Policy
        </Link>
        <Link href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>
          Terms of Use
        </Link>
        <Link href="/cookies" style={{ color: "#6b7280", textDecoration: "none" }}>
          Cookie Policy
        </Link>
      </footer>
    </div>
  );
}
