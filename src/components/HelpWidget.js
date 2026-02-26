"use client";

import { useState } from "react";

const PLATFORMS = ["iOS (Safari)", "iOS (Chrome)", "Android (Chrome)", "Android (Other)", "Desktop (Chrome)", "Desktop (Safari)", "Desktop (Firefox)", "Desktop (Other)"];

export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!platform || !description.trim()) return;

    const subject = `Bug Report — ${platform}`;
    const body =
      `Platform: ${platform}\n` +
      `Page: ${typeof window !== "undefined" ? window.location.href : ""}\n` +
      `User Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}\n\n` +
      `Description:\n${description.trim()}`;

    window.location.href = `mailto:support@dailycompanion.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setPlatform("");
    setDescription("");
    setOpen(false);
  };

  return (
    <>
      {/* Pull tab on right edge */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          padding: "12px 6px",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.5px",
          color: "#fff",
          background: "#6366f1",
          border: "none",
          borderRadius: "8px 0 0 8px",
          cursor: "pointer",
          zIndex: 10000,
          boxShadow: "-2px 0 8px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
        aria-label="Report a bug"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(90deg)" }}>
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        Report Bug
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 10001,
            transition: "opacity 0.2s",
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(380px, 85vw)",
          background: "#fff",
          zIndex: 10002,
          boxShadow: open ? "-8px 0 30px rgba(0,0,0,0.15)" : "none",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
              Report a Bug
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              We&apos;ll look into it as soon as possible.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af" }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                color: platform ? "#1a1a1a" : "#9ca3af",
                background: "#fff",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="" disabled>Select your platform</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              What happened?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe the issue in detail — what you were doing, what you expected, and what went wrong."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                color: "#1a1a1a",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                flex: 1,
                minHeight: 120,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!platform || !description.trim()}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              background: !platform || !description.trim() ? "#d1d5db" : "#6366f1",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: !platform || !description.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            Open in Mail App
          </button>
        </form>
      </div>
    </>
  );
}
