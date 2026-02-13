"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Navigation */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "white",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "20px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Image
              src="/logo.png"
              alt="Daily Companion"
              width={40}
              height={40}
              style={{ width: "40px", height: "40px" }}
            />
            <span
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#000000",
              }}
            >
              Daily Companion
            </span>
          </Link>

          {/* Coach Login Link */}
          <Link
            href="/coach/login"
            style={{
              fontSize: "16px",
              color: "#000000",
              textDecoration: "none",
              fontWeight: 400,
            }}
          >
            Coach Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "80px 24px 80px",
          textAlign: "center",
        }}
      >
        {/* Logo Icon */}
        <div style={{ marginBottom: "60px" }}>
          <Image
            src="/logo.png"
            alt="Daily Companion Logo"
            width={120}
            height={120}
            style={{ width: "120px", height: "120px" }}
          />
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: "clamp(42px, 6vw, 72px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "32px",
            color: "#000000",
            maxWidth: "900px",
          }}
        >
          Grow Your Business.
          <br />
          Grow Your Impact.
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(18px, 2vw, 22px)",
            color: "#666666",
            maxWidth: "800px",
            margin: "0 auto 16px",
            lineHeight: 1.6,
          }}
        >
          A coaching companion built to scale your coaching business before,
          during, and beyond coaching programs.
        </p>

        {/* Italic Tagline */}
        <p
          style={{
            fontSize: "clamp(18px, 2vw, 22px)",
            color: "#666666",
            fontStyle: "italic",
            marginBottom: "48px",
          }}
        >
          Built by Coaches. For Coaches.
        </p>

        {/* CTA Button with Gradient */}
        <Link
          href="/coach/signup"
          style={{
            display: "inline-block",
            padding: "20px 60px",
            fontSize: "20px",
            fontWeight: 600,
            color: "#ffffff",
            background: "linear-gradient(135deg, #DC2626 0%, #7C3AED 100%)",
            border: "none",
            borderRadius: "12px",
            textDecoration: "none",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 25px rgba(220, 38, 38, 0.3)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Get Started
        </Link>
      </main>
    </div>
  );
}
