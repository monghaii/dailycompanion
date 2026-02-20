"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const OPTED_OUT_KEY = "ph_opted_out";
const NOTICE_DISMISSED_KEY = "ph_notice_dismissed";

function hasOptedOut() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(OPTED_OUT_KEY) === "1";
}

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_POSTHOG_KEY &&
  !posthog.__loaded &&
  !isLocalhost &&
  !hasOptedOut()
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/a",
    ui_host: "https://us.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
  });
}

const BLACKLISTED_EMAILS = [
  "testuseriv@test.com",
  "matt@twinleaf.studio",
  "hello@twinleaf.studio",
];

export function posthogIdentifyIfAllowed(userId, props = {}) {
  if (isLocalhost || hasOptedOut()) return;
  if (props.email && BLACKLISTED_EMAILS.includes(props.email.toLowerCase())) {
    posthog.opt_out_capturing();
    return;
  }
  posthog.identify(userId, props);
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph && !isLocalhost && !hasOptedOut()) {
      let url = window.origin + pathname;
      const search = searchParams?.toString();
      if (search) url += "?" + search;
      ph.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

function PrivacyNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(NOTICE_DISMISSED_KEY);
    const optedOut = localStorage.getItem(OPTED_OUT_KEY);
    if (!dismissed && !optedOut) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(NOTICE_DISMISSED_KEY, "1");
    setVisible(false);
  };

  const optOut = () => {
    localStorage.setItem(OPTED_OUT_KEY, "1");
    localStorage.setItem(NOTICE_DISMISSED_KEY, "1");
    posthog.opt_out_capturing();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99998,
        backgroundColor: "#f9fafb",
        color: "#6b7280",
        padding: "12px 24px",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        flexWrap: "wrap",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <span style={{ textAlign: "center" }}>
        We use cookies to improve your experience.{" "}
        <a
          href="/privacy"
          style={{ color: "#9ca3af", textDecoration: "underline" }}
        >
          Learn more
        </a>
      </span>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={optOut}
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            fontSize: "12px",
            cursor: "pointer",
            padding: "5px 10px",
          }}
        >
          Opt out
        </button>
        <button
          onClick={dismiss}
          style={{
            background: "#fbbf24",
            border: "none",
            color: "#000000",
            borderRadius: "6px",
            padding: "6px 20px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function PostHogProvider({ children }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || isLocalhost) {
    return (
      <>
        <PrivacyNotice />
        {children}
      </>
    );
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PrivacyNotice />
      {children}
    </PHProvider>
  );
}
