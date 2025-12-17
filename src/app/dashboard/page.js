"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "true";
  const subscriptionStatus = searchParams.get("subscription");

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (!res.ok || !data.user) {
        router.push("/coach/login");
        return;
      }

      if (data.user.role !== "coach") {
        router.push("/user/dashboard");
        return;
      }

      setUser(data.user);
    } catch (error) {
      router.push("/coach/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const handleSubscribe = async (plan) => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/coach-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSetupPayouts = async () => {
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Connect error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const coach = user?.coach;
  const needsSubscription = coach?.platform_subscription_status !== "active";
  const needsStripeConnect =
    !coach?.stripe_account_id || coach?.stripe_account_status !== "active";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-gray-900">
              <span className="text-blue-600">daily</span>companion
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">
                {user?.full_name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user?.role}
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
              {user?.full_name?.charAt(0)}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Alerts */}
        <div className="max-w-4xl mx-auto space-y-6">
          {isWelcome && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-900 flex items-center gap-3 shadow-sm">
              <span className="text-2xl">👋</span>
              <div>
                <h3 className="font-semibold">Welcome to Daily Companion!</h3>
                <p className="text-sm text-blue-700/80">
                  Complete the setup checklist below to start accepting
                  subscribers.
                </p>
              </div>
            </div>
          )}

          {subscriptionStatus === "success" && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center gap-3 shadow-sm">
              <span className="text-2xl">🎉</span>
              <div>
                <h3 className="font-semibold">Subscription Activated!</h3>
                <p className="text-sm text-green-700/80">
                  Your coaching platform is now live and ready for business.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Coach Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your platform and grow your business.
              </p>
            </div>
            <div className="hidden sm:block">
              <Link
                href={`/coach/${coach?.slug}`}
                target="_blank"
                className="btn btn-secondary text-sm"
              >
                View Public Page ↗
              </Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content - Setup Steps */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Setup Checklist
                  </h2>
                  <p className="text-sm text-gray-500">
                    Complete these steps to go live
                  </p>
                </div>

                <div className="p-6 space-y-8">
                  {/* Step 1: Platform Subscription */}
                  <div
                    className={`relative pl-10 ${
                      needsSubscription
                        ? ""
                        : "opacity-60 hover:opacity-100 transition-opacity"
                    }`}
                  >
                    <div className="absolute left-0 top-1 h-full w-0.5 bg-gray-200 -z-10 ml-4"></div>
                    <div
                      className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors z-10 ${
                        needsSubscription
                          ? "bg-white border-blue-600 text-blue-600 shadow-md ring-4 ring-blue-50"
                          : "bg-green-500 border-green-500 text-white"
                      }`}
                    >
                      {needsSubscription ? "1" : "✓"}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3
                          className={`text-lg font-semibold ${
                            needsSubscription
                              ? "text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          Platform Subscription
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {needsSubscription
                            ? "Choose a plan to activate your coaching platform."
                            : "Your subscription is active."}
                        </p>
                      </div>

                      {needsSubscription && (
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                          <button
                            onClick={() => handleSubscribe("monthly")}
                            disabled={checkoutLoading}
                            className="group relative p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-left transition-all duration-200"
                          >
                            <div className="font-semibold text-gray-900">
                              $50/month
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Pay monthly
                            </div>
                          </button>
                          <button
                            onClick={() => handleSubscribe("yearly")}
                            disabled={checkoutLoading}
                            className="group relative p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-left transition-all duration-200"
                          >
                            <div className="absolute -top-3 right-4 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                              Save $100
                            </div>
                            <div className="font-semibold text-gray-900">
                              $500/year
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Pay yearly
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Set Up Payouts */}
                  <div
                    className={`relative pl-10 ${
                      needsStripeConnect && !needsSubscription
                        ? ""
                        : "opacity-60 hover:opacity-100 transition-opacity"
                    }`}
                  >
                    <div className="absolute left-0 top-1 h-full w-0.5 bg-gray-200 -z-10 ml-4"></div>
                    <div
                      className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors z-10 ${
                        !needsStripeConnect
                          ? "bg-green-500 border-green-500 text-white"
                          : needsSubscription
                          ? "bg-white border-gray-300 text-gray-400"
                          : "bg-white border-blue-600 text-blue-600 shadow-md ring-4 ring-blue-50"
                      }`}
                    >
                      {!needsStripeConnect ? "✓" : "2"}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3
                          className={`text-lg font-semibold ${
                            needsStripeConnect && !needsSubscription
                              ? "text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          Set Up Payouts
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {!needsStripeConnect
                            ? "Your payout account is connected."
                            : "Connect your bank account to receive payments from subscribers."}
                        </p>
                      </div>

                      {needsStripeConnect && (
                        <button
                          onClick={handleSetupPayouts}
                          disabled={needsSubscription}
                          className={`btn ${
                            needsSubscription
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "btn-primary"
                          } w-full sm:w-auto`}
                        >
                          Connect with Stripe
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Add Content */}
                  <div className={`relative pl-10`}>
                    <div
                      className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 z-10 bg-white border-gray-300 text-gray-400`}
                    >
                      3
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">
                        Add Content
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Content management coming soon. Share videos, articles,
                        and resources with your subscribers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Your Page</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      coach?.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {coach?.is_active ? "Live" : "Draft"}
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-mono text-gray-600 break-all">
                    /coach/{coach?.slug}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subscription Price</span>
                    <span className="font-semibold text-gray-900">
                      ${(coach?.user_monthly_price_cents || 0) / 100}/mo
                    </span>
                  </div>

                  <Link
                    href={`/coach/${coach?.slug}`}
                    target="_blank"
                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    View Page
                  </Link>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900">Quick Stats</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">
                      Subscribers
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">$0</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">
                      Revenue
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CoachDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
