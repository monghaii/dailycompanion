import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Navigation */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "white",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            height: "64px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ fontSize: "14px" }}
            >
              Not a coach?
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ paddingTop: "128px", paddingBottom: "80px" }}>
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}
        >
          <div
            style={{ maxWidth: "768px", margin: "0 auto", textAlign: "center" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "9999px",
                backgroundColor: "#f3f4f6",
                fontSize: "14px",
                color: "#6b7280",
                marginBottom: "32px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              ></span>
              Now accepting coaches
            </div>

            <h1
              style={{
                fontSize: "clamp(36px, 5vw, 60px)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: "24px",
                color: "#111827",
              }}
            >
              Your coaching business, simplified.
            </h1>

            <p
              style={{
                fontSize: "20px",
                color: "#6b7280",
                maxWidth: "560px",
                margin: "0 auto 40px",
              }}
            >
              Build a thriving online coaching practice. Share content, connect
              with clients, and grow your revenue—all in one beautiful platform.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              <Link
                href="/coach/signup"
                className="btn btn-primary"
                style={{ padding: "16px 32px", fontSize: "16px" }}
              >
                Get Started — $50/mo
              </Link>
              <Link
                href="/coach/login"
                className="btn btn-secondary"
                style={{ padding: "16px 32px", fontSize: "16px" }}
              >
                Coach Login
              </Link>
            </div>
          </div>

          {/* Features */}
          <div
            style={{
              marginTop: "128px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            <div
              style={{
                padding: "32px",
                borderRadius: "16px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>📚</div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                Content Hub
              </h3>
              <p style={{ color: "#6b7280" }}>
                Upload videos, articles, and resources. Your clients get a
                single destination for all your content.
              </p>
            </div>
            <div
              style={{
                padding: "32px",
                borderRadius: "16px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>💳</div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                Subscriptions
              </h3>
              <p style={{ color: "#6b7280" }}>
                Set your own pricing. We handle payments, billing, and
                payouts—you focus on coaching.
              </p>
            </div>
            <div
              style={{
                padding: "32px",
                borderRadius: "16px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>✨</div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                Your Brand
              </h3>
              <p style={{ color: "#6b7280" }}>
                Custom landing page with your branding. A professional presence
                without the tech hassle.
              </p>
            </div>
          </div>

          {/* Pricing */}
          <div style={{ marginTop: "128px", textAlign: "center" }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 700,
                marginBottom: "16px",
              }}
            >
              One plan supports your entire business.
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "48px" }}>
              One plan. Everything included. No hidden fees.
            </p>

            <div
              style={{
                maxWidth: "448px",
                margin: "0 auto",
                padding: "32px",
                borderRadius: "16px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "24px",
                }}
              >
                <span style={{ fontSize: "48px", fontWeight: 700 }}>$50</span>
                <span style={{ color: "#6b7280" }}>/month</span>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "24px",
                }}
              >
                or $500/year (save $100)
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 32px",
                  textAlign: "left",
                }}
              >
                {[
                  "Custom content uploads",
                  "Free landing page",
                  "Subscriber management",
                  "Advanced analytics",
                  "Customizable branding",
                  "Stripe payments & payouts",
                  "Only 20% platform fee on subscriber revenue",
                ].map((item, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      color: "#6b7280",
                      marginBottom: "12px",
                    }}
                  >
                    <svg
                      style={{
                        width: "20px",
                        height: "20px",
                        color: "#22c55e",
                        flexShrink: 0,
                      }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/coach/signup"
                className="btn btn-primary"
                style={{ width: "100%", padding: "16px", fontSize: "16px" }}
              >
                Start Your Coaching Business
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "32px 0" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            textAlign: "center",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          © {new Date().getFullYear()} Daily Companion. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
