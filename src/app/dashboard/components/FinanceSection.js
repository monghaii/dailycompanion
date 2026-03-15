"use client";

import { useState, useEffect } from "react";

const COUNTRY_CURRENCY_SYMBOL = {
  US: "$",
  DE: "€",
  FR: "€",
  ES: "€",
  IT: "€",
  NL: "€",
  IE: "€",
  BE: "€",
  AT: "€",
  GB: "£",
  CA: "CA$",
  AU: "A$",
  NZ: "NZ$",
  CH: "CHF ",
  SG: "S$",
};

export default function FinanceSection({
  user,
  coach,
  checkAuthResponse,
  showToast,
  profileConfig,
  setProfileConfig,
  tier3PriceInput,
  setTier3PriceInput,
  isSavingConfig,
  setIsSavingConfig,
  savingSection,
  setSavingSection,
  handleSaveProfile,
  markPanelClean,
}) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [subInfo, setSubInfo] = useState(null);
  const [subInfoLoading, setSubInfoLoading] = useState(false);

  const cs = COUNTRY_CURRENCY_SYMBOL[coach?.stripe_country] || "$";

  useEffect(() => {
    if (coach?.platform_subscription_status === "active") {
      setSubInfoLoading(true);
      fetch("/api/coach/subscription-info")
        .then((r) => r.json())
        .then((data) => setSubInfo(data))
        .catch(() => {})
        .finally(() => setSubInfoLoading(false));
    }
  }, [coach?.id]);

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/coach-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (checkAuthResponse(res)) return;
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConnectStripe = () => {
    setShowCountryModal(true);
  };

  const confirmConnectStripe = async () => {
    setIsStripeLoading(true);
    setShowCountryModal(false);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selectedCountry }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast("Failed to create Stripe connection");
      }
    } catch (error) {
      console.error("Stripe connect error:", error);
      showToast("Failed to connect Stripe");
    } finally {
      setIsStripeLoading(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    setIsStripeLoading(true);
    try {
      const res = await fetch("/api/stripe/dashboard-link", {
        method: "POST",
      });
      const data = await res.json();

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        showToast("Failed to open Stripe dashboard");
      }
    } catch (error) {
      console.error("Stripe dashboard error:", error);
      showToast("Failed to open Stripe dashboard");
    } finally {
      setIsStripeLoading(false);
    }
  };

  return (
    <>
      <div className="flex-1 bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-600 mt-1">
            Manage your Stripe account and payouts
          </p>
        </div>
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Platform Subscription Required Banner */}
            {coach?.platform_subscription_status !== "active" && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400 rounded-xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-8 h-8 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Activate Your Coach Account
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Subscribe to the coaching platform to unlock all features,
                      connect your Stripe account, and start accepting clients.
                    </p>
                    <div className="flex flex-wrap gap-3 items-center">
                      <button
                        onClick={handleSubscribe}
                        disabled={checkoutLoading}
                        className="px-6 py-3 bg-[#fbbf24] text-black font-bold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                      >
                        {checkoutLoading ? "Loading..." : "Subscribe Now →"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Test Account Banner */}
            {coach?.platform_subscription_status === "active" &&
              !coach?.platform_subscription_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Test Account Mode:</span>{" "}
                    This account is manually activated. Real-time subscription
                    status and billing details are not available.
                  </p>
                </div>
              )}

            {/* Stripe Connect Status */}
            {coach?.platform_subscription_status === "active" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Stripe Connect
                </h2>
                {coach?.stripe_account_status === "active" ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        Connected and active
                      </span>
                    </div>
                    {coach?.stripe_country && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium text-gray-700">
                          Account Region:
                        </span>
                        <span>
                          {{
                            US: "United States (USD)",
                            DE: "Germany (EUR)",
                            GB: "United Kingdom (GBP)",
                            CA: "Canada (CAD)",
                            FR: "France (EUR)",
                            ES: "Spain (EUR)",
                            IT: "Italy (EUR)",
                            NL: "Netherlands (EUR)",
                            IE: "Ireland (EUR)",
                            BE: "Belgium (EUR)",
                            AT: "Austria (EUR)",
                            AU: "Australia (AUD)",
                            NZ: "New Zealand (NZD)",
                            CH: "Switzerland (CHF)",
                            SG: "Singapore (SGD)",
                          }[coach.stripe_country] || coach.stripe_country}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={handleOpenStripeDashboard}
                      disabled={isStripeLoading}
                      className="px-4 py-2 bg-[#fbbf24] text-black rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {isStripeLoading ? "Loading..." : "Open Stripe Dashboard"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <>
                      <p className="text-sm text-gray-600">
                        Connect your Stripe account to receive payments from
                        your clients.
                      </p>
                      <button
                        onClick={handleConnectStripe}
                        disabled={isStripeLoading}
                        className="px-4 py-2 bg-[#fbbf24] text-black rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        {isStripeLoading
                          ? "Loading..."
                          : "Connect Stripe Account"}
                      </button>
                    </>
                  </div>
                )}
              </div>
            )}

            {/* Your Subscription */}
            {coach?.platform_subscription_status === "active" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Subscription
                </h2>

                {subInfoLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                    Loading subscription details...
                  </div>
                ) : subInfo?.platform ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Status</span>
                        <div className="mt-1 flex items-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              subInfo.platform.status === "active"
                                ? "bg-green-500"
                                : subInfo.platform.status === "past_due"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />
                          <span className="font-medium text-gray-900 capitalize">
                            {subInfo.platform.status === "active" &&
                            subInfo.platform.cancel_at_period_end
                              ? "Canceling at period end"
                              : subInfo.platform.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Plan</span>
                        <p className="mt-1 font-medium text-gray-900">
                          {subInfo.platform.amount
                            ? `${cs}${(subInfo.platform.amount / 100).toFixed(2)}/${subInfo.platform.interval}`
                            : "Coach Plan"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Member since</span>
                        <p className="mt-1 font-medium text-gray-900">
                          {new Date(
                            subInfo.platform.created * 1000,
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">
                          {subInfo.platform.cancel_at_period_end
                            ? "Access until"
                            : "Next billing date"}
                        </span>
                        <p className="mt-1 font-medium text-gray-900">
                          {new Date(
                            subInfo.platform.current_period_end * 1000,
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {subInfo.platform.discount && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm">
                        <span className="font-medium text-green-800">
                          Discount applied:{" "}
                          {subInfo.platform.discount.coupon_name ||
                            (subInfo.platform.discount.percent_off
                              ? `${subInfo.platform.discount.percent_off}% off`
                              : subInfo.platform.discount.amount_off
                                ? `${cs}${(subInfo.platform.discount.amount_off / 100).toFixed(2)} off`
                                : "Active")}
                        </span>
                        {subInfo.platform.discount.duration &&
                          subInfo.platform.discount.duration !== "forever" && (
                            <span className="text-green-600 ml-1">
                              ({subInfo.platform.discount.duration})
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                ) : !coach?.platform_subscription_id ? (
                  <p className="text-sm text-gray-500">
                    This account was manually activated. No Stripe subscription
                    details available.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Unable to load subscription details.
                  </p>
                )}

                {/* Bundling / Sponsorships */}
                {subInfo?.sponsorships?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Bundled Client Subscriptions
                    </h3>
                    <div className="space-y-4">
                      {subInfo.sponsorships.map((sp) => {
                        const tierLabel =
                          sp.tier === 2
                            ? "Tier 2 - Daily Companion"
                            : `Tier 3 - ${coach?.tier3_name || "Premium Plus"}`;
                        const liveQty =
                          sp.stripe_details?.quantity ?? sp.quantity;
                        const feePerUser = sp.fee_per_user_cents / 100;
                        const totalMonthly =
                          (liveQty * sp.fee_per_user_cents) / 100;
                        const spCurrency =
                          COUNTRY_CURRENCY_SYMBOL[coach?.stripe_country] || "$";
                        const isActive =
                          (sp.stripe_details?.status || sp.status) === "active";

                        return (
                          <div
                            key={sp.tier}
                            className={`border rounded-lg p-4 ${isActive ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-gray-50"}`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">
                                {tierLabel}
                              </h4>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`}
                                />
                                {(
                                  sp.stripe_details?.status ||
                                  sp.status ||
                                  "unknown"
                                )
                                  .charAt(0)
                                  .toUpperCase() +
                                  (
                                    sp.stripe_details?.status ||
                                    sp.status ||
                                    "unknown"
                                  ).slice(1)}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-gray-500">
                                  Sponsored users
                                </span>
                                <p className="mt-0.5 font-semibold text-gray-900 text-lg">
                                  {liveQty}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Fee per user
                                </span>
                                <p className="mt-0.5 font-semibold text-gray-900 text-lg">
                                  {spCurrency}
                                  {feePerUser.toFixed(2)}/mo
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Total monthly
                                </span>
                                <p className="mt-0.5 font-semibold text-gray-900 text-lg">
                                  {spCurrency}
                                  {totalMonthly.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {sp.stripe_details?.current_period_end && (
                              <p className="text-xs text-gray-500 mb-3">
                                Next billing:{" "}
                                {new Date(
                                  sp.stripe_details.current_period_end * 1000,
                                ).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            )}

                            {sp.sponsored_users?.length > 0 && (
                              <div className="border-t border-gray-200 pt-3">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                  Sponsored members
                                </p>
                                <div className="space-y-1.5">
                                  {sp.sponsored_users.map((u, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold shrink-0">
                                          {(u.name || "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                        </div>
                                        <span className="text-gray-900">
                                          {u.name}
                                        </span>
                                      </div>
                                      <span className="text-gray-500 text-xs">
                                        since{" "}
                                        {new Date(u.since).toLocaleDateString(
                                          "en-US",
                                          { month: "short", year: "numeric" },
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Subscription Tiers */}
            {coach?.platform_subscription_status === "active" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Client Subscription Tiers
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Manage pricing for your client subscriptions. Tier 2 has a
                  flat {cs}5 fee. Tier 3 has a 20% fee (minimum {cs}5).
                </p>

                {/* Tier 2 */}
                <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Tier 2 - Daily Companion
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Standard access
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                      Fixed Price
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly:</span>
                      <span className="font-semibold text-gray-900">
                        {cs}9.99/month
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Yearly (1 month free):
                      </span>
                      <span className="font-semibold text-gray-900">
                        {cs}109.89/year
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-600">
                        Your revenue (monthly):
                      </span>
                      <span className="font-semibold text-green-600">
                        {cs}4.99
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tier 3 */}
                <div
                  className={`border rounded-lg p-4 ${profileConfig.tier3_enabled ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Tier 3 - {profileConfig.tier3_name || "Premium Plus"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Premium + exclusive Resource Hub access
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setProfileConfig((prev) => ({
                          ...prev,
                          tier3_enabled: !prev.tier3_enabled,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profileConfig.tier3_enabled
                          ? "bg-amber-500"
                          : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profileConfig.tier3_enabled
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {!profileConfig.tier3_enabled && (
                    <p className="text-sm text-gray-500 italic">
                      This tier is currently hidden from your landing page and
                      user dashboard. Toggle on to enable it.
                    </p>
                  )}

                  {profileConfig.tier3_enabled && (
                    <>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tier Name
                        </label>
                        <input
                          type="text"
                          maxLength={30}
                          value={profileConfig.tier3_name || ""}
                          onChange={(e) =>
                            setProfileConfig((prev) => ({
                              ...prev,
                              tier3_name: e.target.value,
                            }))
                          }
                          placeholder="Premium Plus"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm px-3 py-2 border mb-4"
                        />
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Set Monthly Price (minimum {cs}19.99)
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{cs}</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={tier3PriceInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*\.?\d{0,2}$/.test(val) || val === "") {
                                setTier3PriceInput(val);
                              }
                            }}
                            onBlur={() => {
                              const dollars =
                                parseFloat(tier3PriceInput) || 19.99;
                              const clamped = Math.max(dollars, 19.99);
                              const cents = Math.round(clamped * 100);
                              setTier3PriceInput(clamped.toFixed(2));
                              setProfileConfig((prev) => ({
                                ...prev,
                                user_monthly_price_cents: cents,
                              }));
                            }}
                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm px-3 py-2 border"
                          />
                          <span className="text-gray-500">/month</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly price:</span>
                          <span className="font-semibold text-gray-900">
                            {cs}
                            {(
                              (profileConfig.user_monthly_price_cents || 1999) /
                              100
                            ).toFixed(2)}
                            /month
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Yearly (1 month free):
                          </span>
                          <span className="font-semibold text-gray-900">
                            {cs}
                            {(
                              ((profileConfig.user_monthly_price_cents ||
                                1999) *
                                11) /
                              100
                            ).toFixed(2)}
                            /year
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-amber-300">
                          <span className="text-gray-600">
                            Platform fee (20% or {cs}5 min):
                          </span>
                          <span className="font-semibold text-gray-900">
                            {cs}
                            {(
                              Math.max(
                                Math.round(
                                  (profileConfig.user_monthly_price_cents ||
                                    1999) * 0.2,
                                ),
                                500,
                              ) / 100
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Your revenue (monthly):
                          </span>
                          <span className="font-semibold text-green-600">
                            {cs}
                            {(
                              ((profileConfig.user_monthly_price_cents ||
                                1999) -
                                Math.max(
                                  Math.round(
                                    (profileConfig.user_monthly_price_cents ||
                                      1999) * 0.2,
                                  ),
                                  500,
                                )) /
                              100
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    onClick={async () => {
                      setIsSavingConfig(true);
                      setSavingSection("tier3");
                      try {
                        await handleSaveProfile();
                        markPanelClean("landing");
                        showToast("Tier 3 settings saved!");
                      } catch (err) {
                        showToast("" + (err.message || "Failed to save"));
                      } finally {
                        setIsSavingConfig(false);
                        setSavingSection(null);
                      }
                    }}
                    disabled={isSavingConfig}
                    className="mt-4 w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {isSavingConfig && savingSection === "tier3"
                      ? "Saving..."
                      : "Save Tier 3 Settings"}
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Yearly billing gives clients 1 month
                    free (11 months price for 12 months of access). Tier 2 has a
                    flat {cs}5 platform fee. Tier 3 has a 20% platform fee
                    (minimum {cs}5).
                  </p>
                </div>
              </div>
            )}

            {/* Support Contact */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Need to manage or cancel your subscription? Contact{" "}
                <a
                  href="mailto:support@dailycompanion.app"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  support@dailycompanion.app
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Country Selection Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Select Your Country</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose the country where your bank account is located. This
              determines the currency your clients will be charged in.
            </p>
            <select
              className="w-full p-2 border rounded-md mb-3 bg-white text-gray-900"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="US">United States (USD)</option>
              <option value="DE">Germany (EUR)</option>
              <option value="GB">United Kingdom (GBP)</option>
              <option value="CA">Canada (CAD)</option>
              <option value="FR">France (EUR)</option>
              <option value="ES">Spain (EUR)</option>
              <option value="IT">Italy (EUR)</option>
              <option value="NL">Netherlands (EUR)</option>
              <option value="IE">Ireland (EUR)</option>
              <option value="BE">Belgium (EUR)</option>
              <option value="AT">Austria (EUR)</option>
              <option value="AU">Australia (AUD)</option>
              <option value="NZ">New Zealand (NZD)</option>
              <option value="CH">Switzerland (CHF)</option>
              <option value="SG">Singapore (SGD)</option>
            </select>
            <div className="bg-amber-50 border border-amber-300 rounded-md p-3 mb-3">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Choose carefully:</span> This
                selection is difficult to change later. All client subscriptions
                and payouts will use the currency associated with this country.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Important:</span> When Stripe
                asks for your email, use the same email address you used to sign
                up for Daily Companion ({user?.email}).
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCountryModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmConnectStripe}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                Continue to Stripe
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
