"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CoachLandingPage() {
  const params = useParams();
  const router = useRouter();
  const [landingData, setLandingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set dynamic favicon, page title, and meta description based on coach data
  useEffect(() => {
    const coach = landingData?.coach;
    if (!coach?.business_name) return;

    document.title = `${coach.business_name} | Daily Companion`;

    // Set meta description
    const description =
      coach.tagline ||
      `Daily practices and awareness tools designed to quiet internal noise and build habits that support calm, focus, and steady growth.`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;

    // Set favicon to coach's business logo
    if (coach.logo_url) {
      // Remove all existing favicon links
      document
        .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
        .forEach((el) => el.remove());

      const link = document.createElement("link");
      link.rel = "icon";
      link.href = coach.logo_url;
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
  }, [landingData]);

  useEffect(() => {
    fetchLandingData();
  }, [params.coachSlug]);

  const fetchLandingData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/landing/${params.coachSlug}`);

      if (!response.ok) {
        throw new Error("Coach not found");
      }

      const data = await response.json();
      setLandingData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #e5e7eb",
            borderTop: "3px solid #7c3aed",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{ fontSize: "24px", fontWeight: 600, marginBottom: "10px" }}
          >
            Coach Not Found
          </h1>
          <p style={{ color: "#6b7280" }}>
            The coach page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const config = landingData?.config || {};
  const coach = landingData?.coach || {};
  const branding = landingData?.branding || {};
  const pricing = config.pricing || {};
  const testimonials = config.testimonials || [];
  const primaryColor = branding.primary_color || coach.theme_color || "#7c3aed";

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        @media (max-width: 640px) {
          .nav-bar {
            padding: 16px 20px !important;
          }
          .nav-brand-text {
            font-size: 16px !important;
          }
          .nav-logo {
            width: 32px !important;
            height: 32px !important;
          }
          .nav-login-btn {
            font-size: 13px !important;
            padding: 8px 16px !important;
          }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`,
        }}
      >
        {/* Navigation Bar */}
        <nav
          className="nav-bar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 40px",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          {/* Logo/Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {coach.logo_url && (
              <img
                src={coach.logo_url}
                alt={coach.business_name}
                className="nav-logo"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            )}
            <span
              className="nav-brand-text"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#1a1a1a",
              }}
            >
              {coach.business_name}
            </span>
          </div>

          {/* Login Button */}
          <button
            className="nav-login-btn"
            onClick={() => {
              window.location.href = `/login?coach=${params.coachSlug}`;
            }}
            style={{
              backgroundColor: "transparent",
              color: primaryColor,
              fontSize: "15px",
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: "8px",
              border: `2px solid ${primaryColor}`,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = primaryColor;
              e.target.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = primaryColor;
            }}
          >
            Log In
          </button>
        </nav>

        {/* Hero Section */}
        <section
          style={{
            padding: "40px 20px 60px",
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div className="fade-in">
            {coach.logo_url && (
              <img
                src={coach.logo_url}
                alt={coach.business_name}
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  margin: "0 auto 30px",
                  border: `4px solid ${primaryColor}`,
                }}
              />
            )}

            <h1
              style={{
                fontSize: "48px",
                fontWeight: 700,
                marginBottom: "20px",
                color: "#1a1a1a",
                lineHeight: 1.2,
              }}
            >
              {coach.landing_headline || "Transform Your Life"}
            </h1>

            <p
              style={{
                fontSize: "20px",
                color: "#6b7280",
                marginBottom: "40px",
                maxWidth: "700px",
                margin: "0 auto 40px",
              }}
            >
              {coach.landing_subheadline ||
                "Join others on their journey to growth"}
            </p>

            <button
              onClick={() =>
                (window.location.href = `/signup?coach=${params.coachSlug}&plan=free`)
              }
              style={{
                backgroundColor: primaryColor,
                color: "#fff",
                fontSize: "18px",
                fontWeight: 600,
                padding: "16px 48px",
                borderRadius: "50px",
                border: "none",
                cursor: "pointer",
                boxShadow: `0 4px 14px ${primaryColor}40`,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = `0 6px 20px ${primaryColor}60`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = `0 4px 14px ${primaryColor}40`;
              }}
            >
              {coach.landing_cta || "Start Your Journey"}
            </button>
          </div>
        </section>

        {/* Coach Info Section */}
        <div style={{ padding: "0 16px", marginBottom: "60px" }}>
          <section
            style={{
              padding: "60px 20px",
              maxWidth: "800px",
              margin: "0 auto",
              backgroundColor: "#fff",
              borderRadius: "24px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  marginBottom: "10px",
                  color: "#1a1a1a",
                }}
              >
                {coach.business_name}
              </h2>
              <p
                style={{
                  fontSize: "18px",
                  color: primaryColor,
                  fontWeight: 600,
                  marginBottom: "20px",
                }}
              >
                {coach.tagline || "Coach"}
              </p>
              <p
                style={{
                  fontSize: "16px",
                  color: "#4b5563",
                  lineHeight: 1.7,
                }}
              >
                {coach.bio || "Dedicated to helping you achieve your goals."}
              </p>
            </div>
          </section>
        </div>

        {/* Pricing Section */}
        <section
          style={{
            padding: "60px 20px",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: "36px",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: "40px",
              color: "#1a1a1a",
            }}
          >
            Get Started Today
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
              maxWidth: "1100px",
              margin: "0 auto",
            }}
          >
            {/* Free Plan */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "20px",
                padding: "36px 26px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "2px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                Free
              </h3>
              <div style={{ marginBottom: "26px", textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "44px",
                    fontWeight: 700,
                    color: "#6b7280",
                  }}
                >
                  $0
                </span>
                <span style={{ fontSize: "16px", color: "#6b7280" }}>
                  /month
                </span>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginBottom: "26px",
                  minHeight: "140px",
                }}
              >
                <li
                  style={{
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    color: "#4b5563",
                  }}
                >
                  <span style={{ color: "#6b7280", fontSize: "18px" }}>✓</span>
                  Daily Focus check-ins
                </li>
                <li
                  style={{
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    color: "#4b5563",
                  }}
                >
                  <span style={{ color: "#6b7280", fontSize: "18px" }}>✓</span>
                  Basic task tracking
                </li>
                <li
                  style={{
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    color: "#4b5563",
                  }}
                >
                  <span style={{ color: "#6b7280", fontSize: "18px" }}>✓</span>
                  Community support
                </li>
              </ul>

              <button
                onClick={() => {
                  window.location.href = `/signup?coach=${params.coachSlug}&plan=free`;
                }}
                style={{
                  width: "100%",
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: "15px",
                  fontWeight: 600,
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "2px solid #e5e7eb",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e5e7eb";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6";
                }}
              >
                Start Free
              </button>
            </div>

            {/* Daily Companion Plan (Tier 2) */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "20px",
                padding: "36px 26px",
                boxShadow: `0 6px 28px ${primaryColor}25`,
                border: `2px solid ${primaryColor}`,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: primaryColor,
                  color: "#fff",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                POPULAR
              </div>
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                Daily Companion
              </h3>
              <div style={{ marginBottom: "26px", textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "44px",
                    fontWeight: 700,
                    color: primaryColor,
                  }}
                >
                  $9.99
                </span>
                <span style={{ fontSize: "16px", color: "#6b7280" }}>
                  /month
                </span>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginBottom: "26px",
                  minHeight: "140px",
                }}
              >
                {[
                  "Everything in Free",
                  "AI-powered coaching",
                  "Progress tracking & insights",
                  "Unlimited access to all features",
                ].map((feature, idx) => (
                  <li
                    key={idx}
                    style={{
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      color: "#4b5563",
                    }}
                  >
                    <span style={{ color: primaryColor, fontSize: "18px" }}>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  window.location.href = `/signup?coach=${params.coachSlug}&plan=premium&tier=2`;
                }}
                style={{
                  width: "100%",
                  backgroundColor: primaryColor,
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 600,
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  transition: "filter 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.filter = "brightness(0.9)")
                }
                onMouseLeave={(e) => (e.target.style.filter = "brightness(1)")}
              >
                Start Daily Companion
              </button>
            </div>

            {/* Tier 3 Plan */}
            {coach.tier3_enabled !== false && (<div
              style={{
                backgroundColor: "#fff",
                borderRadius: "20px",
                padding: "36px 26px",
                boxShadow: "0 8px 36px rgba(251, 191, 36, 0.3)",
                border: "3px solid #fbbf24",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#fbbf24",
                  color: "#000",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                ELITE
              </div>
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                {coach.tier3_name || "Premium Plus"}
              </h3>
              <div style={{ marginBottom: "26px", textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "44px",
                    fontWeight: 700,
                    color: "#ea580c",
                  }}
                >
                  {formatPrice(
                    landingData?.pricing?.tier3_price_cents ||
                      coach.user_monthly_price_cents ||
                      1999,
                  )}
                </span>
                <span style={{ fontSize: "16px", color: "#6b7280" }}>
                  /month
                </span>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginBottom: "26px",
                  minHeight: "140px",
                }}
              >
                {[
                  "Everything in Daily Companion",
                  "Exclusive Resource Hub access",
                  "Community calls & programs",
                  "Curated learning library",
                ].map((feature, idx) => (
                  <li
                    key={idx}
                    style={{
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      color: "#4b5563",
                    }}
                  >
                    <span style={{ color: "#ea580c", fontSize: "18px" }}>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  window.location.href = `/signup?coach=${params.coachSlug}&plan=premium&tier=3`;
                }}
                style={{
                  width: "100%",
                  backgroundColor: "#fbbf24",
                  color: "#000",
                  fontSize: "15px",
                  fontWeight: 700,
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  transition: "filter 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.filter = "brightness(0.9)")
                }
                onMouseLeave={(e) => (e.target.style.filter = "brightness(1)")}
              >
                Start {coach.tier3_name || "Premium Plus"}
              </button>
            </div>)}
          </div>

          {/* Yearly Savings Note */}
          <div
            style={{
              marginTop: "32px",
              textAlign: "center",
              padding: "16px",
              backgroundColor: "#eff6ff",
              borderRadius: "12px",
              border: "1px solid #bfdbfe",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#1e40af",
                margin: 0,
              }}
            >
              💡 <strong>Save with yearly billing:</strong> Get 1 month free
              when you choose yearly billing (11 months for the price of 12)
            </p>
          </div>
        </section>

        {/* Testimonials Section */}
        {testimonials.length > 0 && (
          <section
            style={{
              padding: "60px 20px",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            <h2
              style={{
                fontSize: "36px",
                fontWeight: 700,
                textAlign: "center",
                marginBottom: "40px",
                color: "#1a1a1a",
              }}
            >
              What Others Say
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "30px",
              }}
            >
              {testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "16px",
                    padding: "30px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#4b5563",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                      fontStyle: "italic",
                    }}
                  >
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: "4px" }}>
                      {testimonial.name}
                    </p>
                    <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section
          style={{
            padding: "80px 20px",
            textAlign: "center",
            background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`,
          }}
        >
          <h2
            style={{
              fontSize: "40px",
              fontWeight: 700,
              marginBottom: "20px",
              color: "#1a1a1a",
            }}
          >
            Ready to Begin?
          </h2>
          <p
            style={{
              fontSize: "18px",
              color: "#6b7280",
              marginBottom: "30px",
            }}
          >
            Your transformation starts today
          </p>
          <button
            onClick={() =>
              (window.location.href = `/signup?coach=${params.coachSlug}&plan=free`)
            }
            style={{
              backgroundColor: primaryColor,
              color: "#fff",
              fontSize: "18px",
              fontWeight: 600,
              padding: "16px 48px",
              borderRadius: "50px",
              border: "none",
              cursor: "pointer",
              boxShadow: `0 4px 14px ${primaryColor}40`,
            }}
          >
            {coach.landing_cta || "Start Your Journey"}
          </button>

          {/* Login Link */}
          <p
            style={{
              marginTop: "24px",
              fontSize: "15px",
              color: "#6b7280",
            }}
          >
            Already have an account?{" "}
            <a
              href={`/login?coach=${params.coachSlug}`}
              style={{
                color: primaryColor,
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = "none";
              }}
            >
              Log in
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
