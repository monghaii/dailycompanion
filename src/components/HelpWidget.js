"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const PLATFORMS = ["iOS (Safari)", "iOS (Chrome)", "Android (Chrome)", "Android (Other)", "Desktop (Chrome)", "Desktop (Safari)", "Desktop (Firefox)", "Desktop (Other)"];

export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const btnRef = useRef(null);
  const hasMoved = useRef(false);

  useEffect(() => {
    setPosition({ x: window.innerWidth - 68, y: window.innerHeight - 160 });
  }, []);

  const onPointerDown = useCallback((e) => {
    if (!btnRef.current) return;
    dragging.current = true;
    hasMoved.current = false;
    const rect = btnRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    btnRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    hasMoved.current = true;
    const x = Math.max(0, Math.min(window.innerWidth - 48, e.clientX - dragOffset.current.x));
    const y = Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragOffset.current.y));
    setPosition({ x, y });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

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

  if (!position) return null;

  return (
    <>
      {/* Floating button */}
      <button
        ref={btnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => {
          onPointerUp(e);
          if (!hasMoved.current) setOpen((o) => !o);
        }}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#6366f1",
          color: "#fff",
          border: "none",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          cursor: "grab",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: "none",
          transition: dragging.current ? "none" : "box-shadow 0.2s",
        }}
        aria-label="Report a bug"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </button>

      {/* Form overlay */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 10001,
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: "min(360px, calc(100vw - 48px))",
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
              zIndex: 10002,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ padding: "20px 20px 0" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
                Report a Bug
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                We&apos;ll look into it as soon as possible.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
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

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  What happened?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the issue in detail — what you were doing, what you expected, and what went wrong."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    color: "#1a1a1a",
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit",
                    minHeight: 80,
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
      )}
    </>
  );
}
