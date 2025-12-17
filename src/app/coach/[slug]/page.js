"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CoachLandingPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();

  const [coach, setCoach] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const coachRes = await fetch(`/api/coach/${slug}`);
      const coachData = await coachRes.json();

      if (!coachRes.ok) {
        setError("Coach not found");
        setIsLoading(false);
        return;
      }

      setCoach(coachData.coach);

      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }
    } catch (err) {
      setError("Failed to load page");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push(`/signup?coach=${slug}`);
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/user-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachSlug: slug }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error === "Coach not found" || !coach) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-2xl font-bold mb-4">Coach not found</h1>
          <p className="text-gray-600 mb-6">
            This coach page doesn't exist or has been removed.
          </p>
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const monthlyPrice = (coach.user_monthly_price_cents || 0) / 100;
  const isActive = coach.is_active;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-xl font-semibold">{coach.business_name}</span>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.full_name}</span>
                <Link
                  href={
                    user.role === "coach" ? "/dashboard" : "/user/dashboard"
                  }
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <Link
                href={`/login?coach=${slug}`}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl bg-blue-100 text-blue-600">
            {coach.logo_url ? (
              <img
                src={coach.logo_url}
                alt={coach.business_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              coach.business_name?.charAt(0) || "?"
            )}
          </div>

          <h1 className="text-4xl font-bold mb-4">{coach.business_name}</h1>

          <p className="text-xl text-gray-600 mb-8">
            {coach.bio ||
              `Welcome to ${coach.business_name}. Subscribe to access exclusive content.`}
          </p>

          <div className="p-8 rounded-xl bg-white border border-gray-200 mb-8">
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="text-4xl font-bold">${monthlyPrice}</span>
              <span className="text-gray-600">/month</span>
            </div>

            {!isActive ? (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
                This coach is not currently accepting new subscribers.
              </div>
            ) : error && error !== "Coach not found" ? (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading || !isActive}
                className="btn btn-primary w-full py-4 text-base disabled:opacity-50"
              >
                {checkoutLoading
                  ? "Loading..."
                  : user
                  ? "Subscribe Now"
                  : "Sign Up & Subscribe"}
              </button>
            )}
          </div>

          <div className="p-12 rounded-xl bg-white border border-gray-200 border-dashed">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Subscriber Content</h3>
            <p className="text-gray-600">
              Subscribe to unlock exclusive content from {coach.business_name}
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6">
        <div className="container text-center text-sm text-gray-600">
          Powered by{" "}
          <Link href="/" className="link">
            Daily Companion
          </Link>
        </div>
      </footer>
    </div>
  );
}
