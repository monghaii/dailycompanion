"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordClient({ coachSlug, initialCoachData }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
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

  useEffect(() => {
    // Extract access token from URL hash (Supabase puts it there)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get("access_token");

    if (token) {
      setAccessToken(token);
    } else {
      // Don't set error immediately on server render, but client side check is fine
      // If no token in hash, check if it's not a recovery flow or just loading
      // For now, let's keep it simple as the original code did
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, []);

  // Branding derivation
  const branding = coachData?.branding || {};
  const coach = coachData?.coach || {};

  const businessName = coach.business_name || "dailycompanion";
  const appLogoUrl = branding.app_logo_url; // Use app logo
  const appLogoSize = branding.app_logo_size || 40;
  const primaryColor = branding.primary_color || coach.theme_color || "#2563eb";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    if (!accessToken) {
      setError("Invalid or expired reset link. Please request a new one.");
      setIsLoading(false);
      return;
    }

    try {
      // Update password via API route
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, accessToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        const loginUrl = coachSlug ? `/login?coach=${coachSlug}` : "/login";
        router.push(loginUrl);
      }, 2000);
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
            Reset your password
          </h1>
          <p style={{ color: "#6b7280", fontSize: "16px" }}>
            Enter your new password below
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
              Password reset successfully! Redirecting you to sign in...
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
              Continue to Sign In
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

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                required
                minLength={8}
              />
              <p
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                Must be at least 8 characters
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                required
                minLength={8}
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
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>

            <p
              style={{
                textAlign: "center",
                marginTop: "20px",
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
          </form>
        )}
      </div>
    </div>
  );
}
