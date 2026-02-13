"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ForgotPasswordClient({ coachSlug, initialCoachData }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [coachData, setCoachData] = useState(initialCoachData);
  const [isCheckingTheme, setIsCheckingTheme] = useState(!initialCoachData && !!coachSlug);

  useEffect(() => {
    async function fetchCoachData() {
      try {
        if (!coachSlug) return;
        const res = await fetch(`/api/landing/${coachSlug}`);
        if (res.ok) {
          const data = await res.json();
          setCoachData(data);
        }
      } catch (err) {
        console.error("Failed to fetch coach theme:", err);
      } finally {
        setIsCheckingTheme(false);
      }
    }

    if (!initialCoachData && coachSlug) {
      fetchCoachData();
    } else {
      setIsCheckingTheme(false);
    }
  }, [coachSlug, initialCoachData]);

  // Branding derivation
  const branding = coachData?.branding || {};
  const coach = coachData?.coach || {};

  const businessName = coach.business_name || "dailycompanion";
  const appLogoUrl = branding.app_logo_url; // Use app logo
  const appLogoSize = branding.app_logo_size || 40;
  // Default to #2563eb (blue-600) if no theme color
  const primaryColor = branding.primary_color || coach.theme_color || "#2563eb";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Send password reset request via API route
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, isCoach: false, coachSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 w-96 bg-gray-200 rounded"></div>
          </div>
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
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Link
                href={coachSlug ? `/login?coach=${coachSlug}` : "/"}
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}
            >
              {appLogoUrl ? (
                 <img 
                    src={appLogoUrl} 
                    alt={businessName}
                    style={{
                        height: `${appLogoSize}px`,
                        width: "auto",
                        objectFit: "contain"
                    }}
                 />
              ) : (
                <span style={{ 
                    fontSize: "24px", 
                    fontWeight: 700, 
                    color: "#111827" 
                }}>
                  {coachSlug ? (
                    businessName
                  ) : (
                    <>
                      <span style={{ color: "#2563eb" }}>daily</span>companion
                    </>
                  )}
                </span>
              )}
            </Link>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              marginTop: "24px",
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            Forgot password?
          </h1>
          <p style={{ color: "#6b7280", fontSize: "16px" }}>
            No worries, we'll send you reset instructions
          </p>
        </div>

        {success ? (
          <div
            style={{
              backgroundColor: "#fff",
              padding: "32px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              Check your email! If an account exists with {email}, you will
              receive a password reset link.
            </div>
            <Link
              href={coachSlug ? `/login?coach=${coachSlug}` : "/login"}
              style={{
                display: "block",
                width: "100%",
                padding: "14px",
                fontSize: "16px",
                fontWeight: 500,
                backgroundColor: primaryColor,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: "#fff",
              padding: "32px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
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

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
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
                marginBottom: "16px",
              }}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              <Link
                href={coachSlug ? `/login?coach=${coachSlug}` : "/login"}
                style={{ color: primaryColor, textDecoration: "none" }}
              >
                ← Back to Sign In
              </Link>
            </p>

            {!coachSlug && (
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "20px",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                >
                  Are you a coach?{" "}
                  <Link
                    href="/coach/forgot-password"
                    style={{ color: "#2563eb", textDecoration: "none" }}
                  >
                    Coach password reset
                  </Link>
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
