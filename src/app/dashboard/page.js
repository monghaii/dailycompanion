"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import CustomDomainWizard from "./components/CustomDomainWizard";

function ClientsSection() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch("/api/coach/clients");
      if (res.status === 401) { router.push("/coach/login"); return; }
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch clients");
        return;
      }

      setClients(data.clients);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status) {
    const badges = {
      active: { bg: "#D1FAE5", color: "#065F46", text: "Active" },
      past_due: { bg: "#FEF3C7", color: "#92400E", text: "Past Due" },
      canceled: { bg: "#FEE2E2", color: "#991B1B", text: "Canceled" },
      trialing: { bg: "#DBEAFE", color: "#1E40AF", text: "Trial" },
      no_subscription: {
        bg: "#F3F4F6",
        color: "#6B7280",
        text: "No Subscription",
      },
    };

    const badge = badges[status] || badges.no_subscription;

    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: badge.bg,
          color: badge.color,
        }}
      >
        {badge.text}
      </span>
    );
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function exportToCSV() {
    // Create CSV content in Kit-compatible format
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Status",
      "Joined Date",
    ];
    const rows = clients.map((client) => [
      client.firstName || "",
      client.lastName || "",
      client.email || "",
      client.subscriptionStatus || "no_subscription",
      formatDate(client.userCreatedAt),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `clients-export-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-1">
              Manage your client subscriptions
            </p>
          </div>
          {clients.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#fbbf24] text-black rounded-lg hover:bg-[#f59e0b] transition-colors font-medium"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-500 text-sm font-medium mb-1">
                Total Clients
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {clients.length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-500 text-sm font-medium mb-1">
                Active
              </div>
              <div className="text-3xl font-bold text-green-600">
                {
                  clients.filter((c) => c.subscriptionStatus === "active")
                    .length
                }
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-500 text-sm font-medium mb-1">
                No Subscription
              </div>
              <div className="text-3xl font-bold text-gray-600">
                {
                  clients.filter(
                    (c) => c.subscriptionStatus === "no_subscription",
                  ).length
                }
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-500 text-sm font-medium mb-1">
                Inactive
              </div>
              <div className="text-3xl font-bold text-red-600">
                {
                  clients.filter((c) =>
                    ["canceled", "past_due"].includes(c.subscriptionStatus),
                  ).length
                }
              </div>
            </div>
          </div>

          {/* Clients List */}
          {clients.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No clients yet
              </h3>
              <p className="text-gray-600">
                Your clients will appear here once they subscribe to your
                coaching services.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription Period
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.firstName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.lastName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(client.subscriptionStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(client.userCreatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.currentPeriodEnd
                            ? formatDate(client.currentPeriodEnd)
                            : "-"}
                          {client.canceledAt && (
                            <div className="text-xs text-red-600 mt-1">
                              Canceled: {formatDate(client.canceledAt)}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("coachSidebarOpen");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("coachDashboardActiveSection") || "finance";
    }
    return "finance";
  });

  // Save activeSection to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("coachDashboardActiveSection", activeSection);
    }
  }, [activeSection]);

  // Force finance tab if not subscribed
  useEffect(() => {
    if (
      user?.coach &&
      user.coach.platform_subscription_status !== "active" &&
      activeSection !== "finance"
    ) {
      setActiveSection("finance");
    }
  }, [user, activeSection]);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [headerConfig, setHeaderConfig] = useState({
    title: "BrainPeace",
    subtitle: "Mental Fitness for Active Minds",
  });
  const [profileConfig, setProfileConfig] = useState({
    business_name: "",
    slug: "",
    bio: "",
    tagline: "",
    landing_headline: "",
    landing_subheadline: "",
    landing_cta: "",
    user_monthly_price_cents: 1999,
    tier3_name: "Premium Plus",
    tier3_enabled: true,
    logo_url: null,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [tier3PriceInput, setTier3PriceInput] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [brandingConfig, setBrandingConfig] = useState({
    primary_color: "#7c3aed",
    background_type: "solid", // "solid" or "gradient"
    background_color: "#f9fafb",
    gradient_color_1: "#ff6b9d",
    gradient_color_2: "#ffa057",
    gradient_angle: 135,
    gradient_spread: 50,
    app_logo_url: null,
    app_logo_size: "medium", // "small", "medium", "large"
  });
  const [uploadingAppLogo, setUploadingAppLogo] = useState(false);
  const [audioLibrary, setAudioLibrary] = useState(
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      audio_url: "",
      audio_path: "",
      name: "",
    })),
  );
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 420, y: 100 };
    }
    return { x: 800, y: 100 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const previewIframeRef = useRef(null);
  const focusPreviewRef = useRef(null);
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
      icon_url: null,
    },
    task_2: {
      enabled: true,
      title: "Set Daily Intention",
      subtitle: "What matters most today?",
      icon_url: null,
      intention_modal_title: "Set Your Intention",
      intention_obstacles_label: "What might get in the way today?",
      intention_obstacles_placeholder:
        "Meetings, distractions, fatigue, worry about...",
      intention_focus_label: "One word to refocus your energy",
      intention_focus_placeholder: "Peace, Presence, Trust, Joy...",
    },
    task_3: {
      enabled: true,
      title: "Evening Reflection",
      subtitle: "Review your day",
      icon_url: null,
    },
    day_notes: {
      title: "Day Notes",
      subtitle: "Capture thoughts and reflections",
      icon_url: null,
    },
  });

  const [awarenessConfig, setAwarenessConfig] = useState({
    modal_title: "Nice catch!",
    logs: [
      {
        id: "present",
        label: "Present moment",
        prompt: "What pattern did you catch? What did you do instead?",
        placeholder: "I caught myself... and instead I...",
        color: "#60a5fa",
      },
      {
        id: "gratitude",
        label: "Felt gratitude",
        prompt: "What are you grateful for? How did it make you feel?",
        placeholder: "I felt grateful for... because...",
        color: "#4ade80",
      },
      {
        id: "pattern",
        label: "Shifted a pattern",
        prompt: "What pattern did you notice? What did you do differently?",
        placeholder: "I noticed... and changed by...",
        color: "#f87171",
      },
    ],
  });

  const [emotionalStateConfig, setEmotionalStateConfig] = useState({
    log_label: "Emotional State",
    modal_subtitle: "Select all that apply",
    categories: [
      {
        id: "challenging",
        label: "CHALLENGING",
        color: "#3b82f6",
        options: [
          {
            name: "Stressed",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Anxious",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Overwhelmed",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Sad",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Angry",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Frustrated",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Restless",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Lonely",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Tired",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Scattered",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
        ],
      },
      {
        id: "positive",
        label: "POSITIVE",
        color: "#10b981",
        options: [
          {
            name: "Calm",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Joyful",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Creative",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Energized",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Grateful",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Peaceful",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Hopeful",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Content",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Confident",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
          {
            name: "Inspired",
            audio_url: "",
            audio_path: "",
            practice_name: "",
            duration: "",
          },
        ],
      },
    ],
  });
  const [uploadingEmotionAudio, setUploadingEmotionAudio] = useState(null);
  const [draggedEmotionOption, setDraggedEmotionOption] = useState(null);
  const [uploadingBotProfilePicture, setUploadingBotProfilePicture] =
    useState(false);
  const [uploadingTaskIcon, setUploadingTaskIcon] = useState(null); // null or "task_1", "task_2", "task_3", "day_notes"
  const systemPromptRef = useRef(null);

  // Resource Hub State
  const [rhCollections, setRhCollections] = useState([]);
  const [rhContentItems, setRhContentItems] = useState([]);
  const [rhLoading, setRhLoading] = useState(false);
  const [rhEditing, setRhEditing] = useState(null); // collection id or null
  const [rhEditCollection, setRhEditCollection] = useState(null); // full collection object
  const [rhEditItems, setRhEditItems] = useState([]); // ordered items in editor
  const [rhContentFilter, setRhContentFilter] = useState("");
  const [rhContentTypeFilter, setRhContentTypeFilter] = useState("all");
  const [rhShowAddContent, setRhShowAddContent] = useState(false);
  const [rhSaving, setRhSaving] = useState(false);
  const [rhDragItem, setRhDragItem] = useState(null);
  const [rhDragOverIndex, setRhDragOverIndex] = useState(null);
  const [rhUploadingContent, setRhUploadingContent] = useState(false);
  const [rhIconPickerOpen, setRhIconPickerOpen] = useState(false);

  // Kit (ConvertKit) Integration State
  const [kitSettings, setKitSettings] = useState({
    enabled: false,
    apiKey: "",
    formId: "",
    tags: [],
    hasApiKey: false,
    lastSync: null,
    syncStatus: null,
    errorMessage: null,
  });
  const [kitTesting, setKitTesting] = useState(false);
  const [kitTestResult, setKitTestResult] = useState(null);
  const [kitSaving, setKitSaving] = useState(false);
  const [newTag, setNewTag] = useState("");

  const [coachTabConfig, setCoachTabConfig] = useState({
    bot_profile_picture_url: null,
    system_prompt: `You are a compassionate and insightful life coach. Your role is to:

1. **Listen deeply** - Pay attention to what the user shares and acknowledge their feelings
2. **Ask powerful questions** - Help users discover their own insights through thoughtful questions
3. **Provide guidance** - Offer practical advice and frameworks when appropriate
4. **Encourage growth** - Challenge users gently to step outside their comfort zone
5. **Stay positive** - Focus on possibilities and strengths while acknowledging challenges

Your coaching style:
- Use open-ended questions to help users reflect (e.g., "What would success look like for you?", "What's holding you back?")
- Validate their experiences before offering advice
- Share relevant frameworks or techniques (goal-setting, habit formation, mindfulness, etc.)
- Be warm, supportive, but also direct when needed
- Help users break down big goals into actionable steps
- Celebrate progress and small wins

Areas you can help with:
- Goal setting and achievement
- Building better habits
- Work-life balance
- Relationships and communication
- Confidence and self-esteem
- Career transitions
- Stress management
- Personal growth and self-discovery

Keep responses conversational, concise (2-4 paragraphs), and always end with either:
- A reflective question to deepen their thinking
- An actionable suggestion they can try today
- An invitation to share more about what they're experiencing

Remember: You're here to empower them to find their own answers, not to fix their problems for them.`,
    booking: {
      enabled: false,
      button_text: "Book a Call",
      ai_disclaimer:
        "Responses in chat are AI-generated and not directly from {coach_name}. This AI is trained on {coach_name}'s coaching style and experiences.",
      options: [
        {
          id: 1,
          title: "Discovery Call",
          duration: "30 min",
          description: "Free introductory session to discuss your goals",
          url: "",
        },
        {
          id: 2,
          title: "1:1 Coaching Session",
          duration: "60 min",
          description: "Deep-dive coaching session for focused growth",
          url: "",
        },
      ],
    },
  });

  const [landingConfig, setLandingConfig] = useState({
    hero: {
      headline: "Transform Your Life with Personalized Coaching",
      subheadline: "Join others on their journey to growth and fulfillment",
      cta_button_text: "Start Your Journey",
    },
    coach_info: {
      name: "",
      title: "Life & Wellness Coach",
      bio: "",
      photo_url: null,
    },
    pricing: {
      monthly_highlight: true,
      show_yearly: true,
      features: [
        "Daily guided practices",
        "AI-powered coaching conversations",
        "Progress tracking & insights",
        "Unlimited access to all features",
      ],
    },
    testimonials: [],
    branding: {
      primary_color: "#7c3aed",
      background_style: "gradient",
    },
  });

  const [tokenUsage, setTokenUsage] = useState({
    totalTokens: 0,
    subscriberCount: 0,
    averagePerUser: 0,
    tokenLimit: 1000000,
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

  // Handle Stripe Connect return flow
  useEffect(() => {
    const checkConnectStatus = async () => {
      if (typeof window === "undefined") return;

      const searchParams = new URLSearchParams(window.location.search);
      const connectParam = searchParams.get("connect");

      if (connectParam === "complete") {
        // Coach returned from Stripe onboarding
        setToastMessage(
          "Stripe account connected successfully! Checking status...",
        );
        setShowToast(true);

        // Check account status
        try {
          const res = await fetch("/api/stripe/account-status");
          const data = await res.json();

          if (data.status === "active") {
            setToastMessage(
              "✓ Stripe account is active and ready to receive payouts!",
            );
          } else {
            setToastMessage(
              "Stripe account connected. Status: pending verification.",
            );
          }

          // Refresh user data
          await fetchUser();
        } catch (error) {
          console.error("Failed to check account status:", error);
        }

        // Clean up URL
        window.history.replaceState({}, document.title, "/dashboard");
      } else if (connectParam === "refresh") {
        // Onboarding link expired, redirect to connect again
        setToastMessage("Session expired. Please try connecting again.");
        setShowToast(true);

        // Clean up URL
        window.history.replaceState({}, document.title, "/dashboard");
      }
    };

    checkConnectStatus();
  }, []);

  useEffect(() => {
    if (user?.role === "coach") {
      if (user.coach) {
        setProfileConfig({
          business_name: user.coach.business_name || "",
          slug: user.coach.slug || "",
          bio: user.coach.bio || "",
          tagline: user.coach.tagline || "",
          landing_headline: user.coach.landing_headline || "",
          landing_subheadline: user.coach.landing_subheadline || "",
          landing_cta: user.coach.landing_cta || "",
          user_monthly_price_cents: user.coach.user_monthly_price_cents || 1999,
          tier3_name: user.coach.tier3_name || "Premium Plus",
          tier3_enabled: user.coach.tier3_enabled !== false,
          logo_url: user.coach.logo_url || null,
        });
        setTier3PriceInput(
          ((user.coach.user_monthly_price_cents || 1999) / 100).toFixed(2),
        );
      }
      fetchCoachConfig();
      fetchTokenUsage();
    }
  }, [user]);

  // Save active section to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("coachDashboardActiveSection", activeSection);
    }
  }, [activeSection]);

  const fetchCoachConfig = async () => {
    try {
      const res = await fetch("/api/coach/config");
      if (checkAuthResponse(res)) return;
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

        if (config.awareness) {
          setAwarenessConfig((prev) => ({
            ...prev,
            ...parseSection(config.awareness),
          }));
        }

        if (config.focus_tab) {
          const focusTabConfig = parseSection(config.focus_tab);
          setFocusConfig((prev) => ({
            ...prev,
            ...focusTabConfig,
          }));

          // Load audio library if available
          if (focusTabConfig.audio_library) {
            setAudioLibrary(focusTabConfig.audio_library);
          }
          if (focusTabConfig.current_day_index !== undefined) {
            setCurrentDayIndex(focusTabConfig.current_day_index);
          }
        }

        if (config.awareness_tab) {
          setAwarenessConfig((prev) => ({
            ...prev,
            ...parseSection(config.awareness_tab),
          }));
        }

        if (config.emotional_state_tab) {
          const emotionalConfig = parseSection(config.emotional_state_tab);

          // Migrate old string format to new object format
          if (emotionalConfig.categories) {
            emotionalConfig.categories = emotionalConfig.categories.map(
              (cat) => ({
                ...cat,
                options: (cat.options || []).map((opt) => {
                  // If it's already an object, return it
                  if (typeof opt === "object" && opt !== null) {
                    return opt;
                  }
                  // If it's a string, convert to object
                  return {
                    name: opt,
                    audio_url: "",
                    audio_path: "",
                    practice_name: "",
                    duration: "",
                  };
                }),
              }),
            );
          }

          setEmotionalStateConfig((prev) => ({
            ...prev,
            ...emotionalConfig,
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

        if (config.coach_tab) {
          setCoachTabConfig((prev) => ({
            ...prev,
            ...parseSection(config.coach_tab),
          }));
        }
      }

      // Fetch landing page config (separate table)
      const landingRes = await fetch("/api/coach/landing-config");
      if (checkAuthResponse(landingRes)) return;
      const landingData = await landingRes.json();
      if (landingRes.ok && landingData.config) {
        setLandingConfig((prev) => ({
          ...prev,
          ...landingData.config,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    }
  };

  const fetchTokenUsage = async () => {
    try {
      const res = await fetch("/api/coach/token-usage");
      if (checkAuthResponse(res)) return;
      const data = await res.json();

      if (res.ok) {
        setTokenUsage(data);
      }
    } catch (error) {
      console.error("Failed to fetch token usage:", error);
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

  const checkAuthResponse = (res) => {
    if (res.status === 401) {
      router.push("/coach/login");
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

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

  const handleSetupPayouts = async () => {
    try {
      setPayoutLoading(true);
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      if (checkAuthResponse(res)) return;
      const data = await res.json();

      if (!res.ok) {
        setToastMessage("Failed to set up payouts. Please try again.");
        setShowToast(true);
        return;
      }

      if (data.url) {
        // Redirect to Stripe Connect onboarding
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Connect error:", error);
      setToastMessage("Failed to set up payouts. Please try again.");
      setShowToast(true);
    } finally {
      setPayoutLoading(false);
    }
  };

  // Preview modal drag handlers
  const handlePreviewMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - previewPosition.x,
      y: e.clientY - previewPosition.y,
    });
  };

  useEffect(() => {
    const handlePreviewMouseMove = (e) => {
      if (isDragging) {
        setPreviewPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handlePreviewMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handlePreviewMouseMove);
      document.addEventListener("mouseup", handlePreviewMouseUp);
      return () => {
        document.removeEventListener("mousemove", handlePreviewMouseMove);
        document.removeEventListener("mouseup", handlePreviewMouseUp);
      };
    }
  }, [isDragging, dragOffset, previewPosition]);

  // ── Resource Hub helpers ──
  const fetchRhCollections = async () => {
    try {
      const res = await fetch("/api/resource-hub/collections");
      if (checkAuthResponse(res)) return;
      if (res.ok) {
        const data = await res.json();
        setRhCollections(data.collections || []);
      }
    } catch (e) {
      console.error("Failed to fetch collections:", e);
    }
  };

  const fetchRhContent = async () => {
    try {
      const res = await fetch("/api/resource-hub/content");
      if (checkAuthResponse(res)) return;
      if (res.ok) {
        const data = await res.json();
        setRhContentItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch content:", e);
    }
  };

  const loadResourceHub = async () => {
    setRhLoading(true);
    await Promise.all([fetchRhCollections(), fetchRhContent()]);
    setRhLoading(false);
  };

  useEffect(() => {
    if (activeSection === "resource-hub" && rhCollections.length === 0 && !rhLoading) {
      loadResourceHub();
    }
  }, [activeSection]);

  const openCollectionEditor = async (collectionId) => {
    setRhEditing(collectionId);
    try {
      const res = await fetch(`/api/resource-hub/collections/${collectionId}`);
      if (checkAuthResponse(res)) return;
      if (res.ok) {
        const data = await res.json();
        setRhEditCollection(data.collection);
        setRhEditItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to load collection:", e);
    }
  };

  const handleCreateCollection = async () => {
    try {
      const res = await fetch("/api/resource-hub/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Collection" }),
      });
      if (checkAuthResponse(res)) return;
      if (res.ok) {
        const data = await res.json();
        await fetchRhCollections();
        openCollectionEditor(data.collection.id);
      }
    } catch (e) {
      console.error("Failed to create collection:", e);
    }
  };

  const handleDeleteCollection = async (id) => {
    if (!confirm("Delete this collection? This cannot be undone.")) return;
    try {
      const delRes = await fetch(`/api/resource-hub/collections/${id}`, { method: "DELETE" });
      if (checkAuthResponse(delRes)) return;
      setRhCollections((prev) => prev.filter((c) => c.id !== id));
      if (rhEditing === id) {
        setRhEditing(null);
        setRhEditCollection(null);
        setRhEditItems([]);
      }
    } catch (e) {
      console.error("Failed to delete collection:", e);
    }
  };

  const handleSaveCollection = async () => {
    if (!rhEditCollection) return;
    setRhSaving(true);
    try {
      // Save meta
      const title = document.getElementById("rh-col-title")?.value || rhEditCollection.title;
      const description = document.getElementById("rh-col-desc")?.value || "";
      const icon = rhEditCollection.icon || "folder";

      const metaRes = await fetch(`/api/resource-hub/collections/${rhEditCollection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, icon, delivery_mode: rhEditCollection.delivery_mode, is_published: rhEditCollection.is_published }),
      });

      if (checkAuthResponse(metaRes)) return;

      setRhEditCollection((prev) => ({ ...prev, title, description, icon }));

      // Save items
      const itemsPayload = rhEditItems.map((item) => ({
        item_type: item.item_type,
        content_item_id: item.item_type === "content" ? (item.content_item_id || item.content_item?.id) : null,
        pause_days: item.item_type === "pause" ? (item.pause_days || 1) : null,
      }));

      const res = await fetch(`/api/resource-hub/collections/${rhEditCollection.id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsPayload }),
      });

      if (checkAuthResponse(res)) return;

      if (res.ok) {
        const data = await res.json();
        setRhEditItems(data.items || []);
      }

      await fetchRhCollections();
      setToastMessage("Collection saved!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error("Failed to save collection:", e);
    }
    setRhSaving(false);
  };

  const handleAddContentItem = async (formData) => {
    setRhUploadingContent(true);
    try {
      let fileUrl = null;
      let fileSize = null;

      if (formData.link_url) {
        // Link mode — no file upload needed
      } else if (formData.file) {
        // File upload mode
        const uploadForm = new FormData();
        uploadForm.append("file", formData.file);
        uploadForm.append("type", formData.type === "pdf" ? "pdf" : formData.type === "video" ? "video" : "audio");

        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
        if (checkAuthResponse(uploadRes)) return;
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          alert("Upload failed: " + (err.error || "Unknown error"));
          setRhUploadingContent(false);
          return;
        }
        const uploadData = await uploadRes.json();
        fileUrl = uploadData.url;
        fileSize = formData.file.size;
      }

      const res = await fetch("/api/resource-hub/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          description: formData.description || null,
          duration: formData.duration || null,
          file_url: fileUrl,
          file_size: fileSize,
          link_url: formData.link_url || null,
        }),
      });

      if (checkAuthResponse(res)) return;

      if (res.ok) {
        await fetchRhContent();
        setRhShowAddContent(false);
        setToastMessage("Content added!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (e) {
      console.error("Failed to add content:", e);
      alert("Failed to add content");
    }
    setRhUploadingContent(false);
  };

  const handleDeleteContentItem = async (id) => {
    if (!confirm("Delete this content item?")) return;
    try {
      const delRes = await fetch(`/api/resource-hub/content/${id}`, { method: "DELETE" });
      if (checkAuthResponse(delRes)) return;
      setRhContentItems((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Failed to delete content:", e);
    }
  };

  const rhFilteredContent = rhContentItems.filter((item) => {
    const matchesSearch = !rhContentFilter || item.title.toLowerCase().includes(rhContentFilter.toLowerCase());
    const matchesType = rhContentTypeFilter === "all" || item.type === rhContentTypeFilter;
    return matchesSearch && matchesType;
  });

  // Lucide icon SVG paths for collections & content types
  const COLLECTION_ICONS = {
    folder: { label: "Folder", path: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" },
    book: { label: "Book", path: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 004 17V5a2 2 0 012-2h14v14H6.5" },
    "book-open": { label: "Book Open", paths: ["M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z", "M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"] },
    lightbulb: { label: "Lightbulb", paths: ["M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 006 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5", "M9 18h6", "M10 22h4"] },
    star: { label: "Star", path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    heart: { label: "Heart", path: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
    compass: { label: "Compass", paths: ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"] },
    target: { label: "Target", paths: ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M12 18a6 6 0 100-12 6 6 0 000 12z", "M12 14a2 2 0 100-4 2 2 0 000 4z"] },
    zap: { label: "Energy", path: "M13 2L3 14h9l-1 10 10-12h-9l1-10z" },
    flame: { label: "Flame", path: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" },
    brain: { label: "Brain", paths: ["M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 011.98-3L9.5 2z", "M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-1.98-3L14.5 2z"] },
    trophy: { label: "Trophy", paths: ["M6 9H4.5a2.5 2.5 0 010-5H6", "M18 9h1.5a2.5 2.5 0 000-5H18", "M4 22h16", "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22", "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22", "M18 2H6v7a6 6 0 0012 0V2z"] },
    award: { label: "Award", paths: ["M12 15a7 7 0 100-14 7 7 0 000 14z", "M8.21 13.89L7 23l5-3 5 3-1.21-9.12"] },
    music: { label: "Music", paths: ["M9 18V5l12-2v13", "M9 18a3 3 0 11-6 0 3 3 0 016 0z", "M21 16a3 3 0 11-6 0 3 3 0 016 0z"] },
    headphones: { label: "Headphones", paths: ["M3 18v-6a9 9 0 0118 0v6", "M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z", "M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"] },
    video: { label: "Video", paths: ["M23 7l-7 5 7 5V7z", "M1 5a2 2 0 012-2h11a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5z"] },
    "file-text": { label: "Document", paths: ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"] },
    "clipboard-list": { label: "Checklist", paths: ["M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2", "M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z", "M12 11h4", "M12 16h4", "M8 11h.01", "M8 16h.01"] },
    sun: { label: "Sun", paths: ["M12 16a4 4 0 100-8 4 4 0 000 8z", "M12 2v2", "M12 20v2", "M4.93 4.93l1.41 1.41", "M17.66 17.66l1.41 1.41", "M2 12h2", "M20 12h2", "M6.34 17.66l-1.41 1.41", "M19.07 4.93l-1.41 1.41"] },
    moon: { label: "Moon", path: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" },
    cloud: { label: "Cloud", path: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" },
    mountain: { label: "Mountain", paths: ["M8 3l4 8 5-5 5 15H2L8 3z"] },
    leaf: { label: "Leaf", paths: ["M11 20A7 7 0 019.8 6.9C15.5 4.9 20 1 20 1s-4 5.5-2 11.1A7 7 0 0111 20z", "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"] },
    dumbbell: { label: "Fitness", paths: ["M14.4 14.4L9.6 9.6", "M18.657 21.485l2.828-2.828-3.535-3.536-2.829 2.829", "M2.515 5.343L5.343 2.515l3.536 3.535-2.829 2.829", "M7.757 16.243l2.829-2.829 5.656 5.657-2.828 2.828", "M16.243 7.757l2.829-2.829-5.657-5.656-2.828 2.828"] },
    sparkles: { label: "Sparkles", paths: ["M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.963 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.581a.5.5 0 010 .964L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.963 0z", "M20 3v4", "M22 5h-4", "M4 17v2", "M5 18H3"] },
    rocket: { label: "Rocket", paths: ["M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z", "M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z", "M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0", "M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3"] },
    users: { label: "Community", paths: ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", "M9 11a4 4 0 100-8 4 4 0 000 8z", "M23 21v-2a4 4 0 00-3-3.87", "M16 3.13a4 4 0 010 7.75"] },
    "message-circle": { label: "Discussion", path: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
    palette: { label: "Creative", paths: ["M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10c0 .926-.126 1.821-.361 2.671A4 4 0 0115 18H13a2 2 0 00-1 3.75A10 10 0 0012 22z", "M8.5 9.5v.01", "M12 7.5v.01", "M15.5 9.5v.01", "M7.5 13v.01"] },
    lock: { label: "Private", paths: ["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z", "M7 11V7a5 5 0 0110 0v4"] },
    globe: { label: "Global", paths: ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M2 12h20", "M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"] },
    calendar: { label: "Schedule", paths: ["M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z", "M16 2v4", "M8 2v4", "M3 10h18"] },
    clock: { label: "Timed", paths: ["M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", "M12 6v6l4 2"] },
    "shield-check": { label: "Wellness", paths: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M9 12l2 2 4-4"] },
    gem: { label: "Premium", paths: ["M6 3h12l4 6-10 13L2 9z", "M11 3l1 10", "M2 9h20", "M6.5 3L11 9.5", "M17.5 3L13 9.5"] },
  };

  const renderCollectionIcon = (iconKey, size = 24, color = "#6b7280") => {
    const icon = COLLECTION_ICONS[iconKey];
    if (!icon) return <span style={{ fontSize: size, lineHeight: 1 }}>{iconKey}</span>;
    const pathData = icon.paths || (icon.path ? [icon.path] : []);
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {pathData.map((d, i) => <path key={i} d={d} />)}
      </svg>
    );
  };

  const CONTENT_TYPE_ICONS = {
    video: { paths: ["M23 7l-7 5 7 5V7z", "M1 5a2 2 0 012-2h11a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5z"] },
    audio: { paths: ["M3 18v-6a9 9 0 0118 0v6", "M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z", "M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"] },
    pdf: { paths: ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"] },
  };

  const renderContentTypeIcon = (type, size = 18, color) => {
    const colors = { video: "#2563eb", audio: "#be185d", pdf: "#92400e" };
    const c = color || colors[type] || "#6b7280";
    const icon = CONTENT_TYPE_ICONS[type];
    if (!icon) return null;
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon.paths.map((d, i) => <path key={i} d={d} />)}
      </svg>
    );
  };

  const getContentTypeIcon = (type) => renderContentTypeIcon(type, 20);

  const getContentTypeBadgeColor = (type) => {
    switch (type) {
      case "video": return { bg: "#dbeafe", text: "#1d4ed8" };
      case "audio": return { bg: "#fce7f3", text: "#be185d" };
      case "pdf": return { bg: "#fef3c7", text: "#92400e" };
      default: return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  // Send config updates to preview iframe — only called explicitly after save
  const sendConfigToPreview = () => {
    if (!showPreview || !previewIframeRef.current) return;

    const config = {
      header: headerConfig,
      branding: brandingConfig,
      focus_tab: focusConfig,
      awareness_tab: awarenessConfig,
      emotional_state_tab: emotionalStateConfig,
      coach_tab: coachTabConfig,
      audio_library: audioLibrary,
      current_day_index: currentDayIndex,
    };

    previewIframeRef.current.contentWindow?.postMessage(
      {
        type: "PREVIEW_CONFIG_UPDATE",
        config: config,
      },
      window.location.origin,
    );
  };

  // Send config to preview when it first opens
  useEffect(() => {
    if (!showPreview || !previewIframeRef.current) return;
    const timer = setTimeout(() => {
      sendConfigToPreview();
    }, 500);
    return () => clearTimeout(timer);
  }, [showPreview]);

  const handleLogoUpload = async (e) => {
    console.log("handleLogoUpload triggered", e);
    const file = e.target.files?.[0];
    console.log("Selected file:", file);
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setToastMessage(
        "❌ Please upload a valid image (JPEG, PNG, GIF, or WebP)",
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToastMessage("❌ File size must be less than 5MB");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setProfileConfig((prev) => ({ ...prev, logo_url: data.url }));
        setLogoLoadError(false);
        setToastMessage("✅ Logo uploaded! Remember to save your profile.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage("❌ " + (data.error || "Failed to upload logo"));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setToastMessage("❌ Failed to upload logo");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
      "audio/mp4",
      "audio/x-m4a",
    ];
    if (!validTypes.includes(file.type)) {
      setToastMessage("❌ Please upload a valid audio file (MP3, WAV, M4A)");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setToastMessage("❌ File size must be less than 50MB");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "audio");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setFocusConfig((prev) => ({
          ...prev,
          task_1: {
            ...prev.task_1,
            audio_url: data.url,
            audio_path: data.path,
          },
        }));
        setToastMessage(
          "✅ Audio uploaded! Remember to save your configuration.",
        );
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage("❌ " + (data.error || "Failed to upload audio"));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setToastMessage("❌ Failed to upload audio");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleRemoveAudio = () => {
    setFocusConfig((prev) => ({
      ...prev,
      task_1: {
        ...prev.task_1,
        audio_url: "",
        audio_path: "",
      },
    }));
    setToastMessage("Audio removed. Remember to save your configuration.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddEmotionOption = (catIndex) => {
    const newCategories = [...emotionalStateConfig.categories];

    // Limit to 10 options per category
    if (newCategories[catIndex].options.length >= 10) {
      alert("Maximum of 10 emotion options per category reached.");
      return;
    }

    newCategories[catIndex].options.push({
      name: "",
      audio_url: "",
      audio_path: "",
      practice_name: "",
      duration: "",
    });
    setEmotionalStateConfig({
      ...emotionalStateConfig,
      categories: newCategories,
    });
  };

  const handleRemoveEmotionOption = (catIndex, optIndex) => {
    const newCategories = [...emotionalStateConfig.categories];
    newCategories[catIndex].options.splice(optIndex, 1);
    setEmotionalStateConfig({
      ...emotionalStateConfig,
      categories: newCategories,
    });
  };

  const handleDragStartEmotionOption = (catIndex, optIndex) => {
    setDraggedEmotionOption({ catIndex, optIndex });
  };

  const handleDragOverEmotionOption = (e) => {
    e.preventDefault();
  };

  const handleDropEmotionOption = (catIndex, optIndex) => {
    if (!draggedEmotionOption || draggedEmotionOption.catIndex !== catIndex) {
      setDraggedEmotionOption(null);
      return;
    }

    const newCategories = [...emotionalStateConfig.categories];
    const category = newCategories[catIndex];
    const draggedItem = category.options[draggedEmotionOption.optIndex];

    // Remove from old position
    category.options.splice(draggedEmotionOption.optIndex, 1);

    // Insert at new position
    category.options.splice(optIndex, 0, draggedItem);

    setEmotionalStateConfig({
      ...emotionalStateConfig,
      categories: newCategories,
    });

    setDraggedEmotionOption(null);
  };

  const handleUpdateEmotionOption = (catIndex, optIndex, field, value) => {
    const newCategories = [...emotionalStateConfig.categories];
    newCategories[catIndex].options[optIndex][field] = value;
    setEmotionalStateConfig({
      ...emotionalStateConfig,
      categories: newCategories,
    });
  };

  const handleEmotionAudioUpload = async (e, catIndex, optIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
      "audio/mp4",
      "audio/x-m4a",
    ];
    if (!validTypes.includes(file.type)) {
      setToastMessage("❌ Please upload a valid audio file (MP3, WAV, M4A)");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setToastMessage("❌ File size must be less than 50MB");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setUploadingEmotionAudio(`${catIndex}-${optIndex}`);

    // Get audio duration from file
    const getAudioDuration = (file) => {
      return new Promise((resolve) => {
        const audio = document.createElement("audio");
        const objectUrl = URL.createObjectURL(file);
        audio.src = objectUrl;
        audio.addEventListener("loadedmetadata", () => {
          const duration = audio.duration;
          URL.revokeObjectURL(objectUrl);
          const minutes = Math.floor(duration / 60);
          const seconds = Math.floor(duration % 60);
          resolve(`${minutes} min${seconds > 0 ? ` ${seconds} sec` : ""}`);
        });
        audio.addEventListener("error", () => {
          URL.revokeObjectURL(objectUrl);
          resolve("");
        });
      });
    };

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "audio");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Get the duration from the audio file
        const audioDuration = await getAudioDuration(file);

        const newCategories = [...emotionalStateConfig.categories];
        newCategories[catIndex].options[optIndex].audio_url = data.url;
        newCategories[catIndex].options[optIndex].audio_path = data.path;
        // Auto-detect and set duration from audio file
        newCategories[catIndex].options[optIndex].duration = audioDuration;
        setEmotionalStateConfig({
          ...emotionalStateConfig,
          categories: newCategories,
        });
        setToastMessage(
          "✅ Audio uploaded! Remember to save your configuration.",
        );
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage("❌ " + (data.error || "Failed to upload audio"));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setToastMessage("❌ Failed to upload audio");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setUploadingEmotionAudio(null);
    }
  };

  const handleRemoveEmotionAudio = (catIndex, optIndex) => {
    const newCategories = [...emotionalStateConfig.categories];
    newCategories[catIndex].options[optIndex].audio_url = "";
    newCategories[catIndex].options[optIndex].audio_path = "";
    newCategories[catIndex].options[optIndex].duration = "";
    setEmotionalStateConfig({
      ...emotionalStateConfig,
      categories: newCategories,
    });
    setToastMessage("Audio removed. Remember to save your configuration.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleRemoveLogo = () => {
    setProfileConfig((prev) => ({ ...prev, logo_url: null }));
    setLogoLoadError(false);
    setToastMessage("Logo removed. Remember to save your profile.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveProfile = async () => {
    setIsSavingConfig(true);
    setSavingSection("profile");

    // Read current values from DOM
    const currentProfile = {
      ...profileConfig,
      bio: document.getElementById("profile-bio")?.value ?? profileConfig.bio,
      tagline: document.getElementById("profile-tagline")?.value ?? profileConfig.tagline,
      landing_headline: document.getElementById("profile-landing-headline")?.value ?? profileConfig.landing_headline,
      landing_subheadline: document.getElementById("profile-landing-subheadline")?.value ?? profileConfig.landing_subheadline,
      landing_cta: document.getElementById("profile-landing-cta")?.value ?? profileConfig.landing_cta,
    };

    setProfileConfig(currentProfile);

    try {
      const res = await fetch("/api/coach/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentProfile),
      });

      if (checkAuthResponse(res)) return;

      const data = await res.json();

      if (res.ok) {
        setToastMessage("✅ Profile updated successfully!");
        setShowToast(true);
        // Update local user state
        setUser((prev) => ({
          ...prev,
          coach: {
            ...prev.coach,
            ...data.coach,
          },
        }));
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage("❌ " + (data.error || "Failed to update profile"));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Save profile error:", error);
      setToastMessage("❌ Failed to save profile");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsSavingConfig(false);
      setSavingSection(null);
    }
  };

  const getLogoWidth = (size) => {
    switch (size) {
      case "small":
        return "80px";
      case "large":
        return "320px";
      case "medium":
      default:
        return "200px";
    }
  };

  const handleSaveConfig = async (section, data, successMessage) => {
    setIsSavingConfig(true);
    setSavingSection(section);
    try {
      const res = await fetch("/api/coach/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: [section],
          value: data,
        }),
      });

      if (checkAuthResponse(res)) return;

      const resData = await res.json();

      if (res.ok) {
        setToastMessage(successMessage || "✅ Config saved successfully!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setTimeout(() => sendConfigToPreview(), 100);
      } else {
        setToastMessage(
          "❌ Failed to save config: " + (resData.error || "Unknown error"),
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
      setSavingSection(null);
    }
  };

  const captureFocusScreenshot = async () => {
    if (!focusPreviewRef.current) return;
    try {
      const canvas = await html2canvas(focusPreviewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        width: 393,
        height: 852,
        windowWidth: 393,
      });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;
      const formData = new FormData();
      formData.append(
        "file",
        new File([blob], "focus-screenshot.png", { type: "image/png" }),
      );
      formData.append("type", "screenshot");
      formData.append("bucket", "public");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        await fetch("/api/coach/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: ["focus_screenshot_url"],
            value: data.url,
          }),
        });
      }
    } catch (err) {
      console.error("Screenshot capture error:", err);
    }
  };

  const handleSaveLandingConfig = async () => {
    setIsSavingConfig(true);
    setSavingSection("landing");

    // Read current values from DOM inputs
    const currentConfig = {
      hero: {
        headline: document.getElementById("landing-hero-headline")?.value || landingConfig.hero.headline,
        subheadline: document.getElementById("landing-hero-subheadline")?.value || landingConfig.hero.subheadline,
        cta_button_text: document.getElementById("landing-hero-cta")?.value || landingConfig.hero.cta_button_text,
      },
      coach_info: {
        ...landingConfig.coach_info,
        name: document.getElementById("landing-coach-name")?.value || landingConfig.coach_info.name,
        title: document.getElementById("landing-coach-title")?.value || landingConfig.coach_info.title,
        bio: document.getElementById("landing-coach-bio")?.value || landingConfig.coach_info.bio,
      },
      pricing: {
        ...landingConfig.pricing,
        monthly_highlight: document.getElementById("landing-pricing-monthly")?.checked ?? landingConfig.pricing.monthly_highlight,
        show_yearly: document.getElementById("landing-pricing-yearly")?.checked ?? landingConfig.pricing.show_yearly,
        features: (document.getElementById("landing-pricing-features")?.value || "").split("\n").filter((f) => f.trim()),
      },
      testimonials: landingConfig.testimonials,
      branding: landingConfig.branding,
    };

    setLandingConfig(currentConfig);

    try {
      const res = await fetch("/api/coach/landing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: currentConfig }),
      });

      if (checkAuthResponse(res)) return;

      const resData = await res.json();

      if (res.ok) {
        setToastMessage("✅ Landing page saved successfully!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage(
          "❌ Failed to save landing page: " +
            (resData.error || "Unknown error"),
        );
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Save landing config error:", error);
      setToastMessage("❌ Failed to save landing page");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsSavingConfig(false);
      setSavingSection(null);
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
        setToastMessage("❌ Failed to create Stripe connection");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Stripe connect error:", error);
      setToastMessage("❌ Failed to connect Stripe");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
        setToastMessage("❌ Failed to open Stripe dashboard");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Stripe dashboard error:", error);
      setToastMessage("❌ Failed to open Stripe dashboard");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsStripeLoading(false);
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
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Logo & Toggle */}
        <div
          className={`p-4 border-b border-gray-200 ${isSidebarOpen ? "flex items-center justify-between" : "flex flex-col items-center gap-2"}`}
        >
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Daily Companion"
                width={40}
                height={40}
                style={{ width: "40px", height: "40px" }}
              />
              <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap overflow-hidden">
                Coach Hub
              </h2>
            </div>
          ) : (
            <Image
              src="/logo.png"
              alt="Daily Companion"
              width={40}
              height={40}
              style={{ width: "40px", height: "40px" }}
            />
          )}
          <button
            onClick={() => {
              const newState = !isSidebarOpen;
              setIsSidebarOpen(newState);
              if (typeof window !== "undefined") {
                localStorage.setItem("coachSidebarOpen", String(newState));
              }
            }}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isSidebarOpen ? (
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
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            ) : (
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
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          <button
            onClick={() => setActiveSection("config")}
            disabled={coach?.platform_subscription_status !== "active"}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
              coach?.platform_subscription_status !== "active"
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer"
            } ${
              activeSection === "config"
                ? "bg-amber-100 text-amber-900 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title={
              coach?.platform_subscription_status !== "active"
                ? "Subscribe to unlock"
                : "Config"
            }
          >
            <svg
              className="w-6 h-6 shrink-0"
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
            {isSidebarOpen && <span>Config</span>}
          </button>

          <button
            onClick={() => setActiveSection("resource-hub")}
            disabled={coach?.platform_subscription_status !== "active"}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
              coach?.platform_subscription_status !== "active"
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer"
            } ${
              activeSection === "resource-hub"
                ? "bg-amber-100 text-amber-900 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title={
              coach?.platform_subscription_status !== "active"
                ? "Subscribe to unlock"
                : "Resource Hub"
            }
          >
            <svg
              className="w-6 h-6 shrink-0"
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
            {isSidebarOpen && <span>Resource Hub</span>}
          </button>

          <button
            onClick={() => setActiveSection("analytics")}
            disabled={coach?.platform_subscription_status !== "active"}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
              coach?.platform_subscription_status !== "active"
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer"
            } ${
              activeSection === "analytics"
                ? "bg-amber-100 text-amber-900 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title={
              coach?.platform_subscription_status !== "active"
                ? "Subscribe to unlock"
                : "Analytics"
            }
          >
            <svg
              className="w-6 h-6 shrink-0"
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
            {isSidebarOpen && <span>Analytics</span>}
          </button>

          <button
            onClick={() => setActiveSection("clients")}
            disabled={coach?.platform_subscription_status !== "active"}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
              coach?.platform_subscription_status !== "active"
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer"
            } ${
              activeSection === "clients"
                ? "bg-amber-100 text-amber-900 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title={
              coach?.platform_subscription_status !== "active"
                ? "Subscribe to unlock"
                : "Clients"
            }
          >
            <svg
              className="w-6 h-6 shrink-0"
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
            {isSidebarOpen && <span>Clients</span>}
          </button>

          <button
            onClick={() => setActiveSection("finance")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === "finance"
                ? "bg-amber-100 text-amber-900 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title="Finance"
          >
            <svg
              className="w-6 h-6 shrink-0"
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
            {isSidebarOpen && <span>Finance</span>}
          </button>

          <button
            onClick={() => setActiveSection("settings")}
            disabled={coach?.platform_subscription_status !== "active"}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
              coach?.platform_subscription_status !== "active"
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer"
            } ${
              activeSection === "settings"
                ? "bg-amber-100 text-amber-900 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title={
              coach?.platform_subscription_status !== "active"
                ? "Subscribe to unlock"
                : "Settings"
            }
          >
            <svg
              className="w-6 h-6 shrink-0"
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
            {isSidebarOpen && <span>Settings</span>}
          </button>
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
              {user?.full_name?.charAt(0)}
            </div>
            {isSidebarOpen && (
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
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clients Section */}
        {activeSection === "clients" && <ClientsSection />}

        {/* Analytics Section */}
        {activeSection === "analytics" && (
          <div className="flex-1 bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-1">
                View your coaching metrics and insights
              </p>
            </div>
            <div className="p-8">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="text-5xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Analytics Coming Soon
                  </h3>
                  <p className="text-gray-600">
                    Track client engagement, revenue metrics, and growth trends.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Finance Section */}
        {activeSection === "finance" && (
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
                          Subscribe to the coaching platform to unlock all
                          features, connect your Stripe account, and start
                          accepting clients.
                        </p>
                        <div className="flex flex-wrap gap-3 items-center">
                          <button
                            onClick={handleSubscribe}
                            disabled={checkoutLoading}
                            className="px-6 py-3 bg-[#fbbf24] text-black font-bold rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
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
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 shadow-sm rounded-r-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-blue-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <span className="font-bold">
                              Test Account Mode:
                            </span>{" "}
                            This account is manually activated. Real-time
                            subscription status and billing details are not
                            available.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Stripe Connect Status - Only show when subscribed */}
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
                        <button
                          onClick={handleOpenStripeDashboard}
                          disabled={isStripeLoading}
                          className="px-4 py-2 bg-[#fbbf24] text-black rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 font-semibold"
                        >
                          {isStripeLoading
                            ? "Loading..."
                            : "Open Stripe Dashboard"}
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
                            className="px-4 py-2 bg-[#fbbf24] text-black rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 font-semibold"
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

                {/* Subscription Tiers - Only show when subscribed */}
                {coach?.platform_subscription_status === "active" && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Subscription Tiers
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Manage pricing for your client subscriptions. Tier 2 has a
                      flat $5 fee. Tier 3 has a 20% fee (minimum $5).
                    </p>

                    {/* Tier 2 - Daily Companion (Fixed) */}
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
                            $9.99/month
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Yearly (1 month free):
                          </span>
                          <span className="font-semibold text-gray-900">
                            $109.89/year
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-300">
                          <span className="text-gray-600">
                            Your revenue (monthly):
                          </span>
                          <span className="font-semibold text-green-600">
                            $4.99
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tier 3 - Custom Name (Coach Sets Price) */}
                    <div
                      className={`border rounded-lg p-4 ${profileConfig.tier3_enabled ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50"}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Tier 3 -{" "}
                            {profileConfig.tier3_name || "Premium Plus"}
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
                          This tier is currently hidden from your landing page
                          and user dashboard. Toggle on to enable it.
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
                              Set Monthly Price (minimum $19.99)
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">$</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={tier3PriceInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (
                                    /^\d*\.?\d{0,2}$/.test(val) ||
                                    val === ""
                                  ) {
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
                              <span className="text-gray-600">
                                Monthly price:
                              </span>
                              <span className="font-semibold text-gray-900">
                                $
                                {(
                                  (profileConfig.user_monthly_price_cents ||
                                    1999) / 100
                                ).toFixed(2)}
                                /month
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Yearly (1 month free):
                              </span>
                              <span className="font-semibold text-gray-900">
                                $
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
                                Platform fee (20% or $5 min):
                              </span>
                              <span className="font-semibold text-gray-900">
                                $
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
                                $
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
                        onClick={handleSaveProfile}
                        disabled={isSavingConfig && savingSection === "profile"}
                        className="mt-4 w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 font-semibold"
                      >
                        {isSavingConfig && savingSection === "profile"
                          ? "Saving..."
                          : "Save Tier 3 Settings"}
                      </button>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> Yearly billing gives clients 1
                        month free (11 months price for 12 months of access).
                        Tier 2 has a flat $5 platform fee. Tier 3 has a 20%
                        platform fee (minimum $5).
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
        )}

        {/* Settings Section */}
        {activeSection === "settings" && (
          <div className="flex-1 bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">
                Manage your custom domain and account settings
              </p>
            </div>
            <div style={{ padding: "32px" }}>
              <div
                style={{
                  maxWidth: "900px",
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "40px",
                }}
              >
                <CustomDomainWizard />

                {/* Kit (ConvertKit) Integration */}
                <div>
                  <div style={{ marginBottom: "32px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            margin: 0,
                          }}
                        >
                          Kit (ConvertKit) Integration
                        </h2>
                        <p
                          style={{
                            color: "#6B7280",
                            fontSize: "16px",
                            marginTop: "8px",
                          }}
                        >
                          Automatically sync your subscribers to your Kit email
                          list
                        </p>
                      </div>
                      <label
                        style={{
                          position: "relative",
                          display: "inline-flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={kitSettings.enabled}
                          onChange={(e) =>
                            setKitSettings({
                              ...kitSettings,
                              enabled: e.target.checked,
                            })
                          }
                          style={{
                            position: "absolute",
                            opacity: 0,
                            pointerEvents: "none",
                          }}
                        />
                        <div
                          style={{
                            width: "44px",
                            height: "24px",
                            backgroundColor: kitSettings.enabled
                              ? "#fbbf24"
                              : "#d1d5db",
                            borderRadius: "12px",
                            position: "relative",
                            transition: "background-color 0.2s",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: "2px",
                              left: kitSettings.enabled ? "22px" : "2px",
                              width: "20px",
                              height: "20px",
                              backgroundColor: "#fff",
                              borderRadius: "50%",
                              transition: "left 0.2s",
                            }}
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    {/* API Key */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                      >
                        Kit API Key
                      </label>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          marginBottom: "12px",
                        }}
                      >
                        Find your API key in Kit under{" "}
                        <a
                          href="https://app.convertkit.com/account_settings/advanced_settings"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#f59e0b",
                            textDecoration: "underline",
                          }}
                        >
                          Settings → Advanced → API
                        </a>
                      </p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="password"
                          value={kitSettings.apiKey}
                          onChange={(e) =>
                            setKitSettings({
                              ...kitSettings,
                              apiKey: e.target.value,
                            })
                          }
                          style={{
                            flex: 1,
                            padding: "10px 14px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none",
                          }}
                          placeholder="Enter your Kit API key"
                        />
                        <button
                          onClick={async () => {
                            if (!kitSettings.apiKey) {
                              setKitTestResult({
                                success: false,
                                error: "Please enter an API key",
                              });
                              return;
                            }
                            setKitTesting(true);
                            setKitTestResult(null);
                            try {
                              const sessionToken = document.cookie
                                .split("; ")
                                .find((row) => row.startsWith("session_token="))
                                ?.split("=")[1];

                              const res = await fetch("/api/coach/kit/test", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  sessionToken,
                                  apiKey: kitSettings.apiKey,
                                }),
                              });
                              const data = await res.json();
                              setKitTestResult(data);
                            } catch (error) {
                              setKitTestResult({
                                success: false,
                                error: error.message,
                              });
                            } finally {
                              setKitTesting(false);
                            }
                          }}
                          disabled={kitTesting}
                          style={{
                            padding: "10px 16px",
                            backgroundColor: kitTesting ? "#e5e7eb" : "#f3f4f6",
                            color: "#374151",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: kitTesting ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {kitTesting ? "Testing..." : "Test Connection"}
                        </button>
                      </div>

                      {/* Test Result */}
                      {kitTestResult && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "12px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: kitTestResult.success
                              ? "#f0fdf4"
                              : "#fef2f2",
                            color: kitTestResult.success
                              ? "#166534"
                              : "#991b1b",
                            border: `1px solid ${kitTestResult.success ? "#bbf7d0" : "#fecaca"}`,
                          }}
                        >
                          {kitTestResult.success ? (
                            <div>
                              <p style={{ fontWeight: "600" }}>
                                ✓ Connection successful!
                              </p>
                              {kitTestResult.account && (
                                <p
                                  style={{ fontSize: "12px", marginTop: "4px" }}
                                >
                                  Connected to: {kitTestResult.account.name} (
                                  {kitTestResult.account.primary_email})
                                </p>
                              )}
                            </div>
                          ) : (
                            <p>
                              ✗ {kitTestResult.error || "Connection failed"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Form ID (Optional) */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                      >
                        Form ID (Optional)
                      </label>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          marginBottom: "12px",
                        }}
                      >
                        Subscribe users to a specific form. Leave empty to add
                        as general subscribers.
                      </p>
                      <input
                        type="text"
                        value={kitSettings.formId}
                        onChange={(e) =>
                          setKitSettings({
                            ...kitSettings,
                            formId: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        placeholder="e.g., 1234567"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                      >
                        Tags
                      </label>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          marginBottom: "12px",
                        }}
                      >
                        Tags to apply to new subscribers. We'll automatically
                        add status and coach tags.
                      </p>

                      {/* Existing Tags */}
                      {kitSettings.tags.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginBottom: "12px",
                          }}
                        >
                          {kitSettings.tags.map((tag, index) => (
                            <span
                              key={index}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 12px",
                                backgroundColor: "#fef3c7",
                                color: "#92400e",
                                borderRadius: "16px",
                                fontSize: "14px",
                              }}
                            >
                              {tag}
                              <button
                                onClick={() => {
                                  const newTags = kitSettings.tags.filter(
                                    (_, i) => i !== index,
                                  );
                                  setKitSettings({
                                    ...kitSettings,
                                    tags: newTags,
                                  });
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#92400e",
                                  cursor: "pointer",
                                  padding: "0 4px",
                                  fontSize: "18px",
                                  lineHeight: "1",
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Add Tag Input */}
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && newTag.trim()) {
                              e.preventDefault();
                              setKitSettings({
                                ...kitSettings,
                                tags: [...kitSettings.tags, newTag.trim()],
                              });
                              setNewTag("");
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: "10px 14px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none",
                          }}
                          placeholder="Enter tag name"
                        />
                        <button
                          onClick={() => {
                            if (newTag.trim()) {
                              setKitSettings({
                                ...kitSettings,
                                tags: [...kitSettings.tags, newTag.trim()],
                              });
                              setNewTag("");
                            }
                          }}
                          style={{
                            padding: "10px 16px",
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Add Tag
                        </button>
                      </div>
                    </div>

                    {/* Sync Status */}
                    {kitSettings.syncStatus && (
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                        >
                          Sync Status
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            fontSize: "14px",
                          }}
                        >
                          <p>
                            <span style={{ color: "#6b7280" }}>Status:</span>{" "}
                            <span
                              style={{
                                fontWeight: "500",
                                color:
                                  kitSettings.syncStatus === "success"
                                    ? "#059669"
                                    : kitSettings.syncStatus === "error"
                                      ? "#dc2626"
                                      : "#6b7280",
                              }}
                            >
                              {kitSettings.syncStatus}
                            </span>
                          </p>
                          {kitSettings.lastSync && (
                            <p>
                              <span style={{ color: "#6b7280" }}>
                                Last Sync:
                              </span>{" "}
                              {new Date(kitSettings.lastSync).toLocaleString()}
                            </p>
                          )}
                          {kitSettings.errorMessage && (
                            <p
                              style={{
                                color: "#dc2626",
                                fontSize: "12px",
                                marginTop: "8px",
                              }}
                            >
                              {kitSettings.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        paddingTop: "16px",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <button
                        onClick={async () => {
                          setKitSaving(true);
                          try {
                            const sessionToken = document.cookie
                              .split("; ")
                              .find((row) => row.startsWith("session_token="))
                              ?.split("=")[1];

                            const res = await fetch("/api/coach/kit/settings", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                sessionToken,
                                kitApiKey: kitSettings.apiKey,
                                kitEnabled: kitSettings.enabled,
                                kitFormId: kitSettings.formId,
                                kitTags: kitSettings.tags,
                              }),
                            });

                            const data = await res.json();

                            if (data.success) {
                              setToastMessage(
                                "✓ Kit settings saved successfully!",
                              );
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            } else {
                              setToastMessage("✗ Failed to save Kit settings");
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            }
                          } catch (error) {
                            setToastMessage("✗ Error saving Kit settings");
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 3000);
                          } finally {
                            setKitSaving(false);
                          }
                        }}
                        disabled={kitSaving}
                        style={{
                          padding: "10px 24px",
                          backgroundColor: kitSaving ? "#e5e7eb" : "#fbbf24",
                          color: "#000",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: kitSaving ? "not-allowed" : "pointer",
                          opacity: kitSaving ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!kitSaving)
                            e.currentTarget.style.backgroundColor = "#f59e0b";
                        }}
                        onMouseLeave={(e) => {
                          if (!kitSaving)
                            e.currentTarget.style.backgroundColor = "#fbbf24";
                        }}
                      >
                        {kitSaving ? "Saving..." : "Save Kit Settings"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Config Content */}
        {activeSection === "config" && (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Configuration
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Customize your Daily Companion instance
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-4 py-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-black rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="3"
                      width="20"
                      height="14"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  Preview
                </button>
              </div>
            </div>

            {/* Config Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Profile Settings and Landing Page Configuration */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <details className="group">
                    <summary className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer list-none">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Profile Settings and Landing Page Configuration
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Manage your public profile and landing page
                        </p>
                      </div>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                        ▼
                      </span>
                    </summary>
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Business Name
                          </label>
                          <input
                            type="text"
                            value={profileConfig.business_name}
                            onChange={(e) =>
                              setProfileConfig({
                                ...profileConfig,
                                business_name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                            placeholder="Your Coaching Business"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Landing Page URL Slug
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 shrink-0">
                              /coach/
                            </span>
                            <input
                              type="text"
                              value={profileConfig.slug}
                              onChange={(e) => {
                                // Auto-format slug: lowercase, replace spaces with hyphens, remove special chars
                                const formattedSlug = e.target.value
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")
                                  .replace(/[^a-z0-9-]/g, "");
                                setProfileConfig({
                                  ...profileConfig,
                                  slug: formattedSlug,
                                });
                              }}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              placeholder="your-name"
                            />
                            <a
                              href={`/coach/${
                                profileConfig.slug || "your-slug"
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-sm bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center gap-2 shrink-0"
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
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                              View Page
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Logo Upload */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Business Logo
                        </label>
                        <p className="text-xs text-gray-400 mb-2">
                          This also serves as the favicon (browser tab icon) for
                          your companion app and landing page.
                        </p>
                        <div className="flex items-start gap-4">
                          {profileConfig.logo_url && !logoLoadError ? (
                            <div className="relative">
                              <img
                                src={profileConfig.logo_url}
                                alt="Business Logo"
                                onError={(e) => {
                                  console.error(
                                    "Image failed to load:",
                                    profileConfig.logo_url,
                                  );
                                  setLogoLoadError(true);
                                }}
                                onLoad={() => setLogoLoadError(false)}
                                className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ) : logoLoadError && profileConfig.logo_url ? (
                            <div className="relative">
                              <div className="w-24 h-24 border-2 border-red-300 rounded-lg flex flex-col items-center justify-center text-red-500 text-xs p-2 text-center bg-red-50">
                                <span className="text-lg mb-1">⚠️</span>
                                <span>Failed to load</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                              <span className="text-2xl">🖼️</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              id="logo-upload"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={handleLogoUpload}
                              className="hidden"
                              disabled={uploadingLogo}
                            />
                            <label
                              htmlFor="logo-upload"
                              onClick={() => console.log("Label clicked")}
                              className={`inline-block px-4 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer transition-colors ${
                                uploadingLogo
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {uploadingLogo ? "Uploading..." : "Choose Image"}
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                              JPEG, PNG, GIF, or WebP. Max 5MB.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Recommended: Square image, at least 200x200px
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Bio
                          </label>
                          <textarea
                            rows={3}
                            id="profile-bio"
                            defaultValue={profileConfig.bio}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                            placeholder="Tell your clients about yourself..."
                          />
                        </div>
                      </div>

                      {/* Landing Page Content */}
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                          Landing Page Content
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Your Title/Role
                            </label>
                            <input
                              type="text"
                              id="profile-tagline"
                              defaultValue={profileConfig.tagline}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              placeholder="Life & Wellness Coach"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Main Headline
                            </label>
                            <input
                              type="text"
                              id="profile-landing-headline"
                              defaultValue={profileConfig.landing_headline}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              placeholder="Transform Your Life with Personalized Coaching"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Subheadline
                            </label>
                            <input
                              type="text"
                              id="profile-landing-subheadline"
                              defaultValue={profileConfig.landing_subheadline}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              placeholder="Join others on their journey to growth and fulfillment"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Call-to-Action Button Text
                            </label>
                            <input
                              type="text"
                              id="profile-landing-cta"
                              defaultValue={profileConfig.landing_cta}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              placeholder="Start Your Journey"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Direct Signup Links */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-purple-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                            Direct Signup Links
                          </h3>
                          <p className="text-xs text-gray-600 mb-4">
                            Share these links to allow users to sign up directly
                            for free or premium
                          </p>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Free Signup Link
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={`${window.location.origin}/signup?coach=${coach?.slug}&plan=free`}
                                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-mono"
                                  onClick={(e) => e.target.select()}
                                />
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/signup?coach=${coach?.slug}&plan=free`,
                                    );
                                    const btn = event.target;
                                    const originalText = btn.textContent;
                                    btn.textContent = "✓";
                                    btn.classList.add("bg-green-600");
                                    setTimeout(() => {
                                      btn.textContent = originalText;
                                      btn.classList.remove("bg-green-600");
                                    }, 2000);
                                  }}
                                  className="px-3 py-2 bg-[#fbbf24] text-black text-xs font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors whitespace-nowrap"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Daily Companion Signup Link ($9.99/month)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={`${window.location.origin}/signup?coach=${coach?.slug}&plan=premium`}
                                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-mono"
                                  onClick={(e) => e.target.select()}
                                />
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/signup?coach=${coach?.slug}&plan=premium`,
                                    );
                                    const btn = event.target;
                                    const originalText = btn.textContent;
                                    btn.textContent = "✓";
                                    btn.classList.add("bg-green-600");
                                    setTimeout(() => {
                                      btn.textContent = originalText;
                                      btn.classList.remove("bg-green-600");
                                    }, 2000);
                                  }}
                                  className="px-3 py-2 bg-[#fbbf24] text-black text-xs font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors whitespace-nowrap"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Advanced Landing Page Settings */}
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-md font-semibold text-gray-900 mb-4">
                          Advanced Landing Page Settings
                        </h3>

                        {/* Hero Section */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Hero Section
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Headline
                              </label>
                              <input
                                type="text"
                                id="landing-hero-headline"
                                defaultValue={landingConfig.hero.headline}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Transform Your Life..."
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Subheadline
                              </label>
                              <input
                                type="text"
                                id="landing-hero-subheadline"
                                defaultValue={landingConfig.hero.subheadline}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Join others on their journey..."
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                CTA Button Text
                              </label>
                              <input
                                type="text"
                                id="landing-hero-cta"
                                defaultValue={landingConfig.hero.cta_button_text}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Start Your Journey"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Coach Info Section */}
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Coach Information Display
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Display Name
                              </label>
                              <input
                                type="text"
                                id="landing-coach-name"
                                defaultValue={landingConfig.coach_info.name}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Your Name"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Title
                              </label>
                              <input
                                type="text"
                                id="landing-coach-title"
                                defaultValue={landingConfig.coach_info.title}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Life & Wellness Coach"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Bio
                              </label>
                              <textarea
                                id="landing-coach-bio"
                                defaultValue={landingConfig.coach_info.bio}
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Brief bio about your coaching approach..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Pricing Features */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Pricing Features
                          </h4>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id="landing-pricing-monthly"
                                defaultChecked={
                                  landingConfig.pricing.monthly_highlight
                                }
                                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <label className="text-xs font-medium text-gray-700">
                                Highlight Monthly Plan (shows "Most Popular"
                                badge)
                              </label>
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id="landing-pricing-yearly"
                                defaultChecked={landingConfig.pricing.show_yearly}
                                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <label className="text-xs font-medium text-gray-700">
                                Show Yearly Plan Option
                              </label>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Feature List (one per line)
                              </label>
                              <textarea
                                id="landing-pricing-features"
                                defaultValue={landingConfig.pricing.features.join(
                                  "\n",
                                )}
                                rows={5}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                                placeholder="Daily guided practices&#10;AI-powered coaching&#10;Progress tracking"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-6">
                        <a
                          href={`/coach/${coach?.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2"
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
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          Preview Landing Page
                        </a>

                        <div className="flex flex-col gap-3">
                          <button
                            onClick={handleSaveProfile}
                            disabled={
                              isSavingConfig && savingSection === "profile"
                            }
                            className="w-full px-6 py-2.5 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingConfig && savingSection === "profile"
                              ? "Saving..."
                              : "Save Profile"}
                          </button>
                          <button
                            onClick={handleSaveLandingConfig}
                            disabled={
                              isSavingConfig && savingSection === "landing"
                            }
                            className="w-full px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingConfig && savingSection === "landing"
                              ? "Saving..."
                              : "Save Landing Page"}
                          </button>
                          <button
                            onClick={async () => {
                              setSavingSection("screenshot");
                              setIsSavingConfig(true);
                              await captureFocusScreenshot();
                              setToastMessage(
                                "✅ Landing page screenshot updated!",
                              );
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                              setIsSavingConfig(false);
                              setSavingSection(null);
                            }}
                            disabled={
                              isSavingConfig && savingSection === "screenshot"
                            }
                            className="w-full px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingConfig && savingSection === "screenshot"
                              ? "Updating..."
                              : "Update Landing Page App Preview"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Branding */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <details className="group">
                    <summary className="p-6 border-b border-gray-100 bg-gray-50/50 cursor-pointer list-none flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Branding
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Customize the look and feel of branding throughout
                          your users' experience.
                        </p>
                      </div>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                        ▼
                      </span>
                    </summary>
                    <div className="p-6 space-y-6">
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
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Background Style */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Style
                        </label>
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() =>
                              setBrandingConfig({
                                ...brandingConfig,
                                background_type: "solid",
                              })
                            }
                            className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                              brandingConfig.background_type === "solid"
                                ? "border-purple-600 bg-purple-50 text-purple-700"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            Solid Color
                          </button>
                          <button
                            onClick={() =>
                              setBrandingConfig({
                                ...brandingConfig,
                                background_type: "gradient",
                              })
                            }
                            className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                              brandingConfig.background_type === "gradient"
                                ? "border-purple-600 bg-purple-50 text-purple-700"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            Gradient
                          </button>
                        </div>

                        {brandingConfig.background_type === "solid" ? (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
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
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Gradient Color 1 */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Gradient Color 1
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={brandingConfig.gradient_color_1}
                                  onChange={(e) =>
                                    setBrandingConfig({
                                      ...brandingConfig,
                                      gradient_color_1: e.target.value,
                                    })
                                  }
                                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={brandingConfig.gradient_color_1}
                                  onChange={(e) =>
                                    setBrandingConfig({
                                      ...brandingConfig,
                                      gradient_color_1: e.target.value,
                                    })
                                  }
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                              </div>
                            </div>

                            {/* Gradient Color 2 */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Gradient Color 2
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={brandingConfig.gradient_color_2}
                                  onChange={(e) =>
                                    setBrandingConfig({
                                      ...brandingConfig,
                                      gradient_color_2: e.target.value,
                                    })
                                  }
                                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={brandingConfig.gradient_color_2}
                                  onChange={(e) =>
                                    setBrandingConfig({
                                      ...brandingConfig,
                                      gradient_color_2: e.target.value,
                                    })
                                  }
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                              </div>
                            </div>

                            {/* Gradient Direction */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Direction: {brandingConfig.gradient_angle}°
                              </label>
                              <div className="flex items-center gap-3">
                                <div className="relative w-16 h-16 rounded-full border-2 border-gray-300 bg-gray-50 flex-shrink-0">
                                  <div
                                    className="absolute top-1/2 left-1/2 w-1 h-6 bg-[#fbbf24] rounded-full origin-bottom"
                                    style={{
                                      transform: `translate(-50%, -100%) rotate(${brandingConfig.gradient_angle}deg)`,
                                    }}
                                  />
                                  <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#fbbf24] rounded-full -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="360"
                                  value={brandingConfig.gradient_angle}
                                  onChange={(e) =>
                                    setBrandingConfig({
                                      ...brandingConfig,
                                      gradient_angle: parseInt(e.target.value),
                                    })
                                  }
                                  className="flex-1"
                                />
                              </div>
                            </div>

                            {/* Gradient Spread */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Color Spread: {brandingConfig.gradient_spread}%
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={brandingConfig.gradient_spread}
                                onChange={(e) =>
                                  setBrandingConfig({
                                    ...brandingConfig,
                                    gradient_spread: parseInt(e.target.value),
                                  })
                                }
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Adjusts where colors transition
                              </p>
                            </div>

                            {/* Gradient Preview */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Preview
                              </label>
                              <div
                                className="w-full h-24 rounded-lg border border-gray-300"
                                style={{
                                  background: `linear-gradient(${brandingConfig.gradient_angle}deg, ${brandingConfig.gradient_color_1} 0%, ${brandingConfig.gradient_color_2} ${brandingConfig.gradient_spread}%, ${brandingConfig.gradient_color_2} 100%)`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* App Logo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          App Logo
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                          Upload a logo to replace the app title text in the
                          header
                        </p>

                        {/* Header Preview */}
                        {brandingConfig.app_logo_url && (
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Header Preview
                            </label>
                            <div
                              className="rounded-lg overflow-hidden border border-gray-300"
                              style={{
                                background: (() => {
                                  if (
                                    brandingConfig.background_type ===
                                    "gradient"
                                  ) {
                                    return `linear-gradient(${brandingConfig.gradient_angle}deg, ${brandingConfig.gradient_color_1} 0%, ${brandingConfig.gradient_color_2} ${brandingConfig.gradient_spread}%, ${brandingConfig.gradient_color_2} 100%)`;
                                  }
                                  return (
                                    brandingConfig.background_color || "#f9fafb"
                                  );
                                })(),
                                padding: "32px 24px",
                                textAlign: "center",
                              }}
                            >
                              <img
                                src={brandingConfig.app_logo_url}
                                alt="App Logo Preview"
                                style={{
                                  width: getLogoWidth(
                                    brandingConfig.app_logo_size,
                                  ),
                                  maxWidth: "90%",
                                  height: "auto",
                                  objectFit: "contain",
                                  margin: "0 auto",
                                  display: "block",
                                }}
                              />
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#1a1a1a",
                                  opacity: 0.8,
                                  marginTop: "8px",
                                }}
                              >
                                {headerConfig.subtitle ||
                                  "Mental Fitness for Active Minds"}
                              </p>
                            </div>
                          </div>
                        )}

                        {brandingConfig.app_logo_url && (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Logo Size
                            </label>
                            <div className="flex gap-2">
                              {["small", "medium", "large"].map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() =>
                                    setBrandingConfig({
                                      ...brandingConfig,
                                      app_logo_size: size,
                                    })
                                  }
                                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                    brandingConfig.app_logo_size === size
                                      ? "bg-purple-600 text-white border-purple-600"
                                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
                                  }`}
                                >
                                  {size.charAt(0).toUpperCase() + size.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {brandingConfig.app_logo_url && (
                          <div className="mb-3 flex items-center gap-3">
                            <button
                              onClick={() =>
                                setBrandingConfig({
                                  ...brandingConfig,
                                  app_logo_url: null,
                                })
                              }
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove Logo
                            </button>
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setUploadingAppLogo(true);
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("bucket", "public");

                            try {
                              const res = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              });
                              const data = await res.json();

                              if (res.ok) {
                                setBrandingConfig({
                                  ...brandingConfig,
                                  app_logo_url: data.url,
                                });
                              } else {
                                alert("Failed to upload logo");
                              }
                            } catch (error) {
                              console.error("Upload error:", error);
                              alert("Failed to upload logo");
                            } finally {
                              setUploadingAppLogo(false);
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#fef3c7] file:text-black hover:file:bg-[#fbbf24] disabled:opacity-50"
                          disabled={uploadingAppLogo}
                        />
                        {uploadingAppLogo && (
                          <p className="text-xs text-gray-500 mt-2">
                            Uploading...
                          </p>
                        )}
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                        <button
                          onClick={() =>
                            handleSaveConfig(
                              "branding",
                              brandingConfig,
                              "✅ Branding saved successfully!",
                            )
                          }
                          disabled={
                            isSavingConfig && savingSection === "branding"
                          }
                          className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingConfig && savingSection === "branding"
                            ? "Saving..."
                            : "Save Branding"}
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Header Customization */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <details className="group">
                    <summary className="p-6 border-b border-gray-100 bg-gray-50/50 cursor-pointer list-none flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Header Customization
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Customize the app header title and subtitle
                        </p>
                      </div>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                        ▼
                      </span>
                    </summary>
                    <div className="p-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          App Title (Replaced by App Logo under Branding
                          Section, if present)
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          placeholder="Mental Fitness for Active Minds"
                        />
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                        <button
                          onClick={() =>
                            handleSaveConfig(
                              "header",
                              headerConfig,
                              "✅ Header config saved!",
                            )
                          }
                          disabled={
                            isSavingConfig && savingSection === "header"
                          }
                          className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingConfig && savingSection === "header"
                            ? "Saving..."
                            : "Save Header"}
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Focus Tab Configuration */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <details className="group">
                    <summary className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer list-none">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Focus Tab Customization
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Customize daily focus experience
                        </p>
                      </div>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                        ▼
                      </span>
                    </summary>
                    <div className="p-6 space-y-6">
                      {/* Progress Bar */}
                      <div className="pb-4 border-b border-gray-100">
                        <details className="group" open>
                          <summary className="flex items-center justify-between cursor-pointer list-none mb-3">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                              Progress Bar
                            </h3>
                            <span className="text-gray-400 group-open:rotate-180 transition-transform text-xs">
                              ▼
                            </span>
                          </summary>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Today's Focus"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Direct your energy intentionally"
                              />
                            </div>
                          </div>
                        </details>
                      </div>

                      {/* Task 1 */}
                      <div className="pb-4 border-b border-gray-100">
                        <details className="group">
                          <summary className="flex items-center justify-between cursor-pointer list-none mb-3">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                              Task 1 (Morning)
                            </h3>
                            <span className="text-gray-400 group-open:rotate-180 transition-transform text-xs">
                              ▼
                            </span>
                          </summary>
                          <div className="mt-3 space-y-3">
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
                                className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-xs text-gray-600">
                                Enabled
                              </span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                  placeholder="Task title"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                  placeholder="Task description"
                                />
                              </div>
                            </div>

                            {/* Custom Icon Upload */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Custom Icon
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Upload a custom icon to replace the default.
                                Leave empty to use the default icon.
                              </p>

                              {focusConfig.task_1.icon_url && (
                                <div className="mb-2 flex items-center gap-3">
                                  <img
                                    src={focusConfig.task_1.icon_url}
                                    alt="Task Icon"
                                    className="w-12 h-12 object-contain bg-gray-50 rounded-lg p-1 border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFocusConfig({
                                        ...focusConfig,
                                        task_1: {
                                          ...focusConfig.task_1,
                                          icon_url: null,
                                        },
                                      })
                                    }
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    Remove Icon
                                  </button>
                                </div>
                              )}

                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  setUploadingTaskIcon("task_1");
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  formData.append("bucket", "public");

                                  try {
                                    const res = await fetch("/api/upload", {
                                      method: "POST",
                                      body: formData,
                                    });
                                    const data = await res.json();

                                    if (res.ok) {
                                      setFocusConfig({
                                        ...focusConfig,
                                        task_1: {
                                          ...focusConfig.task_1,
                                          icon_url: data.url,
                                        },
                                      });
                                    } else {
                                      alert("Failed to upload icon");
                                    }
                                  } catch (error) {
                                    console.error("Upload error:", error);
                                    alert("Failed to upload icon");
                                  } finally {
                                    setUploadingTaskIcon(null);
                                  }
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#fef3c7] file:text-black hover:file:bg-[#fbbf24] disabled:opacity-50"
                                disabled={uploadingTaskIcon === "task_1"}
                              />
                              {uploadingTaskIcon === "task_1" && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Uploading...
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Audio Library{" "}
                                <span className="text-gray-400 font-normal">
                                  (Up to 30 files • Daily rotation)
                                </span>
                              </label>
                              <p className="text-xs text-gray-500 mb-3">
                                Upload multiple audio files. Each day uses the
                                next audio in sequence.
                              </p>

                              <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                {audioLibrary
                                  .filter((a) => a.audio_url)
                                  .map((audio, index) => {
                                    // Find the actual index in the full library
                                    const actualIndex = audioLibrary.findIndex(
                                      (a) => a.id === audio.id,
                                    );
                                    return (
                                      <div
                                        key={audio.id}
                                        className={`p-3 rounded-lg border-2 ${
                                          actualIndex === currentDayIndex
                                            ? "border-purple-500 bg-purple-50"
                                            : "border-gray-200 bg-white"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-medium text-gray-500 min-w-[60px]">
                                            Day {index + 1}
                                          </span>
                                          {actualIndex === currentDayIndex && (
                                            <span className="text-xs bg-[#fbbf24] text-black px-2 py-0.5 rounded-full font-semibold">
                                              Today
                                            </span>
                                          )}
                                          {audio.name && (
                                            <span className="text-xs text-gray-600 flex-1 truncate">
                                              {audio.name}
                                            </span>
                                          )}
                                        </div>

                                        <div className="space-y-2">
                                          <audio
                                            controls
                                            src={audio.audio_url}
                                            className="w-full"
                                            style={{ height: "32px" }}
                                          />
                                          <div className="flex gap-2">
                                            {actualIndex !==
                                              currentDayIndex && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setCurrentDayIndex(
                                                    actualIndex,
                                                  )
                                                }
                                                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                              >
                                                Set as Today
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newLibrary =
                                                  audioLibrary.filter(
                                                    (_, i) => i !== actualIndex,
                                                  );
                                                // Re-index the library
                                                const reindexed =
                                                  newLibrary.map((a, i) => ({
                                                    ...a,
                                                    id: i,
                                                  }));
                                                setAudioLibrary(reindexed);
                                                // Adjust currentDayIndex if needed
                                                if (
                                                  actualIndex ===
                                                  currentDayIndex
                                                ) {
                                                  setCurrentDayIndex(0);
                                                } else if (
                                                  actualIndex < currentDayIndex
                                                ) {
                                                  setCurrentDayIndex(
                                                    currentDayIndex - 1,
                                                  );
                                                }
                                              }}
                                              className="text-xs text-red-600 hover:text-red-700 font-medium ml-auto"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                {/* Add Day Button */}
                                {audioLibrary.filter((a) => a.audio_url)
                                  .length < 30 && (
                                  <div>
                                    <input
                                      type="file"
                                      id="audio-upload-new"
                                      accept="audio/mpeg,audio/wav,audio/mp3,audio/mp4,audio/x-m4a"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        // Validate file type
                                        const validTypes = [
                                          "audio/mpeg",
                                          "audio/wav",
                                          "audio/mp3",
                                          "audio/mp4",
                                          "audio/x-m4a",
                                        ];
                                        if (!validTypes.includes(file.type)) {
                                          setToastMessage(
                                            "❌ Please upload a valid audio file (MP3, WAV, M4A)",
                                          );
                                          setShowToast(true);
                                          setTimeout(
                                            () => setShowToast(false),
                                            3000,
                                          );
                                          return;
                                        }

                                        // Validate file size (50MB)
                                        if (file.size > 50 * 1024 * 1024) {
                                          setToastMessage(
                                            "❌ File size must be less than 50MB",
                                          );
                                          setShowToast(true);
                                          setTimeout(
                                            () => setShowToast(false),
                                            3000,
                                          );
                                          return;
                                        }

                                        setUploadingAudio(true);
                                        try {
                                          const formData = new FormData();
                                          formData.append("file", file);
                                          formData.append("type", "audio");

                                          const res = await fetch(
                                            "/api/upload",
                                            {
                                              method: "POST",
                                              body: formData,
                                            },
                                          );

                                          const data = await res.json();

                                          if (res.ok && data.url) {
                                            const newAudio = {
                                              id: audioLibrary.length,
                                              audio_url: data.url,
                                              audio_path: data.path,
                                              name: file.name,
                                            };
                                            setAudioLibrary([
                                              ...audioLibrary,
                                              newAudio,
                                            ]);
                                            setToastMessage(
                                              "✅ Audio uploaded! Remember to save your configuration.",
                                            );
                                            setShowToast(true);
                                            setTimeout(
                                              () => setShowToast(false),
                                              3000,
                                            );
                                          } else {
                                            setToastMessage(
                                              "❌ " +
                                                (data.error ||
                                                  "Failed to upload audio"),
                                            );
                                            setShowToast(true);
                                            setTimeout(
                                              () => setShowToast(false),
                                              3000,
                                            );
                                          }
                                        } catch (error) {
                                          console.error("Upload error:", error);
                                          setToastMessage(
                                            "❌ Failed to upload audio",
                                          );
                                          setShowToast(true);
                                          setTimeout(
                                            () => setShowToast(false),
                                            3000,
                                          );
                                        } finally {
                                          setUploadingAudio(false);
                                          // Reset file input
                                          e.target.value = "";
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor="audio-upload-new"
                                      className={`flex items-center justify-center gap-2 w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-600 hover:border-purple-400 hover:text-purple-600 cursor-pointer transition-colors ${
                                        uploadingAudio
                                          ? "opacity-50 cursor-not-allowed"
                                          : ""
                                      }`}
                                    >
                                      {uploadingAudio ? (
                                        <>
                                          <span className="animate-spin">
                                            ⏳
                                          </span>
                                          Uploading...
                                        </>
                                      ) : (
                                        <>
                                          <span>➕</span>
                                          Add Day (
                                          {audioLibrary.filter(
                                            (a) => a.audio_url,
                                          ).length + 1}
                                          /30)
                                        </>
                                      )}
                                    </label>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                MP3, WAV, or M4A • Max 50MB per file
                              </p>
                            </div>
                          </div>
                        </details>
                      </div>

                      {/* Task 2 */}
                      <div className="pb-4 border-b border-gray-100">
                        <details className="group">
                          <summary className="flex items-center justify-between cursor-pointer list-none mb-3">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                              Task 2 (Intention)
                            </h3>
                            <span className="text-gray-400 group-open:rotate-180 transition-transform text-xs">
                              ▼
                            </span>
                          </summary>
                          <div className="mt-3 space-y-3">
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
                                className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-xs text-gray-600">
                                Enabled
                              </span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                  placeholder="Task title"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                  placeholder="Task description"
                                />
                              </div>
                            </div>

                            {/* Custom Icon Upload for Task 2 */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Custom Icon
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Upload a custom icon to replace the default.
                                Leave empty to use the default icon.
                              </p>

                              {focusConfig.task_2.icon_url && (
                                <div className="mb-2 flex items-center gap-3">
                                  <img
                                    src={focusConfig.task_2.icon_url}
                                    alt="Task Icon"
                                    className="w-12 h-12 object-contain bg-gray-50 rounded-lg p-1 border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFocusConfig({
                                        ...focusConfig,
                                        task_2: {
                                          ...focusConfig.task_2,
                                          icon_url: null,
                                        },
                                      })
                                    }
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    Remove Icon
                                  </button>
                                </div>
                              )}

                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  setUploadingTaskIcon("task_2");
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  formData.append("bucket", "public");

                                  try {
                                    const res = await fetch("/api/upload", {
                                      method: "POST",
                                      body: formData,
                                    });
                                    const data = await res.json();

                                    if (res.ok) {
                                      setFocusConfig({
                                        ...focusConfig,
                                        task_2: {
                                          ...focusConfig.task_2,
                                          icon_url: data.url,
                                        },
                                      });
                                    } else {
                                      alert("Failed to upload icon");
                                    }
                                  } catch (error) {
                                    console.error("Upload error:", error);
                                    alert("Failed to upload icon");
                                  } finally {
                                    setUploadingTaskIcon(null);
                                  }
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#fef3c7] file:text-black hover:file:bg-[#fbbf24] disabled:opacity-50"
                                disabled={uploadingTaskIcon === "task_2"}
                              />
                              {uploadingTaskIcon === "task_2" && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Uploading...
                                </p>
                              )}
                            </div>

                            {/* Intention Modal Customization */}
                            <div className="pt-3 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                                Intention Popup Text
                              </p>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Modal Title
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      focusConfig.task_2
                                        .intention_modal_title || ""
                                    }
                                    onChange={(e) =>
                                      setFocusConfig({
                                        ...focusConfig,
                                        task_2: {
                                          ...focusConfig.task_2,
                                          intention_modal_title: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                    placeholder="Set Your Intention"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                      First Question Label
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        focusConfig.task_2
                                          .intention_obstacles_label || ""
                                      }
                                      onChange={(e) =>
                                        setFocusConfig({
                                          ...focusConfig,
                                          task_2: {
                                            ...focusConfig.task_2,
                                            intention_obstacles_label:
                                              e.target.value,
                                          },
                                        })
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                      placeholder="What might get in the way today?"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                      First Question Placeholder
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        focusConfig.task_2
                                          .intention_obstacles_placeholder || ""
                                      }
                                      onChange={(e) =>
                                        setFocusConfig({
                                          ...focusConfig,
                                          task_2: {
                                            ...focusConfig.task_2,
                                            intention_obstacles_placeholder:
                                              e.target.value,
                                          },
                                        })
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                      placeholder="Meetings, distractions, fatigue..."
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                      Second Question Label
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        focusConfig.task_2
                                          .intention_focus_label || ""
                                      }
                                      onChange={(e) =>
                                        setFocusConfig({
                                          ...focusConfig,
                                          task_2: {
                                            ...focusConfig.task_2,
                                            intention_focus_label:
                                              e.target.value,
                                          },
                                        })
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                      placeholder="One word to refocus your energy"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                      Second Question Placeholder
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        focusConfig.task_2
                                          .intention_focus_placeholder || ""
                                      }
                                      onChange={(e) =>
                                        setFocusConfig({
                                          ...focusConfig,
                                          task_2: {
                                            ...focusConfig.task_2,
                                            intention_focus_placeholder:
                                              e.target.value,
                                          },
                                        })
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                      placeholder="Peace, Presence, Trust, Joy..."
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>

                      {/* Task 3 */}
                      <div className="pb-4 border-b border-gray-100">
                        <details className="group">
                          <summary className="flex items-center justify-between cursor-pointer list-none mb-3">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                              Task 3 (Evening)
                            </h3>
                            <span className="text-gray-400 group-open:rotate-180 transition-transform text-xs">
                              ▼
                            </span>
                          </summary>
                          <div className="mt-3 space-y-3">
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
                                className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-xs text-gray-600">
                                Enabled
                              </span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                  placeholder="Task title"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                  placeholder="Task description"
                                />
                              </div>
                            </div>

                            {/* Custom Icon Upload for Task 3 */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Custom Icon
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Upload a custom icon to replace the default.
                                Leave empty to use the default icon.
                              </p>

                              {focusConfig.task_3.icon_url && (
                                <div className="mb-2 flex items-center gap-3">
                                  <img
                                    src={focusConfig.task_3.icon_url}
                                    alt="Task Icon"
                                    className="w-12 h-12 object-contain bg-gray-50 rounded-lg p-1 border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFocusConfig({
                                        ...focusConfig,
                                        task_3: {
                                          ...focusConfig.task_3,
                                          icon_url: null,
                                        },
                                      })
                                    }
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    Remove Icon
                                  </button>
                                </div>
                              )}

                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  setUploadingTaskIcon("task_3");
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  formData.append("bucket", "public");

                                  try {
                                    const res = await fetch("/api/upload", {
                                      method: "POST",
                                      body: formData,
                                    });
                                    const data = await res.json();

                                    if (res.ok) {
                                      setFocusConfig({
                                        ...focusConfig,
                                        task_3: {
                                          ...focusConfig.task_3,
                                          icon_url: data.url,
                                        },
                                      });
                                    } else {
                                      alert("Failed to upload icon");
                                    }
                                  } catch (error) {
                                    console.error("Upload error:", error);
                                    alert("Failed to upload icon");
                                  } finally {
                                    setUploadingTaskIcon(null);
                                  }
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#fef3c7] file:text-black hover:file:bg-[#fbbf24] disabled:opacity-50"
                                disabled={uploadingTaskIcon === "task_3"}
                              />
                              {uploadingTaskIcon === "task_3" && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Uploading...
                                </p>
                              )}
                            </div>
                          </div>
                        </details>
                      </div>

                      {/* Day Notes */}
                      <div>
                        <details className="group">
                          <summary className="flex items-center justify-between cursor-pointer list-none mb-3">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                              Day Notes Section
                            </h3>
                            <span className="text-gray-400 group-open:rotate-180 transition-transform text-xs">
                              ▼
                            </span>
                          </summary>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Day Notes"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Description"
                              />
                            </div>
                          </div>

                          {/* Custom Icon Upload for Day Notes */}
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Custom Icon
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                              Upload a custom icon to replace the default. Leave
                              empty to use the default icon.
                            </p>

                            {focusConfig.day_notes.icon_url && (
                              <div className="mb-2 flex items-center gap-3">
                                <img
                                  src={focusConfig.day_notes.icon_url}
                                  alt="Day Notes Icon"
                                  className="w-12 h-12 object-contain bg-gray-50 rounded-lg p-1 border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFocusConfig({
                                      ...focusConfig,
                                      day_notes: {
                                        ...focusConfig.day_notes,
                                        icon_url: null,
                                      },
                                    })
                                  }
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Remove Icon
                                </button>
                              </div>
                            )}

                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                setUploadingTaskIcon("day_notes");
                                const formData = new FormData();
                                formData.append("file", file);
                                formData.append("bucket", "public");

                                try {
                                  const res = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  const data = await res.json();

                                  if (res.ok) {
                                    setFocusConfig({
                                      ...focusConfig,
                                      day_notes: {
                                        ...focusConfig.day_notes,
                                        icon_url: data.url,
                                      },
                                    });
                                  } else {
                                    alert("Failed to upload icon");
                                  }
                                } catch (error) {
                                  console.error("Upload error:", error);
                                  alert("Failed to upload icon");
                                } finally {
                                  setUploadingTaskIcon(null);
                                }
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#fef3c7] file:text-black hover:file:bg-[#fbbf24] disabled:opacity-50"
                              disabled={uploadingTaskIcon === "day_notes"}
                            />
                            {uploadingTaskIcon === "day_notes" && (
                              <p className="text-xs text-gray-500 mt-2">
                                Uploading...
                              </p>
                            )}
                          </div>
                        </details>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                        <button
                          onClick={async () => {
                            await handleSaveConfig(
                              "focus_tab",
                              {
                                ...focusConfig,
                                audio_library: audioLibrary.filter(
                                  (a) => a.audio_url,
                                ),
                                current_day_index: currentDayIndex,
                              },
                              "✅ Focus tab config saved successfully!",
                            );
                            setTimeout(() => captureFocusScreenshot(), 300);
                          }}
                          disabled={
                            isSavingConfig && savingSection === "focus_tab"
                          }
                          className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingConfig && savingSection === "focus_tab"
                            ? "Saving..."
                            : "Save Focus Tab"}
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Awareness Tab Configuration - Combined */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <details className="group">
                    <summary className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer list-none">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Awareness Tab Configuration
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Customize mindfulness logs and emotional state
                          tracking
                        </p>
                      </div>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                        ▼
                      </span>
                    </summary>
                    <div className="p-6 space-y-6">
                      {/* MINDFULNESS LOGS Section */}
                      <div>
                        <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4">
                          Mindfulness Logs
                        </h3>
                        <div className="space-y-4">
                          {/* Modal Title */}
                          <div className="pb-4 border-b border-gray-100">
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Modal Title
                            </label>
                            <input
                              type="text"
                              value={awarenessConfig.modal_title}
                              onChange={(e) =>
                                setAwarenessConfig({
                                  ...awarenessConfig,
                                  modal_title: e.target.value,
                                })
                              }
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === "a") {
                                  e.target.select();
                                }
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              placeholder="Nice catch!"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Title shown when user logs a mindfulness moment
                            </p>
                          </div>

                          {/* Mindfulness Logs */}
                          {awarenessConfig.logs.map((log, index) => (
                            <div
                              key={log.id}
                              className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                            >
                              <details className="group">
                                <summary className="flex items-center justify-between cursor-pointer list-none">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full shrink-0"
                                      style={{ backgroundColor: log.color }}
                                    />
                                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                      Log {index + 1}: {log.label}
                                    </h3>
                                  </div>
                                  <span className="text-gray-400 group-open:rotate-180 transition-transform text-xs">
                                    ▼
                                  </span>
                                </summary>
                                <div className="mt-4 space-y-3 pl-5">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                      Log Label
                                    </label>
                                    <input
                                      type="text"
                                      value={log.label}
                                      onChange={(e) => {
                                        const newLogs = [
                                          ...awarenessConfig.logs,
                                        ];
                                        newLogs[index].label = e.target.value;
                                        setAwarenessConfig({
                                          ...awarenessConfig,
                                          logs: newLogs,
                                        });
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      onKeyDown={(e) => {
                                        if (
                                          (e.metaKey || e.ctrlKey) &&
                                          e.key === "a"
                                        ) {
                                          e.target.select();
                                        }
                                      }}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                      placeholder="e.g. Present moment"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                      Prompt Question
                                    </label>
                                    <input
                                      type="text"
                                      value={log.prompt}
                                      onChange={(e) => {
                                        const newLogs = [
                                          ...awarenessConfig.logs,
                                        ];
                                        newLogs[index].prompt = e.target.value;
                                        setAwarenessConfig({
                                          ...awarenessConfig,
                                          logs: newLogs,
                                        });
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      onKeyDown={(e) => {
                                        if (
                                          (e.metaKey || e.ctrlKey) &&
                                          e.key === "a"
                                        ) {
                                          e.target.select();
                                        }
                                      }}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                      placeholder="Question to ask the user"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                      Placeholder Text
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={log.placeholder}
                                      onChange={(e) => {
                                        const newLogs = [
                                          ...awarenessConfig.logs,
                                        ];
                                        newLogs[index].placeholder =
                                          e.target.value;
                                        setAwarenessConfig({
                                          ...awarenessConfig,
                                          logs: newLogs,
                                        });
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      onKeyDown={(e) => {
                                        if (
                                          (e.metaKey || e.ctrlKey) &&
                                          e.key === "a"
                                        ) {
                                          e.target.select();
                                        }
                                      }}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                                      placeholder="Example answer text"
                                    />
                                  </div>
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200"></div>

                      {/* EMOTIONAL STATE TRACKING Section */}
                      <div>
                        <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4">
                          Emotional State Tracking
                        </h3>
                        <div className="space-y-4">
                          {/* Log Label */}
                          <div className="pb-4 border-b border-gray-100">
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Log Label
                            </label>
                            <input
                              type="text"
                              value={emotionalStateConfig.log_label}
                              onChange={(e) =>
                                setEmotionalStateConfig({
                                  ...emotionalStateConfig,
                                  log_label: e.target.value,
                                })
                              }
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === "a") {
                                  e.target.select();
                                }
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              placeholder="Emotional State"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Label shown in the awareness tab section
                            </p>
                          </div>

                          {/* Modal Subtitle */}
                          <div className="pb-4 border-b border-gray-100">
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Modal Subtitle
                            </label>
                            <input
                              type="text"
                              value={emotionalStateConfig.modal_subtitle}
                              onChange={(e) =>
                                setEmotionalStateConfig({
                                  ...emotionalStateConfig,
                                  modal_subtitle: e.target.value,
                                })
                              }
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === "a") {
                                  e.target.select();
                                }
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              placeholder="Select all that apply"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Instruction text shown in the selection modal
                            </p>
                          </div>

                          {/* Categories */}
                          {emotionalStateConfig.categories.map(
                            (category, catIndex) => (
                              <div
                                key={category.id}
                                className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                              >
                                <details
                                  className="group"
                                  open={catIndex === 0}
                                >
                                  <summary className="flex items-center justify-between cursor-pointer list-none">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: category.color,
                                        }}
                                      />
                                      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                        Category {catIndex + 1}:{" "}
                                        {category.label}
                                      </h3>
                                    </div>
                                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-xs">
                                      ▼
                                    </span>
                                  </summary>
                                  <div className="mt-4 space-y-3 pl-5">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                        Category Label
                                      </label>
                                      <input
                                        type="text"
                                        value={category.label}
                                        onChange={(e) => {
                                          const newCategories = [
                                            ...emotionalStateConfig.categories,
                                          ];
                                          newCategories[catIndex].label =
                                            e.target.value;
                                          setEmotionalStateConfig({
                                            ...emotionalStateConfig,
                                            categories: newCategories,
                                          });
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => {
                                          if (
                                            (e.metaKey || e.ctrlKey) &&
                                            e.key === "a"
                                          ) {
                                            e.preventDefault();
                                            e.target.select();
                                          }
                                        }}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                        placeholder="e.g. CHALLENGING"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                        Category Color
                                      </label>
                                      <div className="flex gap-2 items-center">
                                        <input
                                          type="color"
                                          value={category.color}
                                          onChange={(e) => {
                                            const newCategories = [
                                              ...emotionalStateConfig.categories,
                                            ];
                                            newCategories[catIndex].color =
                                              e.target.value;
                                            setEmotionalStateConfig({
                                              ...emotionalStateConfig,
                                              categories: newCategories,
                                            });
                                          }}
                                          className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                        />
                                        <input
                                          type="text"
                                          value={category.color}
                                          onChange={(e) => {
                                            const newCategories = [
                                              ...emotionalStateConfig.categories,
                                            ];
                                            newCategories[catIndex].color =
                                              e.target.value;
                                            setEmotionalStateConfig({
                                              ...emotionalStateConfig,
                                              categories: newCategories,
                                            });
                                          }}
                                          onFocus={(e) => e.target.select()}
                                          onKeyDown={(e) => {
                                            if (
                                              (e.metaKey || e.ctrlKey) &&
                                              e.key === "a"
                                            ) {
                                              e.preventDefault();
                                              e.target.select();
                                            }
                                          }}
                                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                                          placeholder="#3b82f6"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-medium text-gray-700">
                                          Emotion Options
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleAddEmotionOption(catIndex)
                                          }
                                          disabled={
                                            category.options.length >= 10
                                          }
                                          className={`text-xs font-medium flex items-center gap-1 ${
                                            category.options.length >= 10
                                              ? "text-gray-400 cursor-not-allowed"
                                              : "text-purple-600 hover:text-purple-700"
                                          }`}
                                        >
                                          + Add Option
                                          {category.options.length >= 10 &&
                                            " (Max 10)"}
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        {category.options.map(
                                          (option, optIndex) => (
                                            <div
                                              key={optIndex}
                                              draggable
                                              onDragStart={() =>
                                                handleDragStartEmotionOption(
                                                  catIndex,
                                                  optIndex,
                                                )
                                              }
                                              onDragOver={
                                                handleDragOverEmotionOption
                                              }
                                              onDrop={() =>
                                                handleDropEmotionOption(
                                                  catIndex,
                                                  optIndex,
                                                )
                                              }
                                              className="border border-gray-200 rounded-lg p-3 space-y-2 cursor-move hover:border-purple-300 transition-colors"
                                            >
                                              <div className="flex gap-2 items-start">
                                                {/* Drag Handle */}
                                                <div className="flex items-center justify-center text-gray-400 hover:text-purple-600 cursor-grab active:cursor-grabbing pt-1">
                                                  <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 16 16"
                                                    fill="currentColor"
                                                  >
                                                    <circle
                                                      cx="5"
                                                      cy="3"
                                                      r="1"
                                                    />
                                                    <circle
                                                      cx="5"
                                                      cy="8"
                                                      r="1"
                                                    />
                                                    <circle
                                                      cx="5"
                                                      cy="13"
                                                      r="1"
                                                    />
                                                    <circle
                                                      cx="11"
                                                      cy="3"
                                                      r="1"
                                                    />
                                                    <circle
                                                      cx="11"
                                                      cy="8"
                                                      r="1"
                                                    />
                                                    <circle
                                                      cx="11"
                                                      cy="13"
                                                      r="1"
                                                    />
                                                  </svg>
                                                </div>
                                                <input
                                                  type="text"
                                                  value={option.name}
                                                  onChange={(e) =>
                                                    handleUpdateEmotionOption(
                                                      catIndex,
                                                      optIndex,
                                                      "name",
                                                      e.target.value,
                                                    )
                                                  }
                                                  placeholder="Emotion name"
                                                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleRemoveEmotionOption(
                                                      catIndex,
                                                      optIndex,
                                                    )
                                                  }
                                                  className="text-red-600 hover:text-red-700 text-xs px-2"
                                                  title="Remove"
                                                >
                                                  ✕
                                                </button>
                                              </div>

                                              {/* Practice Details */}
                                              <div>
                                                <input
                                                  type="text"
                                                  value={
                                                    option.practice_name || ""
                                                  }
                                                  onChange={(e) =>
                                                    handleUpdateEmotionOption(
                                                      catIndex,
                                                      optIndex,
                                                      "practice_name",
                                                      e.target.value,
                                                    )
                                                  }
                                                  placeholder="Recommended Practice Name (e.g., Breath Reset)"
                                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                                {option.duration && (
                                                  <p className="text-xs text-gray-500 mt-1">
                                                    Duration: {option.duration}
                                                  </p>
                                                )}
                                              </div>

                                              {/* Audio Upload */}
                                              {option.audio_url ? (
                                                <div className="space-y-1">
                                                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                                                    <span className="text-green-600">
                                                      🎵
                                                    </span>
                                                    <span className="text-green-700 flex-1">
                                                      Audio uploaded
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleRemoveEmotionAudio(
                                                          catIndex,
                                                          optIndex,
                                                        )
                                                      }
                                                      className="text-red-600 hover:text-red-700 font-medium"
                                                    >
                                                      Remove
                                                    </button>
                                                  </div>
                                                  <audio
                                                    controls
                                                    src={option.audio_url}
                                                    className="w-full"
                                                    style={{ height: "32px" }}
                                                  />
                                                </div>
                                              ) : (
                                                <div>
                                                  <input
                                                    type="file"
                                                    id={`emotion-audio-${catIndex}-${optIndex}`}
                                                    accept="audio/mpeg,audio/wav,audio/mp3,audio/mp4,audio/x-m4a"
                                                    onChange={(e) =>
                                                      handleEmotionAudioUpload(
                                                        e,
                                                        catIndex,
                                                        optIndex,
                                                      )
                                                    }
                                                    className="hidden"
                                                  />
                                                  <label
                                                    htmlFor={`emotion-audio-${catIndex}-${optIndex}`}
                                                    className={`flex items-center justify-center gap-1 w-full px-3 py-2 border border-dashed border-gray-300 rounded text-xs text-gray-600 hover:border-purple-400 hover:text-purple-600 cursor-pointer transition-colors ${
                                                      uploadingEmotionAudio ===
                                                      `${catIndex}-${optIndex}`
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : ""
                                                    }`}
                                                  >
                                                    {uploadingEmotionAudio ===
                                                    `${catIndex}-${optIndex}` ? (
                                                      <>
                                                        <span className="animate-spin">
                                                          ⏳
                                                        </span>
                                                        Uploading...
                                                      </>
                                                    ) : (
                                                      <>
                                                        <span>🎵</span>
                                                        Upload Practice Audio
                                                      </>
                                                    )}
                                                  </label>
                                                </div>
                                              )}
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </details>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                        <button
                          onClick={async () => {
                            // Save both awareness and emotional state configs
                            await handleSaveConfig(
                              "awareness_tab",
                              awarenessConfig,
                              "",
                            );
                            const cleanedConfig = {
                              ...emotionalStateConfig,
                              categories: emotionalStateConfig.categories.map(
                                (cat) => ({
                                  ...cat,
                                  options: cat.options.filter(
                                    (opt) => opt.name && opt.name.trim() !== "",
                                  ),
                                }),
                              ),
                            };
                            await handleSaveConfig(
                              "emotional_state_tab",
                              cleanedConfig,
                              "✅ Awareness tab config saved successfully!",
                            );
                          }}
                          disabled={
                            isSavingConfig &&
                            (savingSection === "awareness_tab" ||
                              savingSection === "emotional_state_tab")
                          }
                          className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingConfig &&
                          (savingSection === "awareness_tab" ||
                            savingSection === "emotional_state_tab")
                            ? "Saving..."
                            : "Save Awareness Tab"}
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Coach Tab Configuration */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <details className="group">
                    <summary className="p-6 border-b border-gray-100 bg-gray-50/50 cursor-pointer list-none flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Coach Tab Configuration
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Customize AI coaching behavior and monitor token usage
                        </p>
                      </div>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                        ▼
                      </span>
                    </summary>
                    <div className="p-6 space-y-6">
                      {/* Token Usage Meter */}
                      <div className="border-b border-gray-100 pb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                          Token Usage
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Total tokens used this month
                            </span>
                            <span className="font-semibold text-gray-900">
                              {(tokenUsage?.totalTokens || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  ((tokenUsage?.totalTokens || 0) /
                                    ((tokenUsage?.subscriberCount || 1) *
                                      (tokenUsage?.tokenLimit || 1000000))) *
                                    100,
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">
                                Active Subscribers
                              </div>
                              <div className="text-2xl font-bold text-gray-900">
                                {tokenUsage?.subscriberCount || 0}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">
                                Avg. per User
                              </div>
                              <div className="text-2xl font-bold text-gray-900">
                                {(
                                  tokenUsage?.averagePerUser || 0
                                ).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Each user has a limit of{" "}
                            {(
                              tokenUsage?.tokenLimit || 1000000
                            ).toLocaleString()}{" "}
                            tokens per month. Usage resets automatically at the
                            beginning of each month.
                          </p>
                        </div>
                      </div>

                      {/* Bot Profile Picture */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          AI Coach Profile Picture
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                          Upload a profile picture for the AI coach that will
                          appear in chat messages instead of initials.
                        </p>

                        {coachTabConfig.bot_profile_picture_url && (
                          <div className="mb-3 flex items-center gap-3">
                            <img
                              src={coachTabConfig.bot_profile_picture_url}
                              alt="Bot Profile"
                              className="w-16 h-16 rounded-full object-cover bg-gray-50 border-2 border-gray-200"
                            />
                            <button
                              onClick={() =>
                                setCoachTabConfig({
                                  ...coachTabConfig,
                                  bot_profile_picture_url: null,
                                })
                              }
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove Picture
                            </button>
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setUploadingBotProfilePicture(true);
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("bucket", "public");

                            try {
                              const res = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              });
                              const data = await res.json();

                              if (res.ok) {
                                setCoachTabConfig({
                                  ...coachTabConfig,
                                  bot_profile_picture_url: data.url,
                                });
                              } else {
                                alert("Failed to upload picture");
                              }
                            } catch (error) {
                              console.error("Upload error:", error);
                              alert("Failed to upload picture");
                            } finally {
                              setUploadingBotProfilePicture(false);
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#fef3c7] file:text-black hover:file:bg-[#fbbf24] disabled:opacity-50"
                          disabled={uploadingBotProfilePicture}
                        />
                        {uploadingBotProfilePicture && (
                          <p className="text-xs text-gray-500 mt-2">
                            Uploading...
                          </p>
                        )}
                      </div>

                      {/* System Prompt Editor */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          AI System Prompt (Tuning Script)
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                          Edit this prompt to customize how the AI coach
                          responds to your users. This controls the AI's
                          personality, tone, and coaching style.
                        </p>
                        <textarea
                          ref={systemPromptRef}
                          value={coachTabConfig.system_prompt}
                          onChange={(e) =>
                            setCoachTabConfig({
                              ...coachTabConfig,
                              system_prompt: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === "a") {
                              e.preventDefault();
                              if (systemPromptRef.current) {
                                systemPromptRef.current.select();
                              }
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono text-sm"
                          rows={20}
                          placeholder="Enter the system prompt that defines how the AI coach behaves..."
                          spellCheck={false}
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          💡 Tip: The system prompt defines the AI's role,
                          personality, and coaching approach. Be specific and
                          clear about the style of responses you want.
                        </div>
                      </div>

                      {/* Booking Configuration */}
                      <div className="border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700">
                              "Book a Call" Feature
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Allow users to book calls with you directly from
                              the Coach tab
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={coachTabConfig.booking?.enabled || false}
                              onChange={(e) =>
                                setCoachTabConfig({
                                  ...coachTabConfig,
                                  booking: {
                                    ...coachTabConfig.booking,
                                    enabled: e.target.checked,
                                  },
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                          </label>
                        </div>

                        {coachTabConfig.booking?.enabled && (
                          <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                            {/* Button Text */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Button Text
                              </label>
                              <input
                                type="text"
                                value={
                                  coachTabConfig.booking?.button_text || ""
                                }
                                onChange={(e) =>
                                  setCoachTabConfig({
                                    ...coachTabConfig,
                                    booking: {
                                      ...coachTabConfig.booking,
                                      button_text: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                placeholder="Book a Call"
                              />
                            </div>

                            {/* AI Disclaimer */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                AI Disclaimer Text
                              </label>
                              <textarea
                                value={
                                  coachTabConfig.booking?.ai_disclaimer || ""
                                }
                                onChange={(e) =>
                                  setCoachTabConfig({
                                    ...coachTabConfig,
                                    booking: {
                                      ...coachTabConfig.booking,
                                      ai_disclaimer: e.target.value,
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                rows={2}
                                placeholder="Responses in chat are AI-generated and not directly from {coach_name} herself."
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Use {"{coach_name}"} to insert your name
                              </p>
                            </div>

                            {/* Booking Options */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Booking Options
                              </label>
                              {(coachTabConfig.booking?.options || []).map(
                                (option, index) => (
                                  <div
                                    key={option.id}
                                    className="mb-3 p-3 bg-white border border-gray-200 rounded-lg"
                                  >
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                      <input
                                        type="text"
                                        value={option.title}
                                        onChange={(e) => {
                                          const newOptions = [
                                            ...coachTabConfig.booking.options,
                                          ];
                                          newOptions[index].title =
                                            e.target.value;
                                          setCoachTabConfig({
                                            ...coachTabConfig,
                                            booking: {
                                              ...coachTabConfig.booking,
                                              options: newOptions,
                                            },
                                          });
                                        }}
                                        className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        placeholder="Call title"
                                      />
                                      <input
                                        type="text"
                                        value={option.duration}
                                        onChange={(e) => {
                                          const newOptions = [
                                            ...coachTabConfig.booking.options,
                                          ];
                                          newOptions[index].duration =
                                            e.target.value;
                                          setCoachTabConfig({
                                            ...coachTabConfig,
                                            booking: {
                                              ...coachTabConfig.booking,
                                              options: newOptions,
                                            },
                                          });
                                        }}
                                        className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        placeholder="Duration"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      value={option.description}
                                      onChange={(e) => {
                                        const newOptions = [
                                          ...coachTabConfig.booking.options,
                                        ];
                                        newOptions[index].description =
                                          e.target.value;
                                        setCoachTabConfig({
                                          ...coachTabConfig,
                                          booking: {
                                            ...coachTabConfig.booking,
                                            options: newOptions,
                                          },
                                        });
                                      }}
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 mb-2"
                                      placeholder="Description"
                                    />
                                    <input
                                      type="url"
                                      value={option.url}
                                      onChange={(e) => {
                                        const newOptions = [
                                          ...coachTabConfig.booking.options,
                                        ];
                                        newOptions[index].url = e.target.value;
                                        setCoachTabConfig({
                                          ...coachTabConfig,
                                          booking: {
                                            ...coachTabConfig.booking,
                                            options: newOptions,
                                          },
                                        });
                                      }}
                                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 mb-2"
                                      placeholder="Booking URL (Calendly, Cal.com, etc.)"
                                    />
                                    <button
                                      onClick={() => {
                                        const newOptions =
                                          coachTabConfig.booking.options.filter(
                                            (_, i) => i !== index,
                                          );
                                        setCoachTabConfig({
                                          ...coachTabConfig,
                                          booking: {
                                            ...coachTabConfig.booking,
                                            options: newOptions,
                                          },
                                        });
                                      }}
                                      className="text-xs text-red-600 hover:text-red-700"
                                    >
                                      Remove option
                                    </button>
                                  </div>
                                ),
                              )}
                              <button
                                onClick={() => {
                                  const newOptions = [
                                    ...(coachTabConfig.booking?.options || []),
                                    {
                                      id: Date.now(),
                                      title: "",
                                      duration: "",
                                      description: "",
                                      url: "",
                                    },
                                  ];
                                  setCoachTabConfig({
                                    ...coachTabConfig,
                                    booking: {
                                      ...coachTabConfig.booking,
                                      options: newOptions,
                                    },
                                  });
                                }}
                                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                              >
                                + Add booking option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                          onClick={() =>
                            handleSaveConfig(
                              "coach_tab",
                              coachTabConfig,
                              "✅ Coach Tab configuration saved successfully!",
                            )
                          }
                          disabled={
                            isSavingConfig && savingSection === "coach_tab"
                          }
                          className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingConfig && savingSection === "coach_tab"
                            ? "Saving..."
                            : "Save Coach Configuration"}
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Page Visibility */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <details className="group">
                    <summary className="p-6 border-b border-gray-100 bg-gray-50/50 cursor-pointer list-none flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Page Visibility
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Control who can see your page
                        </p>
                      </div>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                        ▼
                      </span>
                    </summary>
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
                  </details>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Resource Hub Content */}
        {activeSection === "resource-hub" && (
          <>
            {!profileConfig.tier3_enabled ? (
              <div className="flex items-center justify-center h-full" style={{ minHeight: "calc(100vh - 200px)" }}>
                <div className="text-center max-w-md mx-auto px-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Enable Tier 3 to Use Resource Hub</h2>
                  <p className="text-gray-500 mb-6">The Resource Hub is an exclusive feature for your Tier 3 subscribers. Enable the Tier 3 plan in the Finance tab first, then come back here to create collections.</p>
                  <button
                    onClick={() => setActiveSection("finance")}
                    className="px-6 py-2.5 text-sm font-semibold text-black bg-[#fbbf24] rounded-lg hover:bg-[#f59e0b] transition-colors"
                  >
                    Go to Finance Settings
                  </button>
                </div>
              </div>
            ) : rhEditing ? (
              /* ── Collection Editor ── */
              <div key={rhEditing} className="flex h-full" style={{ minHeight: "calc(100vh - 64px)" }}>
                {/* Left: Collection items */}
                <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden">
                  {/* Editor Header */}
                  <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => { setRhEditing(null); setRhEditCollection(null); setRhEditItems([]); }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div className="flex-1">
                        <input
                          id="rh-col-title"
                          type="text"
                          defaultValue={rhEditCollection?.title || ""}
                          className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none w-full"
                          placeholder="Collection Title"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 relative">
                        <label className="text-sm text-gray-500">Icon</label>
                        <button
                          type="button"
                          onClick={() => setRhIconPickerOpen((v) => !v)}
                          className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:border-amber-400 transition-colors bg-white"
                        >
                          {renderCollectionIcon(rhEditCollection?.icon || "folder", 22, "#374151")}
                        </button>
                        {rhIconPickerOpen && (
                          <>
                          <div className="fixed inset-0 z-40" onClick={() => setRhIconPickerOpen(false)} />
                          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 w-72 max-h-64 overflow-y-auto">
                            <div className="grid grid-cols-6 gap-1">
                              {Object.entries(COLLECTION_ICONS).map(([key, icon]) => (
                                <button
                                  key={key}
                                  type="button"
                                  title={icon.label}
                                  onClick={() => {
                                    setRhEditCollection((prev) => ({ ...prev, icon: key }));
                                    setRhIconPickerOpen(false);
                                  }}
                                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${rhEditCollection?.icon === key ? "bg-amber-100 border border-amber-400" : "hover:bg-gray-100"}`}
                                >
                                  {renderCollectionIcon(key, 20, rhEditCollection?.icon === key ? "#d97706" : "#4b5563")}
                                </button>
                              ))}
                            </div>
                          </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500">Description</label>
                        <input
                          id="rh-col-desc"
                          type="text"
                          defaultValue={rhEditCollection?.description || ""}
                          className="text-sm text-gray-700 bg-transparent border border-gray-200 rounded-lg px-3 py-1.5 w-64 outline-none focus:border-amber-400"
                          placeholder="Short description..."
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-gray-500">Self-Paced</span>
                        <button
                          onClick={() => setRhEditCollection((prev) => ({
                            ...prev,
                            delivery_mode: prev.delivery_mode === "self_paced" ? "drip" : "self_paced",
                          }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rhEditCollection?.delivery_mode === "drip" ? "bg-amber-500" : "bg-gray-300"}`}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${rhEditCollection?.delivery_mode === "drip" ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                        <span className="text-sm text-gray-500">Drip</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                        <button
                          onClick={() => setRhEditCollection((prev) => ({ ...prev, is_published: !prev.is_published }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rhEditCollection?.is_published ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${rhEditCollection?.is_published ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                        <span className={`text-sm font-medium ${rhEditCollection?.is_published ? "text-green-600" : "text-gray-400"}`}>{rhEditCollection?.is_published ? "Published" : "Draft"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {rhEditItems.length === 0 ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setRhDragOverIndex(0); }}
                        onDragLeave={() => setRhDragOverIndex(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setRhDragOverIndex(null);
                          if (rhDragItem && rhDragItem.source === "library") {
                            setRhEditItems([{
                              id: `temp-${Date.now()}`,
                              item_type: "content",
                              content_item_id: rhDragItem.item.id,
                              content_item: rhDragItem.item,
                              sort_order: 0,
                            }]);
                            setRhDragItem(null);
                          }
                        }}
                        className={`flex flex-col items-center justify-center h-full rounded-xl border-2 border-dashed transition-all ${rhDragOverIndex === 0 ? "border-purple-400 bg-purple-50 text-purple-500" : "border-transparent text-gray-400"}`}
                      >
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p className="text-lg font-medium">{rhDragOverIndex === 0 ? "Drop here!" : "No items yet"}</p>
                        <p className="text-sm mt-1">Drag content from the library on the right</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rhEditItems.map((item, index) => (
                          <div key={item.id || `new-${index}`}>
                            {/* Drop zone above item */}
                            <div
                              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setRhDragOverIndex(index); }}
                              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setRhDragOverIndex(null); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                setRhDragOverIndex(null);
                                if (rhDragItem) {
                                  if (rhDragItem.source === "library") {
                                    const newItem = {
                                      id: `temp-${Date.now()}`,
                                      item_type: "content",
                                      content_item_id: rhDragItem.item.id,
                                      content_item: rhDragItem.item,
                                      sort_order: index,
                                    };
                                    setRhEditItems((prev) => {
                                      const next = [...prev];
                                      next.splice(index, 0, newItem);
                                      return next;
                                    });
                                  } else if (rhDragItem.source === "reorder") {
                                    setRhEditItems((prev) => {
                                      const next = [...prev];
                                      const [moved] = next.splice(rhDragItem.fromIndex, 1);
                                      const targetIndex = rhDragItem.fromIndex < index ? index - 1 : index;
                                      next.splice(targetIndex, 0, moved);
                                      return next;
                                    });
                                  }
                                  setRhDragItem(null);
                                }
                              }}
                              style={{ minHeight: rhDragOverIndex === index ? "48px" : "8px" }}
                              className={`rounded transition-all flex items-center justify-center ${rhDragOverIndex === index ? "bg-purple-100 border-2 border-dashed border-purple-400" : rhDragItem ? "border-2 border-dashed border-transparent hover:border-purple-300 hover:bg-purple-50" : ""}`}
                            >
                              {rhDragOverIndex === index && <span className="text-xs text-purple-500 font-medium">Drop here</span>}
                            </div>

                            {item.item_type === "pause" ? (
                              /* Pause marker */
                              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                                <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="text-sm font-medium text-amber-700">Wait</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.pause_days || 1}
                                  onChange={(e) => {
                                    const days = parseInt(e.target.value) || 1;
                                    setRhEditItems((prev) => prev.map((it, i) => i === index ? { ...it, pause_days: days } : it));
                                  }}
                                  className="w-16 text-center border border-amber-300 rounded px-2 py-1 text-sm bg-white"
                                />
                                <span className="text-sm text-amber-700">day{(item.pause_days || 1) !== 1 ? "s" : ""} before next content</span>
                                <button
                                  onClick={() => setRhEditItems((prev) => prev.filter((_, i) => i !== index))}
                                  className="ml-auto p-1 text-amber-400 hover:text-red-500 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            ) : (
                              /* Content item */
                              <div
                                draggable
                                onDragStart={(e) => { e.dataTransfer.setData("text/plain", index.toString()); e.dataTransfer.effectAllowed = "move"; setRhDragItem({ source: "reorder", fromIndex: index }); }}
                                onDragEnd={() => { setRhDragItem(null); setRhDragOverIndex(null); }}
                                className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:shadow-sm transition-shadow cursor-grab active:cursor-grabbing"
                              >
                                <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                                <span className="text-lg flex-shrink-0">{getContentTypeIcon(item.content_item?.type)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.content_item?.title || "Unknown"}</p>
                                  {item.content_item?.duration && (
                                    <p className="text-xs text-gray-500">{item.content_item.duration}</p>
                                  )}
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: getContentTypeBadgeColor(item.content_item?.type).bg, color: getContentTypeBadgeColor(item.content_item?.type).text }}>{item.content_item?.type}</span>
                                <button
                                  onClick={() => setRhEditItems((prev) => prev.filter((_, i) => i !== index))}
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Final drop zone */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setRhDragOverIndex(rhEditItems.length); }}
                          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setRhDragOverIndex(null); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setRhDragOverIndex(null);
                            if (rhDragItem) {
                              if (rhDragItem.source === "library") {
                                const newItem = {
                                  id: `temp-${Date.now()}`,
                                  item_type: "content",
                                  content_item_id: rhDragItem.item.id,
                                  content_item: rhDragItem.item,
                                  sort_order: rhEditItems.length,
                                };
                                setRhEditItems((prev) => [...prev, newItem]);
                              } else if (rhDragItem.source === "reorder") {
                                setRhEditItems((prev) => {
                                  const next = [...prev];
                                  const [moved] = next.splice(rhDragItem.fromIndex, 1);
                                  next.push(moved);
                                  return next;
                                });
                              }
                              setRhDragItem(null);
                            }
                          }}
                          style={{ minHeight: rhDragOverIndex === rhEditItems.length ? "48px" : "32px" }}
                          className={`rounded transition-all flex items-center justify-center ${rhDragOverIndex === rhEditItems.length ? "bg-purple-100 border-2 border-dashed border-purple-400" : rhDragItem ? "border-2 border-dashed border-transparent hover:border-purple-300 hover:bg-purple-50" : ""}`}
                        >
                          {rhDragOverIndex === rhEditItems.length && <span className="text-xs text-purple-500 font-medium">Drop here</span>}
                        </div>
                      </div>
                    )}

                    {/* Add Pause button (drip mode only) */}
                    {rhEditCollection?.delivery_mode === "drip" && rhEditItems.length > 0 && (
                      <button
                        onClick={() => {
                          setRhEditItems((prev) => [
                            ...prev,
                            { id: `pause-${Date.now()}`, item_type: "pause", pause_days: 1, sort_order: prev.length },
                          ]);
                        }}
                        className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Add Day Pause
                      </button>
                    )}
                  </div>

                  {/* Editor footer */}
                  <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                    <button
                      onClick={() => handleDeleteCollection(rhEditCollection?.id)}
                      className="text-sm text-red-500 hover:text-red-700 transition-colors"
                      disabled={rhSaving}
                    >
                      Delete Collection
                    </button>
                    <button
                      onClick={handleSaveCollection}
                      disabled={rhSaving}
                      className="px-6 py-2 text-sm font-semibold text-black bg-[#fbbf24] rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50"
                    >
                      {rhSaving ? "Saving..." : "Save Collection"}
                    </button>
                  </div>
                </div>

                {/* Right: Content Library Panel */}
                <div className="w-80 flex flex-col bg-white overflow-hidden">
                  <div className="px-4 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Content Library</h3>
                      <button
                        onClick={() => setRhShowAddContent(true)}
                        className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        + Add New
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Search content..."
                      value={rhContentFilter}
                      onChange={(e) => setRhContentFilter(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mb-2 outline-none focus:border-amber-400"
                    />
                    <select
                      value={rhContentTypeFilter}
                      onChange={(e) => setRhContentTypeFilter(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-amber-400 bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {rhFilteredContent.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">
                        {rhContentItems.length === 0 ? "No content yet. Add some!" : "No matches found."}
                      </p>
                    ) : (
                      rhFilteredContent.map((item) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData("text/plain", item.id); e.dataTransfer.effectAllowed = "copy"; setRhDragItem({ source: "library", item }); }}
                          onDragEnd={() => { setRhDragItem(null); setRhDragOverIndex(null); }}
                          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-amber-300 hover:bg-amber-50 transition-colors"
                        >
                          <span className="text-base flex-shrink-0">{getContentTypeIcon(item.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
                            <div className="flex items-center gap-2">
                              {item.duration && <p className="text-xs text-gray-400">{item.duration}</p>}
                              {item.link_url && <span className="text-xs text-blue-500">🔗 Link</span>}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteContentItem(item.id); }}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                            title="Delete content"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Collections List View ── */
              <>
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Resource Hub</h1>
                      <p className="text-gray-600 mt-1">Organize your content into themed collections</p>
                    </div>
                    <button
                      onClick={handleCreateCollection}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black bg-[#fbbf24] rounded-lg hover:bg-[#f59e0b] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Collection
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="max-w-4xl mx-auto">
                    {rhLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : rhCollections.length === 0 ? (
                      <div className="text-center py-20">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p className="text-gray-500 text-lg font-medium">No collections yet</p>
                        <p className="text-gray-400 mt-1">Click &quot;Add Collection&quot; to create your first themed resource collection.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rhCollections.map((col) => (
                          <div
                            key={col.id}
                            onClick={() => openCollectionEditor(col.id)}
                            className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-6 py-4 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer"
                          >
                            <span className="flex-shrink-0">{renderCollectionIcon(col.icon, 28, "#6b7280")}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900">{col.title}</h3>
                              {col.description && <p className="text-sm text-gray-500 truncate">{col.description}</p>}
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${col.delivery_mode === "drip" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                              {col.delivery_mode === "drip" ? "Drip" : "Self-Paced"}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {col.is_published ? "Live" : "Draft"}
                            </span>
                            <span className="text-sm text-gray-400">{col.item_count} items</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Add Content Modal */}
            {rhShowAddContent && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Add New Content</h3>
                    <button
                      onClick={() => setRhShowAddContent(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target;
                      const linkUrl = form.elements["rh-link"]?.value?.trim();
                      const file = form.elements["rh-file"]?.files?.[0];
                      if (!linkUrl && !file) { alert("Provide a link or upload a file"); return; }
                      handleAddContentItem({
                        type: form.elements["rh-type"].value,
                        title: form.elements["rh-title"].value,
                        description: form.elements["rh-description"].value,
                        duration: form.elements["rh-duration"].value,
                        file: linkUrl ? null : file,
                        link_url: linkUrl || null,
                      });
                    }}
                    className="p-6 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select name="rh-type" defaultValue="audio" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white">
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="pdf">PDF</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input name="rh-title" type="text" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" placeholder="e.g. Morning Meditation Guide" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                      <textarea name="rh-description" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none" placeholder="Brief description..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (optional)</label>
                      <input name="rh-duration" type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" placeholder="e.g. 15 min" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link (opens in new tab)</label>
                      <input name="rh-link" type="url" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" placeholder="https://..." onChange={(e) => { const fileInput = e.target.form.elements["rh-file"]; if (e.target.value.trim()) { fileInput.disabled = true; fileInput.value = ""; } else { fileInput.disabled = false; } }} />
                      <p className="text-xs text-gray-400 mt-1">If a link is provided, file upload is skipped and the link opens in a new tab for the user.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload File</label>
                      <input name="rh-file" type="file" accept="video/*,audio/*,.pdf" className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 disabled:opacity-40" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setRhShowAddContent(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={rhUploadingContent}
                        className="px-4 py-2 text-sm font-semibold text-black bg-[#fbbf24] rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50"
                      >
                        {rhUploadingContent ? "Uploading..." : "Add Content"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Draggable Preview Modal */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
            width: "375px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            zIndex: 9999,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Grab Bar */}
          <div
            onMouseDown={handlePreviewMouseDown}
            style={{
              padding: "12px 16px",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              cursor: isDragging ? "grabbing" : "grab",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Test Preview
              </span>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              style={{
                padding: "4px",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* iPhone-style Preview Frame */}
          <div
            style={{
              height: "667px",
              backgroundColor: "#ffffff",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <iframe
              ref={previewIframeRef}
              src="/user/dashboard?preview=true"
              onLoad={() => {
                // Send initial config when iframe loads
                if (previewIframeRef.current) {
                  const config = {
                    header: headerConfig,
                    branding: brandingConfig,
                    focus_tab: focusConfig,
                    awareness_tab: awarenessConfig,
                    emotional_state_tab: emotionalStateConfig,
                    coach_tab: coachTabConfig,
                    audio_library: audioLibrary,
                    current_day_index: currentDayIndex,
                  };
                  console.log(
                    "📤 Sending initial config on iframe load:",
                    config,
                  );
                  previewIframeRef.current.contentWindow.postMessage(
                    {
                      type: "PREVIEW_CONFIG_UPDATE",
                      config: config,
                    },
                    window.location.origin,
                  );
                }
              }}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
              title="Mobile Preview"
            />
          </div>
        </div>
      )}

      {/* Country Selection Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Select Your Country</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please select the country where your bank account is located.
            </p>
            <select
              className="w-full p-2 border rounded-md mb-4 bg-white text-gray-900"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="US">United States</option>
              <option value="DE">Germany</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="FR">France</option>
              <option value="ES">Spain</option>
              <option value="IT">Italy</option>
              <option value="NL">Netherlands</option>
              <option value="IE">Ireland</option>
              <option value="BE">Belgium</option>
              <option value="AT">Austria</option>
              <option value="AU">Australia</option>
              <option value="NZ">New Zealand</option>
              <option value="CH">Switzerland</option>
              <option value="SG">Singapore</option>
            </select>
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

      {/* Hidden Focus Preview for Screenshot Capture — iPhone 15 aspect ratio */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "393px",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div
          ref={focusPreviewRef}
          style={{
            width: "393px",
            height: "852px",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#f9fafb",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* App Header — gradient only here */}
          <div
            style={{
              padding: "56px 24px 64px",
              textAlign: "center",
              background:
                brandingConfig.background_type === "gradient"
                  ? `linear-gradient(${brandingConfig.gradient_angle || 135}deg, ${brandingConfig.gradient_color_1 || "#ff6b9d"} 0%, ${brandingConfig.gradient_color_2 || "#ffa057"} ${brandingConfig.gradient_spread || 50}%, ${brandingConfig.gradient_color_2 || "#ffa057"} 100%)`
                  : brandingConfig.background_color ||
                    "linear-gradient(135deg, #ff6b9d 0%, #ffa057 50%, #ffd96a 100%)",
            }}
          >
            {brandingConfig.app_logo_url ? (
              <img
                src={brandingConfig.app_logo_url}
                alt="Logo"
                style={{
                  height:
                    brandingConfig.app_logo_size === "small"
                      ? "36px"
                      : brandingConfig.app_logo_size === "large"
                        ? "64px"
                        : "48px",
                  objectFit: "contain",
                  margin: "0 auto 6px",
                  display: "block",
                }}
              />
            ) : (
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "6px",
                  letterSpacing: "-0.02em",
                }}
              >
                {headerConfig.title || "BrainPeace"}
              </h1>
            )}
            <p
              style={{
                fontSize: "16px",
                color: "#1a1a1a",
                opacity: 0.7,
              }}
            >
              {headerConfig.subtitle || "Mental Fitness for Active Minds"}
            </p>
          </div>

          {/* Focus Content */}
          <div style={{ padding: "0 24px" }}>
            {/* Today's Focus — overlaps header like the real app */}
            <div
              style={{
                backgroundColor: "#fffbf0",
                padding: "24px",
                borderRadius: "12px",
                marginTop: "-24px",
                marginBottom: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: "4px",
                    }}
                  >
                    {focusConfig.progress_bar?.title || "Today's Focus"}
                  </h2>
                  <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    {focusConfig.progress_bar?.subtitle ||
                      "Direct your energy intentionally"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "40px",
                      fontWeight: 700,
                      lineHeight: 1,
                      color: brandingConfig.primary_color || "#ef4444",
                    }}
                  >
                    0
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginTop: "4px",
                    }}
                  >
                    of 3
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "4px",
                }}
              />
            </div>

            {/* Task 1 - Morning Practice */}
            {focusConfig.task_1?.enabled !== false && (
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      backgroundColor: "#fff9e6",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {focusConfig.task_1?.icon_url ? (
                      <img
                        src={focusConfig.task_1.icon_url}
                        alt=""
                        style={{
                          width: "36px",
                          height: "36px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2" />
                        <path d="M12 20v2" />
                        <path d="m4.93 4.93 1.41 1.41" />
                        <path d="m17.66 17.66 1.41 1.41" />
                        <path d="M2 12h2" />
                        <path d="M20 12h2" />
                        <path d="m6.34 17.66-1.41 1.41" />
                        <path d="m19.07 4.93-1.41 1.41" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 600,
                          color: "#1a1a1a",
                        }}
                      >
                        {focusConfig.task_1?.title || "Morning Practice"}
                      </h3>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="#f59e0b"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <p style={{ fontSize: "14px", color: "#6b7280" }}>
                      {focusConfig.task_1?.subtitle ||
                        "Follow Your Spark • 7:00"}
                    </p>
                  </div>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: "2px solid #d1d5db",
                      flexShrink: 0,
                    }}
                  />
                </div>
                {/* Listen Now button - plain padding, no tricks */}
                <div
                  style={{
                    width: "100%",
                    padding: "5px 0 22px",
                    backgroundColor: brandingConfig.primary_color || "#ef4444",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "18px",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Listen Now
                </div>
              </div>
            )}

            {/* Task 2 - Daily Intention */}
            {focusConfig.task_2?.enabled !== false && (
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    backgroundColor: "#f3e8ff",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {focusConfig.task_2?.icon_url ? (
                    <img
                      src={focusConfig.task_2.icon_url}
                      alt=""
                      style={{
                        width: "36px",
                        height: "36px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 20 20"
                      fill="#a855f7"
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      marginBottom: "4px",
                    }}
                  >
                    {focusConfig.task_2?.title || "Daily Intention"}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    {focusConfig.task_2?.subtitle ||
                      "Set your focus for the day"}
                  </p>
                </div>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "2px solid #d1d5db",
                    flexShrink: 0,
                  }}
                />
              </div>
            )}

            {/* Task 3 - Evening Review */}
            {focusConfig.task_3?.enabled !== false && (
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    backgroundColor: "#e0e7ff",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {focusConfig.task_3?.icon_url ? (
                    <img
                      src={focusConfig.task_3.icon_url}
                      alt=""
                      style={{
                        width: "36px",
                        height: "36px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 20 20"
                      fill="#6366f1"
                    >
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      marginBottom: "4px",
                    }}
                  >
                    {focusConfig.task_3?.title || "Evening Review"}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    {focusConfig.task_3?.subtitle ||
                      "Log your awareness tonight"}
                  </p>
                </div>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "2px solid #d1d5db",
                    flexShrink: 0,
                  }}
                />
              </div>
            )}

            {/* Day Notes preview */}
            <div
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#10b981",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {focusConfig.day_notes?.icon_url ? (
                  <img
                    src={focusConfig.day_notes.icon_url}
                    alt=""
                    style={{
                      width: "32px",
                      height: "32px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    marginBottom: "2px",
                  }}
                >
                  {focusConfig.day_notes?.title || "Day Notes"}
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  {focusConfig.day_notes?.subtitle ||
                    "Log observations to spot patterns"}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Tab Bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#fff",
              borderTop: "1px solid #e5e7eb",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              display: "flex",
              justifyContent: "space-around",
              padding: "12px 0 28px",
              boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            }}
          >
            {/* Focus - Compass icon */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                flex: 1,
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke={brandingConfig.primary_color || "#ef4444"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon
                  points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
                  fill={brandingConfig.primary_color || "#ef4444"}
                  stroke={brandingConfig.primary_color || "#ef4444"}
                />
              </svg>
              <span
                style={{
                  fontSize: "12px",
                  color: brandingConfig.primary_color || "#ef4444",
                  fontWeight: 600,
                }}
              >
                Focus
              </span>
            </div>
            {/* Awareness - Sun icon */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                flex: 1,
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              <span
                style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 400 }}
              >
                Awareness
              </span>
            </div>
            {/* Coach - MessageCircle icon */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                flex: 1,
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              >
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
              </svg>
              <span
                style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 400 }}
              >
                Coach
              </span>
            </div>
            {/* More - Menu icon */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                flex: 1,
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
              <span
                style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 400 }}
              >
                More
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            backgroundColor: toastMessage.startsWith("❌") ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${toastMessage.startsWith("❌") ? "#fecaca" : "#bbf7d0"}`,
            color: toastMessage.startsWith("❌") ? "#991b1b" : "#166534",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            zIndex: 99999,
            fontSize: "14px",
            fontWeight: 500,
            maxWidth: "400px",
            animation: "toastSlideIn 0.3s ease-out",
          }}
        >
          {toastMessage}
        </div>
      )}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
