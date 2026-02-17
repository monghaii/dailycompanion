"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SignupContent({ coachSlug: serverCoachSlug, initialCoachData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coachData, setCoachData] = useState(initialCoachData);
  const [isLoading, setIsLoading] = useState(
    !initialCoachData && !!serverCoachSlug,
  );

  const paramCoachSlug = searchParams.get("coach");
  const coachSlug = paramCoachSlug || serverCoachSlug;
  const plan = searchParams.get("plan") || "free";
  const tier = parseInt(searchParams.get("tier")) || 2;

  useEffect(() => {
    fetch("/api/auth/logout", { method: "POST" });

    if (!initialCoachData && coachSlug) {
      fetchCoachData();
    } else {
      setIsLoading(false);
    }
  }, [coachSlug, initialCoachData]);

  useEffect(() => {
    const coach = coachData?.coach;
    if (!coach?.business_name) return;

    document.title = `Sign Up - ${coach.business_name} | Daily Companion`;

    // Set meta description from landing config
    const config = coachData?.config;
    const description =
      config?.meta_description ||
      coach.tagline ||
      `Sign up for ${coach.business_name} on Daily Companion.`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;

    // Set og:description for social sharing
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.content = description;

    // Set og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = `Sign Up - ${coach.business_name} | Daily Companion`;

    // Set og:image - prefer app logo, then business logo
    const ogImage = coach.app_logo_url || coach.logo_url;
    if (ogImage) {
      let ogImg = document.querySelector('meta[property="og:image"]');
      if (!ogImg) {
        ogImg = document.createElement("meta");
        ogImg.setAttribute("property", "og:image");
        document.head.appendChild(ogImg);
      }
      ogImg.content = ogImage;
    }

    if (coach.logo_url) {
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
  }, [coachData]);

  const fetchCoachData = async () => {
    try {
      const response = await fetch(`/api/landing/${coachSlug}`);
      if (response.ok) {
        const data = await response.json();
        setCoachData(data);
      }
    } catch (err) {
      console.error("Failed to fetch coach data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup-with-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupForm.email,
          password: signupForm.password,
          firstName: signupForm.firstName,
          lastName: signupForm.lastName,
          coachSlug: coachSlug,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setIsSubmitting(false);
        return;
      }

      if (plan === "premium") {
        const checkoutResponse = await fetch("/api/stripe/user-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: effectiveTier,
            interval: "monthly",
          }),
        });

        const checkoutData = await checkoutResponse.json();

        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        } else {
          alert("Failed to start checkout. Redirecting to dashboard...");
          window.location.href = "/user/dashboard?welcome=true";
        }
      } else {
        window.location.href = "/user/dashboard?welcome=true";
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Failed to create account. Please try again.");
      setIsSubmitting(false);
    }
  };

  const tier3Disabled = coachData?.coach?.tier3_enabled === false;
  const effectiveTier = tier === 3 && tier3Disabled ? 2 : tier;

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
        }}
      >
        <p style={{ color: "#6b7280" }}>Loading...</p>
      </div>
    );
  }

  const businessName = coachData?.coach?.business_name || "Your Coach";
  const primaryColor =
    coachData?.coach?.primary_color ||
    coachData?.branding?.primary_color ||
    "#6366f1";
  const logoUrl =
    coachData?.coach?.app_logo_url || coachData?.branding?.app_logo_url || null;
  const logoSize =
    coachData?.coach?.app_logo_size ||
    coachData?.branding?.app_logo_size ||
    "medium";

  const getSizeStyle = (size) => {
    switch (size) {
      case "small":
        return { maxWidth: "120px", height: "auto" };
      case "large":
        return { maxWidth: "240px", height: "auto" };
      default:
        return { maxWidth: "180px", height: "auto" };
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "48px",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Branding */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              style={{
                ...getSizeStyle(logoSize),
                marginBottom: "12px",
                objectFit: "contain",
              }}
            />
          ) : (
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#1a1a1a",
                marginBottom: "12px",
              }}
            >
              {businessName}
            </h1>
          )}
          <p
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#1a1a1a",
            }}
          >
            Sign up now!
          </p>
          {plan === "premium" && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: `${primaryColor}15`,
                border: `1px solid ${primaryColor}40`,
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: primaryColor,
                  margin: 0,
                }}
              >
                {effectiveTier === 3
                  ? `Tier: ${coachData?.coach?.tier3_name || "Premium Plus"}`
                  : "Tier: Daily Companion"}
              </p>
            </div>
          )}
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                First Name
              </label>
              <input
                type="text"
                placeholder="First"
                value={signupForm.firstName}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, firstName: e.target.value })
                }
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "15px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = primaryColor)}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Last Name
              </label>
              <input
                type="text"
                placeholder="Last"
                value={signupForm.lastName}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, lastName: e.target.value })
                }
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "15px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = primaryColor)}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={signupForm.email}
              onChange={(e) =>
                setSignupForm({ ...signupForm, email: e.target.value })
              }
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "15px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = primaryColor)}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              value={signupForm.password}
              onChange={(e) =>
                setSignupForm({ ...signupForm, password: e.target.value })
              }
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "15px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = primaryColor)}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "14px 20px",
              fontSize: "16px",
              fontWeight: 600,
              color: "#fff",
              backgroundColor: primaryColor,
              border: "none",
              borderRadius: "8px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) =>
              !isSubmitting && (e.target.style.opacity = "0.9")
            }
            onMouseLeave={(e) =>
              !isSubmitting && (e.target.style.opacity = "1")
            }
          >
            {isSubmitting
              ? "Creating account..."
              : plan === "premium"
                ? "Continue to Payment"
                : "Create Account"}
          </button>
        </form>

        {/* Footer Text */}
        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "13px",
            color: "#9ca3af",
            lineHeight: 1.6,
          }}
        >
          <p>We respect your privacy. No spam, ever.</p>
          <p>Unsubscribe anytime.</p>
          {plan === "free" && (
            <p style={{ marginTop: "8px" }}>
              No credit card required • Upgrade to premium anytime from your
              dashboard
            </p>
          )}
        </div>

        {/* Already have account */}
        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Already have an account?{" "}
          <a
            href={coachSlug ? `/login?coach=${coachSlug}` : "/login"}
            style={{
              color: primaryColor,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SignupClient({ coachSlug, initialCoachData }) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
          }}
        >
          <p style={{ color: "#6b7280" }}>Loading...</p>
        </div>
      }
    >
      <SignupContent
        coachSlug={coachSlug}
        initialCoachData={initialCoachData}
      />
    </Suspense>
  );
}
