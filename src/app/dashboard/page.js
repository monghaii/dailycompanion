"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("resource-hub");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [headerConfig, setHeaderConfig] = useState({
    title: "BrainPeace",
    subtitle: "Mental Fitness for Active Minds",
  });
  const [brandingConfig, setBrandingConfig] = useState({
    primary_color: "#7c3aed",
    background_color: "#f9fafb",
    logo_url: null,
  });
  const [focusConfig, setFocusConfig] = useState({
    progress_bar: {
      title: "Today's Focus",
      subtitle: "Direct your energy intentionally",
    },
    task_1: {
      enabled: true,
      title: "Morning Meditation",
      subtitle: "Start your day centered",
      audio_url: "",
    },
    task_2: {
      enabled: true,
      title: "Set Daily Intention",
      subtitle: "What matters most today?",
    },
    task_3: {
      enabled: true,
      title: "Evening Reflection",
      subtitle: "Review your day",
    },
    day_notes: {
      title: "Day Notes",
      subtitle: "Capture thoughts and reflections",
    },
  });
  const [collections, setCollections] = useState([
    {
      id: 1,
      icon: "💡",
      title: "Bonus Library",
      description: "Extra practices to explore",
      type: "Self-Paced",
      items: 0,
      users: 156,
    },
    {
      id: 2,
      icon: "📹",
      title: "Community Calls",
      description: "Recorded sessions",
      type: "Drip",
      items: 0,
      users: 142,
    },
  ]);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.role === "coach") {
      fetchCoachConfig();
    }
  }, [user]);

  const fetchCoachConfig = async () => {
    try {
      const res = await fetch("/api/coach/config");
      const data = await res.json();

      if (res.ok && data.config) {
        let config = data.config;

        // Parse sections if they are strings
        const parseSection = (section) => {
          if (typeof section === "string") {
            try {
              return JSON.parse(section);
            } catch (e) {
              return section;
            }
          }
          return section;
        };

        if (config.focus_tab) {
          setFocusConfig((prev) => ({
            ...prev,
            ...parseSection(config.focus_tab),
          }));
        }

        if (config.header) {
          setHeaderConfig((prev) => ({
            ...prev,
            ...parseSection(config.header),
          }));
        }

        if (config.branding) {
          setBrandingConfig((prev) => ({
            ...prev,
            ...parseSection(config.branding),
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    }
  };

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

  const handleSaveConfig = async (section, data, successMessage) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch("/api/coach/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: [section],
          value: data,
        }),
      });

      const resData = await res.json();

      if (res.ok) {
        setToastMessage(successMessage || "✅ Config saved successfully!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage(
          "❌ Failed to save config: " + (resData.error || "Unknown error")
        );
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Save config error:", error);
      setToastMessage("❌ Failed to save config");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsSavingConfig(false);
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Coach Hub</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveSection("config")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === "config"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Config
          </button>

          <button
            onClick={() => setActiveSection("resource-hub")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === "resource-hub"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Resource Hub
          </button>

          <button
            onClick={() => setActiveSection("analytics")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === "analytics"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Analytics
          </button>

          <button
            onClick={() => setActiveSection("clients")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === "clients"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Clients
          </button>

          <button
            onClick={() => setActiveSection("finance")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === "finance"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Finance
          </button>

          <button
            onClick={() => setActiveSection("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === "settings"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
              {user?.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Config Content */}
        {activeSection === "config" && (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Configuration
              </h1>
              <p className="text-gray-600 mt-1">
                Customize your Daily Companion instance
              </p>
            </div>

            {/* Config Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Profile Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Profile Settings
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage your public profile information
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        defaultValue={coach?.business_name}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Your Coaching Business"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL Slug
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">/coach/</span>
                        <input
                          type="text"
                          defaultValue={coach?.slug}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="your-name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        defaultValue={coach?.bio}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Tell your clients about yourself..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Subscription Price
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">$</span>
                        <input
                          type="number"
                          defaultValue={
                            (coach?.user_monthly_price_cents || 0) / 100
                          }
                          className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="29"
                        />
                        <span className="text-sm text-gray-500">/month</span>
                      </div>
                    </div>
                    <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Branding */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Branding
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Customize the look and feel
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          {coach?.logo_url ? (
                            <img
                              src={coach.logo_url}
                              alt="Logo"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-2xl text-gray-400">📷</span>
                          )}
                        </div>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                          Upload Logo
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandingConfig.primary_color}
                          onChange={(e) =>
                            setBrandingConfig({
                              ...brandingConfig,
                              primary_color: e.target.value,
                            })
                          }
                          className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={brandingConfig.primary_color}
                          onChange={(e) =>
                            setBrandingConfig({
                              ...brandingConfig,
                              primary_color: e.target.value,
                            })
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandingConfig.background_color}
                          onChange={(e) =>
                            setBrandingConfig({
                              ...brandingConfig,
                              background_color: e.target.value,
                            })
                          }
                          className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={brandingConfig.background_color}
                          onChange={(e) =>
                            setBrandingConfig({
                              ...brandingConfig,
                              background_color: e.target.value,
                            })
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleSaveConfig(
                          "branding",
                          brandingConfig,
                          "✅ Branding saved successfully!"
                        )
                      }
                      disabled={isSavingConfig}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {isSavingConfig ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>

                {/* Header Customization */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Header Customization
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Customize the app header title and subtitle
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        App Title
                      </label>
                      <input
                        type="text"
                        value={headerConfig.title}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="BrainPeace"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        App Subtitle
                      </label>
                      <input
                        type="text"
                        value={headerConfig.subtitle}
                        onChange={(e) =>
                          setHeaderConfig({
                            ...headerConfig,
                            subtitle: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Mental Fitness for Active Minds"
                      />
                    </div>
                    <button
                      onClick={() =>
                        handleSaveConfig(
                          "header",
                          headerConfig,
                          "✅ Header config saved!"
                        )
                      }
                      disabled={isSavingConfig}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {isSavingConfig ? "Saving..." : "Save Header Config"}
                    </button>
                  </div>
                </div>

                {/* Focus Tab Configuration */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Focus Tab Customization
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Customize the daily focus experience for your clients
                    </p>
                  </div>
                  <div className="p-6 space-y-8">
                    {/* Progress Bar */}
                    <div className="pb-6 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        Progress Bar
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Main Title
                          </label>
                          <input
                            type="text"
                            value={focusConfig.progress_bar.title}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                progress_bar: {
                                  ...focusConfig.progress_bar,
                                  title: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Today's Focus"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={focusConfig.progress_bar.subtitle}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                progress_bar: {
                                  ...focusConfig.progress_bar,
                                  subtitle: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Direct your energy intentionally"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Task 1 */}
                    <div className="pb-6 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Task 1 (Morning)
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={focusConfig.task_1.enabled}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                task_1: {
                                  ...focusConfig.task_1,
                                  enabled: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600">Enabled</span>
                        </label>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={focusConfig.task_1.title}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                task_1: {
                                  ...focusConfig.task_1,
                                  title: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Task title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={focusConfig.task_1.subtitle}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                task_1: {
                                  ...focusConfig.task_1,
                                  subtitle: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Task description"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Audio File URL
                          </label>
                          <input
                            type="url"
                            value={focusConfig.task_1.audio_url || ""}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                task_1: {
                                  ...focusConfig.task_1,
                                  audio_url: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="https://..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Optional: Add a guided audio for this task
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Task 2 */}
                    <div className="pb-6 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Task 2 (Intention)
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={focusConfig.task_2.enabled}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                task_2: {
                                  ...focusConfig.task_2,
                                  enabled: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600">Enabled</span>
                        </label>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={focusConfig.task_2.title}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                task_2: {
                                  ...focusConfig.task_2,
                                  title: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Task title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={focusConfig.task_2.subtitle}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                task_2: {
                                  ...focusConfig.task_2,
                                  subtitle: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Task description"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Task 3 */}
                    <div className="pb-6 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Task 3 (Evening)
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={focusConfig.task_3.enabled}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                task_3: {
                                  ...focusConfig.task_3,
                                  enabled: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600">Enabled</span>
                        </label>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={focusConfig.task_3.title}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                task_3: {
                                  ...focusConfig.task_3,
                                  title: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Task title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={focusConfig.task_3.subtitle}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                task_3: {
                                  ...focusConfig.task_3,
                                  subtitle: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Task description"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Day Notes */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        Day Notes Section
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={focusConfig.day_notes.title}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                day_notes: {
                                  ...focusConfig.day_notes,
                                  title: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Day Notes"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={focusConfig.day_notes.subtitle}
                            onChange={(e) =>
                              setFocusConfig({
                                ...focusConfig,
                                day_notes: {
                                  ...focusConfig.day_notes,
                                  subtitle: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Description"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleSaveConfig(
                          "focus_tab",
                          focusConfig,
                          "✅ Focus tab config saved successfully!"
                        )
                      }
                      disabled={isSavingConfig}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingConfig ? "Saving..." : "Save Focus Tab Config"}
                    </button>
                  </div>
                </div>

                {/* Page Visibility */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Page Visibility
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Control who can see your page
                    </p>
                  </div>
                  <div className="p-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={coach?.is_active}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Make page public
                        </div>
                        <div className="text-xs text-gray-500">
                          Allow new subscribers to find and join your page
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Resource Hub Content */}
        {activeSection === "resource-hub" && (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Resource Hub
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Organize your content into themed collections
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/coach/${coach?.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Preview Client View
                  </Link>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Collection
                  </button>
                </div>
              </div>
            </div>

            {/* Collections Grid */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-4">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-4xl">{collection.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {collection.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {collection.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            collection.type === "Self-Paced"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {collection.type}
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {collection.items} items
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {collection.users} users
                          </div>
                        </div>
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Analytics */}
        {activeSection === "analytics" && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Analytics
              </h2>
              <p className="text-gray-600">Coming soon</p>
            </div>
          </div>
        )}

        {/* Clients */}
        {activeSection === "clients" && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Clients</h2>
              <p className="text-gray-600">Coming soon</p>
            </div>
          </div>
        )}

        {/* Finance */}
        {activeSection === "finance" && (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
              <p className="text-gray-600 mt-1">
                Manage your subscription and payment settings
              </p>
            </div>

            {/* Finance Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Platform Subscription Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Platform Subscription
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {coach?.platform_subscription_status === "active"
                            ? "Your subscription is active"
                            : "Choose a plan to activate your coaching platform"}
                        </p>
                      </div>
                      {coach?.platform_subscription_status === "active" && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {coach?.platform_subscription_status !== "active" && (
                    <div className="p-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => handleSubscribe("monthly")}
                          disabled={checkoutLoading}
                          className="group relative p-6 rounded-xl border-2 border-gray-200 hover:border-purple-500 bg-white hover:bg-purple-50/50 text-left transition-all duration-200"
                        >
                          <div className="text-2xl font-bold text-gray-900">
                            $50
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            per month
                          </div>
                          <div className="text-xs text-gray-500 mt-4">
                            Pay monthly
                          </div>
                        </button>

                        <button
                          onClick={() => handleSubscribe("yearly")}
                          disabled={checkoutLoading}
                          className="group relative p-6 rounded-xl border-2 border-gray-200 hover:border-purple-500 bg-white hover:bg-purple-50/50 text-left transition-all duration-200"
                        >
                          <div className="absolute -top-3 right-4 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                            Save $100
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            $500
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            per year
                          </div>
                          <div className="text-xs text-gray-500 mt-4">
                            Pay yearly
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {coach?.platform_subscription_status === "active" && (
                    <div className="p-6">
                      <div className="text-sm text-gray-600">
                        Subscription details and management coming soon
                      </div>
                    </div>
                  )}
                </div>

                {/* Stripe Connect Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Payout Account
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {coach?.stripe_account_status === "active"
                            ? "Your payout account is connected"
                            : "Connect your bank account to receive payments"}
                        </p>
                      </div>
                      {coach?.stripe_account_status === "active" && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Connected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    {coach?.stripe_account_status !== "active" ? (
                      <button
                        onClick={handleSetupPayouts}
                        disabled={
                          coach?.platform_subscription_status !== "active"
                        }
                        className={`btn ${
                          coach?.platform_subscription_status !== "active"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                        } px-6 py-3`}
                      >
                        Connect with Stripe
                      </button>
                    ) : (
                      <div className="text-sm text-gray-600">
                        Payout management coming soon
                      </div>
                    )}

                    {coach?.platform_subscription_status !== "active" && (
                      <p className="text-xs text-gray-500 mt-4">
                        Note: You must have an active subscription before
                        connecting your payout account
                      </p>
                    )}
                  </div>
                </div>

                {/* Revenue Stats Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Revenue Overview
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Track your earnings
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Total Revenue
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          $0
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          This Month
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          $0
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Subscribers
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          0
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Settings */}
        {activeSection === "settings" && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">⚙️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Settings
              </h2>
              <p className="text-gray-600">Coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-slideUp">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]">
            <span>{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="ml-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
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
