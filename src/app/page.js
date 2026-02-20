"use client";

import Link from "next/link";
import Image from "next/image";

function GradientCTA({ href, children, large }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        padding: large ? "20px 60px" : "16px 48px",
        fontSize: large ? "20px" : "18px",
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
        e.currentTarget.style.boxShadow =
          "0 10px 25px rgba(220, 38, 38, 0.3)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </Link>
  );
}

const FEATURES = [
  {
    title: "Custom-Branded Companion",
    desc: "Your logo, colors, domain. Clients see your brand, not ours.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    title: "AI-Powered Coaching",
    desc: "A conversational AI coach trained on your methodology. Supports clients between sessions 24/7.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "Morning Practices & Focus Tools",
    desc: "Guided audio, daily intention setting, and task tracking your clients actually complete.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Awareness & Emotional Tracking",
    desc: "Clients log mindfulness moments and emotional states. You see the patterns.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "Premium Resource Hub",
    desc: "Upload video, audio, and PDF content. Gate it behind your highest tier for recurring revenue.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: "Revenue Dashboard",
    desc: "Stripe integration, Kit email automation, multi-currency support, and real-time subscription analytics.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

const CARMODY_PRINCIPLES = [
  {
    quote: "Focus on the business side of your coaching business.",
    mapping:
      "Daily Companion handles branding, payments, content delivery, and analytics\u2014so you can focus on coaching.",
  },
  {
    quote:
      "It isn\u2019t about doing 4,000 things. It\u2019s about doing one or two things 4,000 times.",
    mapping:
      "One unified platform where your clients live \u2014 no juggling separate tools for content, payments, booking, and engagement.",
  },
  {
    quote: "Content is the new currency.",
    mapping:
      "Your Resource Hub is ready to go \u2014 just upload your content and start monetizing.",
  },
  {
    quote: "Pay attention to your metrics.",
    mapping:
      "Real-time revenue dashboards, client engagement tracking, and subscription analytics\u2014built in from day one.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Sign up & brand",
    desc: "Create your account. Set your name, colors, logo, and pricing tiers in minutes.",
  },
  {
    step: "2",
    title: "Configure your companion",
    desc: "Upload morning practices, set emotional categories, add resource hub content. No code.",
  },
  {
    step: "3",
    title: "Share & earn",
    desc: "Send clients your custom URL or connect your own domain. They subscribe, you get paid.",
  },
];

const PRICING_FEATURES = [
  "Unlimited clients",
  "AI coaching",
  "Resource hub",
  "Custom domain",
  "Stripe payouts",
  "Kit email integration",
  "Analytics dashboard",
];

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
      <section
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
        <div style={{ marginBottom: "60px" }}>
          <Image
            src="/logo.png"
            alt="Daily Companion Logo"
            width={120}
            height={120}
            style={{ width: "120px", height: "120px" }}
          />
        </div>

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

        <GradientCTA href="/coach/signup" large>
          Get Started
        </GradientCTA>
      </section>

      {/* ── Section 2: Live Companion Showcase ── */}
      <section
        style={{
          backgroundColor: "#f9fafb",
          padding: "100px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              color: "#000000",
              marginBottom: "20px",
              letterSpacing: "-0.02em",
            }}
          >
            Your Entire Coaching Business. One Platform.
          </h2>
          <p
            style={{
              fontSize: "clamp(16px, 1.8vw, 20px)",
              color: "#666666",
              maxWidth: "720px",
              margin: "0 auto 48px",
              lineHeight: 1.6,
            }}
          >
            Using Daily Companion, Iv Jaeger built{" "}
            <strong>BrainPeace</strong> &mdash; a fully branded coaching
            companion for ADHD founders. Her clients subscribe, engage with
            daily practices, and access premium content all from one place
            she controls.
          </p>

          {/* iPhone Mockup — mirrors coach LP device frame */}
          <div
            style={{
              position: "relative",
              width: "280px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                position: "relative",
                backgroundColor: "#1a1a1a",
                borderRadius: "48px",
                padding: "12px",
                boxShadow:
                  "0 30px 60px rgba(0,0,0,0.18), 0 10px 24px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              {/* Power button */}
              <div
                style={{
                  position: "absolute",
                  right: "-2px",
                  top: "120px",
                  width: "3px",
                  height: "56px",
                  backgroundColor: "#2a2a2a",
                  borderRadius: "0 2px 2px 0",
                }}
              />
              {/* Vol up */}
              <div
                style={{
                  position: "absolute",
                  left: "-2px",
                  top: "110px",
                  width: "3px",
                  height: "28px",
                  backgroundColor: "#2a2a2a",
                  borderRadius: "2px 0 0 2px",
                }}
              />
              {/* Vol down */}
              <div
                style={{
                  position: "absolute",
                  left: "-2px",
                  top: "148px",
                  width: "3px",
                  height: "28px",
                  backgroundColor: "#2a2a2a",
                  borderRadius: "2px 0 0 2px",
                }}
              />

              {/* Screen */}
              <div
                style={{
                  position: "relative",
                  borderRadius: "38px",
                  overflow: "hidden",
                  backgroundColor: "#f9fafb",
                  aspectRatio: "393 / 852",
                }}
              >
                {/* Dynamic Island */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "90px",
                    height: "25px",
                    backgroundColor: "#1a1a1a",
                    borderRadius: "20px",
                    zIndex: 3,
                  }}
                />

                {/* App screenshot */}
                <img
                  src="/brainpeace-screenshot.png"
                  alt="BrainPeace companion app interface"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "top",
                    display: "block",
                  }}
                />

                {/* Home indicator */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "100px",
                    height: "4px",
                    backgroundColor: "rgba(0,0,0,0.2)",
                    borderRadius: "4px",
                    zIndex: 3,
                  }}
                />
              </div>
            </div>
          </div>

          <p
            style={{
              marginTop: "32px",
              fontSize: "15px",
              color: "#999999",
              fontStyle: "italic",
            }}
          >
            A unified home base for your coaching business &mdash; engage your
            audience, upsell content, book calls, and grow revenue.
          </p>
        </div>
      </section>

      {/* ── Section 3: Bill Carmody ── */}
      <section
        style={{
          backgroundColor: "#ffffff",
          padding: "100px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#7C3AED",
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            Built With The Best
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 700,
              color: "#000000",
              textAlign: "center",
              marginBottom: "60px",
              letterSpacing: "-0.02em",
              maxWidth: "800px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Designed alongside Bill Carmody &mdash; the coach who coaches
            coaches.
          </h2>

          <div
            style={{
              display: "flex",
              gap: "60px",
              alignItems: "flex-start",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {/* Left: Photo + credentials */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
                width: "260px",
              }}
            >
              <Image
                src="/bill-carmody.jpg"
                alt="Bill Carmody"
                width={200}
                height={200}
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  marginBottom: "20px",
                }}
              />
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#000000",
                  marginBottom: "4px",
                }}
              >
                Bill Carmody
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666666",
                  textAlign: "center",
                  lineHeight: 1.5,
                  marginBottom: "16px",
                }}
              >
                Chief Coaching Officer
                <br />
                Positive Intelligence
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#999999",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Former columnist for
                <br />
                <span style={{ fontWeight: 600, color: "#666666" }}>
                  Inc &middot; Entrepreneur &middot; Forbes
                </span>
              </p>
            </div>

            {/* Right: Bio + Principles */}
            <div style={{ flex: 1, minWidth: "300px" }}>
              <p
                style={{
                  fontSize: "clamp(16px, 1.6vw, 18px)",
                  color: "#444444",
                  lineHeight: 1.7,
                  marginBottom: "36px",
                }}
              >
                With 30+ years of marketing mastery, two successful exits ($25M
                and $5M in revenue), and over 100,000 coaches supported globally
                through Positive Intelligence, Bill is a PCC-credentialed coach
                with the International Coaching Federation and one of the most
                respected voices in the business of coaching. His mission:
                helping coaches focus on the <em>business side</em> of their
                coaching business.
              </p>

              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#000000",
                  marginBottom: "24px",
                }}
              >
                His methodology. Our platform.
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {CARMODY_PRINCIPLES.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "20px 24px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "12px",
                      borderLeft: "4px solid #7C3AED",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#000000",
                        fontStyle: "italic",
                        marginBottom: "6px",
                      }}
                    >
                      &ldquo;{p.quote}&rdquo;
                    </p>
                    <p
                      style={{
                        fontSize: "15px",
                        color: "#555555",
                        lineHeight: 1.5,
                      }}
                    >
                      {p.mapping}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Feature Grid ── */}
      <section
        style={{
          backgroundColor: "#f9fafb",
          padding: "100px 24px",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 700,
              color: "#000000",
              textAlign: "center",
              marginBottom: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            Everything your coaching business needs.
          </h2>
          <p
            style={{
              fontSize: "clamp(16px, 1.6vw, 18px)",
              color: "#666666",
              textAlign: "center",
              marginBottom: "60px",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            No duct-taping five different tools together. It&rsquo;s all here.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "32px",
            }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "32px 28px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ marginBottom: "16px" }}>{f.icon}</div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#000000",
                    marginBottom: "8px",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#666666",
                    lineHeight: 1.6,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: How It Works ── */}
      <section style={{ backgroundColor: "#ffffff", padding: "100px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 700,
              color: "#000000",
              textAlign: "center",
              marginBottom: "60px",
              letterSpacing: "-0.02em",
            }}
          >
            Three simple steps to launch.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "40px",
              textAlign: "center",
            }}
          >
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #DC2626 0%, #7C3AED 100%)",
                    color: "#ffffff",
                    fontSize: "24px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  {s.step}
                </div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#000000",
                    marginBottom: "8px",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#666666",
                    lineHeight: 1.6,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Pricing ── */}
      <section
        style={{
          backgroundColor: "#f9fafb",
          padding: "100px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "520px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            padding: "48px 40px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(28px, 3.5vw, 36px)",
              fontWeight: 700,
              color: "#000000",
              marginBottom: "8px",
            }}
          >
            Simple pricing.
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "#666666",
              marginBottom: "32px",
            }}
          >
            Everything you need to run your coaching business in one place.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "56px",
                fontWeight: 800,
                color: "#000000",
                lineHeight: 1,
              }}
            >
              $50
            </span>
            <span style={{ fontSize: "18px", color: "#666666" }}>/month</span>
          </div>
          <p
            style={{
              fontSize: "15px",
              color: "#999999",
              marginBottom: "32px",
            }}
          >
            or <strong style={{ color: "#000000" }}>$500/year</strong>{" "}
            <span style={{ color: "#16a34a", fontWeight: 600 }}>
              (save $100)
            </span>
          </p>

          <div
            style={{
              textAlign: "left",
              marginBottom: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {PRICING_FEATURES.map((feat) => (
              <div
                key={feat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "15px",
                  color: "#333333",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feat}
              </div>
            ))}
          </div>

          <GradientCTA href="/coach/signup" large>
            Start Your Companion
          </GradientCTA>
        </div>
      </section>

      {/* ── Section 7: Bottom CTA ── */}
      <section
        style={{
          backgroundColor: "#ffffff",
          padding: "100px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              color: "#000000",
              marginBottom: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            Your coaching deserves a home base.
          </h2>
          <p
            style={{
              fontSize: "clamp(16px, 1.8vw, 20px)",
              color: "#666666",
              marginBottom: "40px",
              lineHeight: 1.6,
            }}
          >
            Join coaches who are scaling their impact with Daily Companion.
          </p>
          <GradientCTA href="/coach/signup" large>
            Get Started &mdash; It&rsquo;s $50/mo
          </GradientCTA>
        </div>
      </section>
    </div>
  );
}
