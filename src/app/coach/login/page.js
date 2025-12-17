"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CoachLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Auto-fill test credentials if available
  useEffect(() => {
    const devUsername = process.env.NEXT_PUBLIC_DEV_ONLY_COACH_USERNAME;
    const devPassword = process.env.NEXT_PUBLIC_DEV_ONLY_COACH_PASSWORD;

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

      if (data.profile.role !== "coach") {
        throw new Error("This login is for coaches only.");
      }

      // Small delay to ensure cookie is set, then redirect
      await new Promise((resolve) => setTimeout(resolve, 100));
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
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
            Welcome back, coach
          </h1>
          <p style={{ color: "#6b7280", fontSize: "16px" }}>
            Sign in to access your dashboard
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
              placeholder="jane@example.com"
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
                href="/coach/forgot-password"
                style={{
                  fontSize: "14px",
                  color: "#2563eb",
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
              backgroundColor: "#2563eb",
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
              href="/coach/signup"
              style={{ color: "#2563eb", textDecoration: "none" }}
            >
              Start coaching
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
