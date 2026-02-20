"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { posthogIdentifyIfAllowed } from "@/components/PostHogProvider";

function LoginContent({ coachSlug, initialCoachData }) {
  const router = useRouter();
  // const searchParams = useSearchParams(); // No longer needed for slug

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [coachData, setCoachData] = useState(initialCoachData);
  const [isCheckingTheme, setIsCheckingTheme] = useState(
    !initialCoachData && !!coachSlug,
  );

  useEffect(() => {
    // Clear any existing session
    fetch("/api/auth/logout", { method: "POST" });

    if (!initialCoachData && coachSlug) {
      fetchCoachData();
    } else {
      setIsCheckingTheme(false);
    }
  }, [coachSlug, initialCoachData]);

  const fetchCoachData = async () => {
    try {
      const response = await fetch(`/api/landing/${coachSlug}`);
      if (response.ok) {
        const data = await response.json();
        setCoachData(data);
      }
    } catch (err) {
      console.error("Failed to fetch coach data:", err);
    } finally {
      setIsCheckingTheme(false);
    }
  };

  // Auto-fill test credentials if available
  useEffect(() => {
    const devUsername = process.env.NEXT_PUBLIC_DEV_ONLY_USER_USERNAME;
    const devPassword = process.env.NEXT_PUBLIC_DEV_ONLY_USER_PASSWORD;

    if (devUsername && devPassword) {
      setFormData({
        email: devUsername,
        password: devPassword,
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      if (data.profile) {
        posthogIdentifyIfAllowed(data.profile.id, {
          email: formData.email,
          role: data.profile.role,
          coach_id: data.profile.coach_id || undefined,
        });
        posthog.capture("user_logged_in", {
          role: data.profile.role,
        });
      }

      // Determine redirect path
      let redirectPath;
      if (data.profile.role === "coach") {
        redirectPath = "/dashboard";
      } else {
        // All end users go to /user/dashboard regardless of coach slug
        redirectPath = "/user/dashboard";
      }

      // Small delay to ensure cookie is set, then redirect
      await new Promise((resolve) => setTimeout(resolve, 100));
      window.location.href = redirectPath;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const businessName = coachData?.coach?.business_name;
  const coachLogoUrl = coachData?.coach?.logo_url || null;
  const primaryColor =
    coachData?.coach?.primary_color ||
    coachData?.branding?.primary_color ||
    "#2563eb";

  // Set dynamic favicon and page title from coach branding
  useEffect(() => {
    if (!businessName) return;

    document.title = `Log In - ${businessName} | Daily Companion`;

    if (coachLogoUrl) {
      document
        .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
        .forEach((el) => el.remove());
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = coachLogoUrl;
      document.head.appendChild(link);
    }

    return () => {
      document.title = "Daily Companion";
      document
        .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
        .forEach((el) => el.remove());
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = "/favicon.ico";
      document.head.appendChild(link);
    };
  }, [businessName, coachLogoUrl]);
  const logoUrl =
    coachData?.coach?.app_logo_url || coachData?.branding?.app_logo_url || null;
  const logoSize =
    coachData?.coach?.app_logo_size ||
    coachData?.branding?.app_logo_size ||
    "medium";

  // Size mapping
  const getSizeStyle = (size) => {
    switch (size) {
      case "small":
        return { maxWidth: "120px", height: "auto" };
      case "large":
        return { maxWidth: "240px", height: "auto" };
      default:
        return { maxWidth: "180px", height: "auto" }; // medium
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#fff",
    color: "#111827",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
  };

  if (isCheckingTheme) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#6b7280" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "20px",
              fontWeight: 600,
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName || "Logo"}
                style={{
                  ...getSizeStyle(logoSize),
                  marginBottom: "16px",
                  objectFit: "contain",
                }}
              />
            ) : businessName ? (
              <span
                style={{
                  color: primaryColor,
                  fontSize: "28px",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                {businessName}
              </span>
            ) : null}
          </Link>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginTop: "12px",
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: "#6b7280", fontSize: "16px" }}>
            Sign in to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "#fff",
            padding: "32px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <label style={labelStyle}>Password</label>
              <Link
                href={
                  coachSlug
                    ? `/forgot-password?coach=${coachSlug}`
                    : "/forgot-password"
                }
                style={{
                  fontSize: "14px",
                  color: primaryColor,
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "16px",
              fontWeight: 500,
              backgroundColor: primaryColor,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            Don't have an account?{" "}
            <Link
              href={coachSlug ? `/signup?coach=${coachSlug}` : "/signup"}
              style={{ color: primaryColor, textDecoration: "none" }}
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function UserLogin({ coachSlug, initialCoachData }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent coachSlug={coachSlug} initialCoachData={initialCoachData} />
    </Suspense>
  );
}
