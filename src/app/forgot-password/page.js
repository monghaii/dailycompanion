"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

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
        body: JSON.stringify({ email, isCoach: false }),
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
              href="/login"
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
                backgroundColor: "#2563eb",
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
                href="/login"
                style={{ color: "#2563eb", textDecoration: "none" }}
              >
                ← Back to Sign In
              </Link>
            </p>

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
          </form>
        )}
      </div>
    </div>
  );
}
