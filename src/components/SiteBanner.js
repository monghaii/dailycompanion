"use client";

import { useState, useEffect } from "react";

const WarningIcon = ({ color }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M8.572 3.802L1.536 15.998A1.65 1.65 0 003.002 18.5h14.002a1.65 1.65 0 001.466-2.502L11.434 3.802a1.65 1.65 0 00-2.862 0z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 7.5v3.333" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="13.75" r="0.75" fill={color} />
  </svg>
);

const InfoIcon = ({ color }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <circle cx="10" cy="10" r="8.25" stroke={color} strokeWidth="1.5" />
    <path d="M10 9v4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="6.75" r="0.75" fill={color} />
  </svg>
);

const CloseIcon = ({ color }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 4l8 8M12 4l-8 8"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const BANNER_STYLES = {
  error: {
    bg: "#fef2f2",
    border: "#fecaca",
    text: "#991b1b",
    Icon: WarningIcon,
  },
  warning: {
    bg: "#fffbeb",
    border: "#fde68a",
    text: "#92400e",
    Icon: WarningIcon,
  },
  info: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1e40af",
    Icon: InfoIcon,
  },
};

export default function SiteBanner() {
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed this banner in this session
    const dismissedId = sessionStorage.getItem("dismissed_banner_id");

    fetch("/api/site-banner")
      .then((res) => res.json())
      .then((data) => {
        if (data.banner && data.banner.id !== dismissedId) {
          setBanner(data.banner);
        }
      })
      .catch(() => {
        // Silently fail — don't block the app for a banner
      });
  }, []);

  if (!banner || dismissed) return null;

  const style = BANNER_STYLES[banner.banner_type] || BANNER_STYLES.error;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 99999,
        backgroundColor: style.bg,
        borderBottom: `1px solid ${style.border}`,
        color: style.text,
        padding: "10px 16px",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      <style.Icon color={style.text} />
      <span style={{ textAlign: "center", flex: 1 }}>{banner.message}</span>
      <button
        onClick={() => {
          setDismissed(true);
          sessionStorage.setItem("dismissed_banner_id", banner.id);
        }}
        style={{
          background: "none",
          border: "none",
          color: style.text,
          cursor: "pointer",
          fontSize: "18px",
          lineHeight: 1,
          padding: "4px 8px",
          opacity: 0.7,
          flexShrink: 0,
        }}
        aria-label="Dismiss banner"
      >
        <CloseIcon color={style.text} />
      </button>
    </div>
  );
}
