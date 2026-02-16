"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CoachSignup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    businessName: "",
    slug: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "businessName") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "coach" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Redirect to dashboard - they'll see subscription prompt there
      router.push("/dashboard");
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
        backgroundColor: "#ffffff",
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
          <p style={{ color: "#6b7280", fontSize: "18px", margin: 0 }}>
            Create your coach account and launch your platform
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
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              style={inputStyle(formData.fullName)}
              placeholder="Jane Smith"
              required
            />
          </div>

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

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle(formData.password)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>
              Companion Name
            </label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              style={inputStyle(formData.businessName)}
              placeholder="Jane's Mindfulness Coaching"
              required
            />
          </div>

          <div style={{ marginBottom: "32px" }}>
            <label style={labelStyle}>Your URL</label>
            <div
              style={{
                display: "flex",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                  fontSize: "15px",
                  color: "#6b7280",
                  whiteSpace: "nowrap",
                  borderRight: "1px solid #e5e7eb",
                }}
              >
                dailycompanion.com/coach/
              </span>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                style={{
                  flex: 1,
                  padding: "16px",
                  fontSize: "16px",
                  border: "none",
                  outline: "none",
                  backgroundColor: formData.slug ? "#dbeafe" : "#fff",
                }}
                placeholder="jane-fitness"
                pattern="[a-z0-9-]+"
                required
              />
            </div>
            <p style={{ marginTop: "8px", fontSize: "13px", color: "#9ca3af" }}>
              Only lowercase letters, numbers, and hyphens
            </p>
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
            {isLoading ? "Creating Account..." : "Create Coach Account"}
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/coach/login"
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
          </p>
        </form>

        <p
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "13px",
            color: "#9ca3af",
            lineHeight: 1.6,
          }}
        >
          By signing up, you agree to our Terms of Service and Privacy Policy.
          <br />
          After signup, you'll be asked to subscribe ($50/mo or $500/yr).
        </p>
      </div>
    </div>
  );
}
