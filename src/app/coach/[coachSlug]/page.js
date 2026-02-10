"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CoachLandingPage() {
  const params = useParams();
  const router = useRouter();
  const [landingData, setLandingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`,
        }}
      >
        {/* Hero Section */}
        <section
          style={{
            padding: "80px 20px 60px",
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
              onClick={() => window.location.href = `/signup?coach=${params.coachSlug}&plan=free`}
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
        <section
          style={{
            padding: "60px 20px",
            maxWidth: "800px",
            margin: "0 auto",
            backgroundColor: "#fff",
            borderRadius: "24px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            marginBottom: "60px",
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
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "30px",
            }}
          >
            {/* Free Plan */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "20px",
                padding: "40px 30px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "2px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                Free
              </h3>
              <div style={{ marginBottom: "30px", textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "48px",
                    fontWeight: 700,
                    color: "#6b7280",
                  }}
                >
                  $0
                </span>
                <span style={{ fontSize: "18px", color: "#6b7280" }}>/month</span>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginBottom: "30px",
                  minHeight: "150px",
                }}
              >
                <li
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "15px",
                    color: "#4b5563",
                  }}
                >
                  <span style={{ color: "#6b7280", fontSize: "20px" }}>✓</span>
                  Daily Focus check-ins
                </li>
                <li
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "15px",
                    color: "#4b5563",
                  }}
                >
                  <span style={{ color: "#6b7280", fontSize: "20px" }}>✓</span>
                  Basic task tracking
                </li>
                <li
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "15px",
                    color: "#4b5563",
                  }}
                >
                  <span style={{ color: "#6b7280", fontSize: "20px" }}>✓</span>
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
                  fontSize: "16px",
                  fontWeight: 600,
                  padding: "14px 20px",
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

            {/* Premium Plan */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "20px",
                padding: "40px 30px",
                boxShadow: `0 8px 32px ${primaryColor}30`,
                border: `3px solid ${primaryColor}`,
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
                  padding: "4px 16px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                PREMIUM
              </div>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                Premium
              </h3>
              <div style={{ marginBottom: "30px", textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "48px",
                    fontWeight: 700,
                    color: primaryColor,
                  }}
                >
                  $19.99
                </span>
                <span style={{ fontSize: "18px", color: "#6b7280" }}>/month</span>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginBottom: "30px",
                  minHeight: "150px",
                }}
              >
                {(pricing.features || [
                  "Everything in Free",
                  "AI Coach conversations",
                  "Awareness tracking & insights",
                  "Premium content library",
                  "Advanced analytics",
                ]).map((feature, idx) => (
                  <li
                    key={idx}
                    style={{
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "15px",
                      color: "#4b5563",
                    }}
                  >
                    <span style={{ color: primaryColor, fontSize: "20px" }}>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  window.location.href = `/signup?coach=${params.coachSlug}&plan=premium`;
                }}
                style={{
                  width: "100%",
                  backgroundColor: primaryColor,
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: 600,
                  padding: "14px 20px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  transition: "filter 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.filter = "brightness(0.9)")}
                onMouseLeave={(e) => (e.target.style.filter = "brightness(1)")}
              >
                Start Premium
              </button>
            </div>
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
            onClick={() => window.location.href = `/signup?coach=${params.coachSlug}&plan=free`}
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
        </section>
      </div>

    </>
  );
}
