"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CoachResetPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    // Check for error from /auth/confirm redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("error")) {
      setError("Invalid or expired reset link. Please request a new one.");
      return;
    }

    // Extract access token from URL hash (Supabase puts it there after /auth/confirm)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get("access_token");

    if (token) {
      setAccessToken(token);
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, []);

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

      // Redirect to coach login after 2 seconds
      setTimeout(() => {
        router.push("/coach/login");
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
            href="/"
            style={{
              fontSize: "20px",
              fontWeight: 600,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span style={{ color: "#2563eb" }}>daily</span>companion
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
            Reset your password, coach
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
              href="/coach/login"
              style={{
                display: "block",
                width: "100%",
                padding: "14px",
                fontSize: "16px",
                fontWeight: 500,
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Continue to Coach Sign In
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
                backgroundColor: "#2563eb",
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
                href="/coach/login"
                style={{ color: "#2563eb", textDecoration: "none" }}
              >
                ← Back to Coach Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
