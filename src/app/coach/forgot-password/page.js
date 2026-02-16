"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function CoachForgotPassword() {
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
        body: JSON.stringify({ email, isCoach: true }),
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

  const inputStyle = (hasValue) => ({
    width: "100%",
    padding: "16px",
    fontSize: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: hasValue ? "#dbeafe" : "#fff",
    color: "#111827",
    outline: "none",
    transition: "background-color 0.2s",
  });

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontSize: "15px",
    fontWeight: 500,
    color: "#374151",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "540px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ display: "inline-block" }}>
            <Image
              src="/logo.png"
              alt="Daily Companion"
              width={80}
              height={80}
              style={{
                width: "80px",
                height: "80px",
                margin: "0 auto 24px",
                cursor: "pointer",
              }}
            />
          </Link>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 700,
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            Reset your password, coach
          </h1>
          <p style={{ color: "#6b7280", fontSize: "18px", margin: 0 }}>
            No worries, we'll send you reset instructions
          </p>
        </div>

        {success ? (
          <div
            style={{
              backgroundColor: "#fff",
              padding: "40px",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
                marginBottom: "24px",
              }}
            >
              Check your email! If an account exists with {email}, you will
              receive a password reset link.
            </div>
            <Link
              href="/coach/login"
              style={{
                display: "block",
                width: "100%",
                padding: "18px",
                fontSize: "18px",
                fontWeight: 700,
                backgroundColor: "#fbbf24",
                color: "#000000",
                border: "none",
                borderRadius: "12px",
                textAlign: "center",
                textDecoration: "none",
                transition: "all 0.2s",
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
              padding: "40px",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
                  marginBottom: "24px",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: "32px" }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle(email)}
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "18px",
                fontSize: "18px",
                fontWeight: 700,
                backgroundColor: isLoading ? "#9ca3af" : "#fbbf24",
                color: "#000000",
                border: "none",
                borderRadius: "12px",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "#f59e0b";
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "#fbbf24";
                }
              }}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>

            <p
              style={{
                textAlign: "center",
                marginTop: "24px",
                fontSize: "15px",
                color: "#6b7280",
              }}
            >
              <Link
                href="/coach/login"
                style={{
                  color: "#dc2626",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
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
