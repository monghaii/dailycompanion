"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
              style={{ width: "80px", height: "80px", margin: "0 auto 24px", cursor: "pointer" }}
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
            Welcome back, coach
          </h1>
          <p style={{ color: "#6b7280", fontSize: "18px", margin: 0 }}>
            Sign in to access your dashboard
          </p>
        </div>

        {/* Form */}
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

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle(formData.email)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <label style={labelStyle}>Password</label>
              <Link
                href="/coach/forgot-password"
                style={{
                  fontSize: "14px",
                  color: "#3b82f6",
                  textDecoration: "none",
                  fontWeight: 500,
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
              style={inputStyle(formData.password)}
              placeholder="••••••••"
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
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              fontSize: "15px",
              color: "#6b7280",
            }}
          >
            Don't have an account?{" "}
            <Link
              href="/coach/signup"
              style={{ color: "#dc2626", textDecoration: "none", fontWeight: 500 }}
            >
              Sign up.
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
