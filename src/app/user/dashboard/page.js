"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import posthog from "posthog-js";
import {
  Compass,
  Sun,
  MessageCircle,
  Menu,
  Star,
  Calendar,
} from "lucide-react";

function UserDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreviewMode = searchParams?.get("preview") === "true";
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeTab") || "focus";
    }
    return "focus";
  });
  const [dayNotes, setDayNotes] = useState("");
  const [completedTasks, setCompletedTasks] = useState({
    morning: false,
    intention: false,
    evening: false,
  });
  const [focusEntry, setFocusEntry] = useState(null);
  const [isSavingFocus, setIsSavingFocus] = useState(false);
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [intentionObstacles, setIntentionObstacles] = useState("");
  const [intentionFocusWord, setIntentionFocusWord] = useState("");
  const [isSavingIntention, setIsSavingIntention] = useState(false);
  const [notesModified, setNotesModified] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Notes saved successfully");
  const previousCompletedCount = useRef(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedMindfulness, setSelectedMindfulness] = useState(null);
  const [modalTime, setModalTime] = useState("01:50 PM");
  const [modalNotes, setModalNotes] = useState("");
  const [showEmotionalModal, setShowEmotionalModal] = useState(false);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [emotionalEntries, setEmotionalEntries] = useState([]);
  const [mindfulnessEntries, setMindfulnessEntries] = useState([]);
  const [isLoadingAwareness, setIsLoadingAwareness] = useState(false);
  const [showSuggestedPractice, setShowSuggestedPractice] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chatMessage, setChatMessage] = useState("");
  const [showCoachProfile, setShowCoachProfile] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Before we dive in - what's one thing you're grateful for right now?",
    },
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [tokenWarning, setTokenWarning] = useState(null);
  const chatEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const configFetched = useRef(false);
  const [moreSubpage, setMoreSubpage] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("moreSubpage") || null;
    }
    return null;
  }); // null, 'announcements', 'resources', 'insights', 'library', 'settings'
  const [selectedAwarenessDate, setSelectedAwarenessDate] = useState(
    new Date(),
  );
  const [selectedInsightsDate, setSelectedInsightsDate] = useState(null);
  const [insightsMonth, setInsightsMonth] = useState(new Date());
  const [insightsData, setInsightsData] = useState({});
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [dayNotesEdit, setDayNotesEdit] = useState("");
  const [isSavingDayNotes, setIsSavingDayNotes] = useState(false);
  const [insightsTab, setInsightsTab] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("insightsTab") || "focus";
    }
    return "focus";
  }); // 'focus' or 'awareness'
  const [awarenessTimeframe, setAwarenessTimeframe] = useState(7); // days
  const [awarenessInsightsData, setAwarenessInsightsData] = useState([]);
  const [settingsFirstName, setSettingsFirstName] = useState("");
  const [settingsLastName, setSettingsLastName] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsTimezone, setSettingsTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [coachConfig, setCoachConfig] = useState(null);
  const primaryColor = coachConfig?.branding?.primary_color || "#6366f1";

  // Currency helper based on coach's Stripe country
  const COUNTRY_CURRENCY = {
    US: { code: "usd", symbol: "$" },
    DE: { code: "eur", symbol: "€" },
    FR: { code: "eur", symbol: "€" },
    ES: { code: "eur", symbol: "€" },
    IT: { code: "eur", symbol: "€" },
    NL: { code: "eur", symbol: "€" },
    IE: { code: "eur", symbol: "€" },
    BE: { code: "eur", symbol: "€" },
    AT: { code: "eur", symbol: "€" },
    GB: { code: "gbp", symbol: "£" },
    CA: { code: "cad", symbol: "CA$" },
    AU: { code: "aud", symbol: "A$" },
    NZ: { code: "nzd", symbol: "NZ$" },
    CH: { code: "chf", symbol: "CHF " },
    SG: { code: "sgd", symbol: "S$" },
  };
  const coachCurrency = COUNTRY_CURRENCY[user?.coach?.stripe_country] || { code: "usd", symbol: "$" };
  const cs = coachCurrency.symbol;
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const practiceAudioRef = useRef(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [upgradingToPremium, setUpgradingToPremium] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalContext, setUpgradeModalContext] = useState(""); // which feature they tried to access
  const [isPracticePlaying, setIsPracticePlaying] = useState(false);
  const [practiceCurrentTime, setPracticeCurrentTime] = useState(0);
  const [practiceDuration, setPracticeDuration] = useState(0);
  const [showPracticeControls, setShowPracticeControls] = useState(false);
  const suggestedPracticeRef = useRef(null);

  // Resource Hub state
  const [rhCollections, setRhCollections] = useState([]);
  const [rhActiveCollection, setRhActiveCollection] = useState(null);
  const [rhCollectionItems, setRhCollectionItems] = useState([]);
  const [rhLoadingCollections, setRhLoadingCollections] = useState(false);
  const [rhLoadingItems, setRhLoadingItems] = useState(false);
  const [rhVideoPlayer, setRhVideoPlayer] = useState(null); // { url, title } or null
  const [rhAudioPlayer, setRhAudioPlayer] = useState(null); // { url, title } or null
  const [rhAudioPlaying, setRhAudioPlaying] = useState(false);
  const [rhAudioTime, setRhAudioTime] = useState(0);
  const [rhAudioDuration, setRhAudioDuration] = useState(0);
  const rhAudioRef = useRef(null);

  // Timezone utility functions
  const getTodayInUserTimezone = () => {
    const now = new Date();
    const userDate = new Date(
      now.toLocaleString("en-US", { timeZone: settingsTimezone }),
    );
    return userDate.toISOString().split("T")[0];
  };

  const formatDateInUserTimezone = (dateStr) => {
    // Convert YYYY-MM-DD string to user's timezone
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toISOString().split("T")[0];
  };

  // Get today's audio from the audio library
  const getTodaysAudio = () => {
    const audioLibrary = coachConfig?.focus_tab?.audio_library;
    const currentDayIndex = coachConfig?.focus_tab?.current_day_index || 0;

    if (!audioLibrary || !Array.isArray(audioLibrary)) {
      // Fallback to old single audio format
      return coachConfig?.focus_tab?.task_1?.audio_url || null;
    }

    // Filter out empty slots
    const filledAudios = audioLibrary.filter(
      (audio) => audio && audio.audio_url,
    );

    if (filledAudios.length === 0) {
      return null;
    }

    // Calculate which audio to play based on days since start
    const daysSinceStart = Math.floor(
      (new Date().getTime() -
        new Date(
          coachConfig?.focus_tab?.library_start_date || new Date(),
        ).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Use current_day_index as the starting point, then cycle through
    const index = (currentDayIndex + daysSinceStart) % filledAudios.length;
    return filledAudios[index]?.audio_url || null;
  };

  useEffect(() => {
    if (isPreviewMode) {
      // Set mock user data for preview
      setUser({
        id: "preview-user",
        email: "demo@example.com",
        first_name: "Demo",
        last_name: "User",
        full_name: "Demo User",
        timezone: "America/New_York",
        coach_id: "preview-coach",
      });
      // Set mock premium subscription for preview
      setSubscriptionStatus({
        isPremium: true,
        status: "active",
        current_period_end: null,
        cancel_at_period_end: false,
      });
      setIsLoading(false);
    } else {
      fetchUser();
      // fetchSubscriptionStatus() moved to separate useEffect dependent on user
    }
  }, [isPreviewMode]);

  // Fetch subscription status once user is loaded
  useEffect(() => {
    if (user && !isPreviewMode) {
      fetchSubscriptionStatus();
    }
  }, [user, isPreviewMode]);

  // Handle subscription status from Stripe checkout
  useEffect(() => {
    const subscriptionParam = searchParams?.get("subscription");

    if (subscriptionParam === "canceled") {
      setToastMessage(
        "Checkout was canceled. You can upgrade anytime from Settings.",
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);

      // Clean up URL parameter
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("subscription");
        window.history.replaceState({}, "", url.pathname);
      }
    } else if (subscriptionParam === "success") {
      setToastMessage(
        "🎉 Welcome to Daily Companion! Your subscription is now active.",
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Clean up URL parameter
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("subscription");
        window.history.replaceState({}, "", url.pathname);
      }

      // Refresh subscription status
      if (user && !isPreviewMode) {
        fetchSubscriptionStatus();
      }
    }
  }, [searchParams, user, isPreviewMode]);

  useEffect(() => {
    if (user && !configFetched.current) {
      configFetched.current = true;
      if (isPreviewMode) {
        // Set mock coach config for preview
        setCoachConfig({
          branding: {
            primary_color: "#7c3aed",
            background_type: "gradient",
            background_color: "#f9fafb",
            gradient_color_1: "#ff6b9d",
            gradient_color_2: "#ffa057",
            gradient_angle: 135,
            app_logo_url: null,
          },
          focus_tab: {
            progress_bar: {
              title: "Today's Focus",
              subtitle: "Direct your energy intentionally",
            },
            task_1: {
              enabled: true,
              title: "Morning Meditation",
              subtitle: "Start your day centered",
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
          },
          awareness_tab: {
            modal_title: "Nice catch!",
            logs: [
              {
                id: "present",
                label: "Present moment",
                prompt: "What pattern did you catch?",
                color: "#60a5fa",
              },
            ],
          },
        });
        setIsConfigLoading(false);
      } else {
        fetchCoachConfig();
      }
    }
  }, [user, isPreviewMode]);

  // Listen for config updates from parent window (preview mode)
  useEffect(() => {
    if (!isPreviewMode) return;

    const handleMessage = (event) => {
      // Add origin check in production
      if (event.data.type === "PREVIEW_CONFIG_UPDATE") {
        console.log("📥 Received config update in preview:", event.data.config);
        setCoachConfig(event.data.config);
        setIsConfigLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isPreviewMode]);

  // Set dynamic favicon and page title from coach branding
  useEffect(() => {
    if (!user?.coach?.business_name) return;

    document.title = `${user.coach.business_name} | Daily Companion`;

    if (user.coach.logo_url) {
      document
        .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
        .forEach((el) => el.remove());
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = user.coach.logo_url;
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
  }, [user?.coach?.business_name, user?.coach?.logo_url]);

  useEffect(() => {
    if (user && activeTab === "focus") {
      fetchFocusEntry();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user && activeTab === "awareness") {
      fetchAwarenessEntries(selectedAwarenessDate);
    }
  }, [user, activeTab, selectedAwarenessDate]);

  useEffect(() => {
    if (user && moreSubpage === "insights" && insightsTab === "focus") {
      fetchInsightsData(insightsMonth);
    }
  }, [user, moreSubpage, insightsMonth, insightsTab]);

  useEffect(() => {
    if (user && moreSubpage === "insights" && insightsTab === "awareness") {
      fetchAwarenessInsights(awarenessTimeframe);
    }
  }, [user, moreSubpage, insightsTab, awarenessTimeframe]);

  // Fetch resource hub collections when page opens
  useEffect(() => {
    if (user && moreSubpage === "resources" && subscriptionStatus?.tier === 3 && rhCollections.length === 0 && !rhLoadingCollections) {
      fetchRhCollections();
    }
  }, [user, moreSubpage, subscriptionStatus]);

  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("activeTab", activeTab);
    }
    if (prevTabRef.current !== activeTab && user) {
      posthog.capture("tab_switched", {
        tab_name: activeTab,
        previous_tab: prevTabRef.current,
      });
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);

  // Load user-specific chat messages from localStorage after user is loaded
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const storageKey = `chatMessages_${user.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            setChatMessages(parsed);
          }
        } catch (e) {
          console.error("Failed to parse saved chat messages:", e);
        }
      }
    }
  }, [user?.id]);

  // Persist chat messages to user-specific localStorage
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const storageKey = `chatMessages_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(chatMessages));
    }
  }, [chatMessages, user?.id]);

  // Scroll to suggested practice when it appears
  useEffect(() => {
    if (showSuggestedPractice && suggestedPracticeRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        suggestedPracticeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [showSuggestedPractice]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (moreSubpage) {
        localStorage.setItem("moreSubpage", moreSubpage);
      } else {
        localStorage.removeItem("moreSubpage");
      }
    }
  }, [moreSubpage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("insightsTab", insightsTab);
    }
  }, [insightsTab]);

  useEffect(() => {
    if (user && moreSubpage === "settings") {
      fetchProfileSettings();
      fetchSubscriptionStatus();
    }
  }, [user, moreSubpage]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (!res.ok || !data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);

      // Identify user in PostHog
      posthog.identify(data.user.id, {
        email: data.user.email,
        role: "user",
        coach_id: data.user.coach_id,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        subscription_tier: data.user.subscription?.subscription_tier,
        subscription_status: data.user.subscription?.status,
      });

      // Set timezone from user profile
      if (data.user.timezone) {
        setSettingsTimezone(data.user.timezone);
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoachConfig = async () => {
    try {
      const res = await fetch("/api/user/coach-config");
      if (checkAuthResponse(res)) return;
      const data = await res.json();

      if (res.ok && data.config) {
        let parsedConfig = { ...data.config };

        // Parse sections if they are strings (fixes double-stringification issue)
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

        if (parsedConfig.focus_tab) {
          parsedConfig.focus_tab = parseSection(parsedConfig.focus_tab);
        }
        if (parsedConfig.header) {
          parsedConfig.header = parseSection(parsedConfig.header);
        }
        if (parsedConfig.branding) {
          parsedConfig.branding = parseSection(parsedConfig.branding);
        }
        if (parsedConfig.awareness_tab) {
          parsedConfig.awareness_tab = parseSection(parsedConfig.awareness_tab);
        }
        if (parsedConfig.emotional_state_tab) {
          parsedConfig.emotional_state_tab = parseSection(
            parsedConfig.emotional_state_tab,
          );
        }

        setCoachConfig(parsedConfig);
      }
    } catch (error) {
      console.error("Failed to fetch coach config:", error);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const fetchFocusEntry = async () => {
    try {
      const todayStr = getTodayInUserTimezone();
      const res = await fetch(`/api/daily-entries/date?date=${todayStr}`);
      if (checkAuthResponse(res)) return;
      const data = await res.json();

      if (res.ok && data.entry) {
        setFocusEntry(data.entry);
        setCompletedTasks({
          morning: data.entry.task_1_completed,
          intention: data.entry.task_2_completed,
          evening: data.entry.task_3_completed,
        });
        setDayNotes(data.entry.focus_notes || "");
        setNotesModified(false); // Reset modified state on load
        setIntentionObstacles(data.entry.intention_obstacles || "");
        setIntentionFocusWord(data.entry.intention_focus_word || "");
      }
    } catch (error) {
      console.error("Failed to fetch daily entry:", error);
    }
  };

  const fetchAwarenessEntries = async (date) => {
    setIsLoadingAwareness(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await fetch(`/api/daily-entries/date?date=${dateStr}`);
      const data = await res.json();

      if (res.ok && data.entry) {
        setEmotionalEntries(data.entry.log_2_entries || []);
        setMindfulnessEntries(data.entry.log_1_entries || []);
      } else {
        setEmotionalEntries([]);
        setMindfulnessEntries([]);
      }
    } catch (error) {
      console.error("Failed to fetch awareness entries:", error);
      setEmotionalEntries([]);
      setMindfulnessEntries([]);
    } finally {
      setIsLoadingAwareness(false);
    }
  };

  const fetchInsightsData = async (month) => {
    try {
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;
      const res = await fetch(
        `/api/daily-entries/month?year=${year}&month=${monthNum}`,
      );
      const data = await res.json();

      if (res.ok && data.entries) {
        // Convert array to object keyed by date for easier lookup
        const dataByDate = {};
        data.entries.forEach((entry) => {
          dataByDate[entry.date] = entry;
        });
        setInsightsData(dataByDate);
      }
    } catch (error) {
      console.error("Failed to fetch insights data:", error);
    }
  };

  const handleInsightsDateClick = async (dateStr) => {
    setSelectedInsightsDate(dateStr);
    const entry = insightsData[dateStr];
    setSelectedDayData(entry || null);
    setDayNotesEdit(entry?.focus_notes || "");
  };

  const handleSaveDayNotes = async () => {
    if (!selectedInsightsDate || isPreviewMode) return;

    setIsSavingDayNotes(true);
    try {
      const res = await fetch("/api/daily-entries/focus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus_notes: dayNotesEdit,
          date: selectedInsightsDate,
        }),
      });

      if (res.ok) {
        fetchInsightsData(insightsMonth);
        setToastMessage("Day notes saved");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        posthog.capture("day_notes_saved", {
          date: selectedInsightsDate,
          word_count: dayNotesEdit ? dayNotesEdit.split(/\s+/).filter(Boolean).length : 0,
        });
      }
    } catch (error) {
      console.error("Failed to save day notes:", error);
    } finally {
      setIsSavingDayNotes(false);
    }
  };

  const fetchAwarenessInsights = async (days) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const res = await fetch(
        `/api/daily-entries/range?startDate=${
          startDate.toISOString().split("T")[0]
        }&endDate=${endDate.toISOString().split("T")[0]}`,
      );
      const data = await res.json();

      if (res.ok && data.entries) {
        setAwarenessInsightsData(data.entries);
      }
    } catch (error) {
      console.error("Failed to fetch awareness insights:", error);
    }
  };

  const calculateEmotionalDistribution = () => {
    const emotionCounts = {};
    let totalCount = 0;

    awarenessInsightsData.forEach((entry) => {
      if (entry.log_2_entries && Array.isArray(entry.log_2_entries)) {
        entry.log_2_entries.forEach((log) => {
          // The structure is: log.emotions = ["categoryId-emotion"]
          if (log.emotions && Array.isArray(log.emotions)) {
            log.emotions.forEach((emotionStr) => {
              // Extract category and emotion name
              const parts = emotionStr.split("-");
              const categoryId = parts[0] || "";
              const emotionName = parts[1] || emotionStr;

              const key = emotionStr; // Use full string as key to track category
              if (!emotionCounts[key]) {
                emotionCounts[key] = {
                  emotion: emotionName,
                  categoryId: categoryId,
                  count: 0,
                };
              }
              emotionCounts[key].count++;
              totalCount++;
            });
          }
        });
      }
    });

    // Convert to array with percentages
    const distribution = Object.values(emotionCounts)
      .map((item) => ({
        emotion: item.emotion,
        categoryId: item.categoryId,
        count: item.count,
        percentage: ((item.count / totalCount) * 100).toFixed(0),
      }))
      .sort((a, b) => b.count - a.count);

    return { distribution, totalCount };
  };

  const fetchProfileSettings = async () => {
    try {
      const res = await fetch("/api/profile");
      if (checkAuthResponse(res)) return;
      const data = await res.json();

      if (res.ok && data.profile) {
        setSettingsFirstName(data.profile.first_name || "");
        setSettingsLastName(data.profile.last_name || "");
        setSettingsEmail(data.profile.email || "");
        if (data.profile.timezone) {
          setSettingsTimezone(data.profile.timezone);
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchSubscriptionStatus = async () => {
    if (!user) return;

    setIsLoadingSubscription(true);
    try {
      const res = await fetch("/api/user/subscription-status");
      if (checkAuthResponse(res)) return;
      const data = await res.json();

      if (res.ok) {
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Resource Hub functions
  const fetchRhCollections = async () => {
    setRhLoadingCollections(true);
    try {
      const res = await fetch("/api/user/resource-hub");
      if (checkAuthResponse(res)) return;
      if (res.ok) {
        const data = await res.json();
        setRhCollections(data.collections || []);
      }
    } catch (e) { console.error("Failed to fetch resource hub:", e); }
    setRhLoadingCollections(false);
  };

  const openRhCollection = async (collectionId) => {
    setRhLoadingItems(true);
    setRhActiveCollection(collectionId);
    try {
      const res = await fetch(`/api/user/resource-hub?collectionId=${collectionId}`);
      if (checkAuthResponse(res)) return;
      if (res.ok) {
        const data = await res.json();
        setRhActiveCollection(data.collection);
        setRhCollectionItems(data.items || []);
        posthog.capture("resource_hub_collection_opened", {
          collection_id: data.collection?.id || collectionId,
          collection_name: data.collection?.name,
        });
      }
    } catch (e) { console.error("Failed to fetch collection:", e); }
    setRhLoadingItems(false);
  };

  const markContentViewed = async (contentItemId, collectionId) => {
    try {
      await fetch("/api/user/resource-hub/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_item_id: contentItemId, collection_id: collectionId }),
      });
    } catch (e) { console.error("Failed to mark viewed:", e); }
  };

  const handleContentAction = async (item, collection) => {
    const content = item.content_item;
    if (!content) return;

    await markContentViewed(content.id, collection.id);

    posthog.capture("resource_hub_content_viewed", {
      content_type: content.type,
      collection_id: collection.id,
      is_external_link: !!content.link_url,
    });

    if (content.link_url) {
      window.open(content.link_url, "_blank");
      openRhCollection(collection.id);
      return;
    }

    if (content.type === "pdf") {
      window.open(content.file_url, "_blank");
      openRhCollection(collection.id);
    } else if (content.type === "video") {
      setRhVideoPlayer({ url: content.file_url, title: content.title });
      openRhCollection(collection.id);
    } else if (content.type === "audio") {
      setRhAudioPlayer({ url: content.file_url, title: content.title });
      setRhAudioPlaying(false);
      setRhAudioTime(0);
      setRhAudioDuration(0);
      openRhCollection(collection.id);
    }
  };

  const formatRhTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleChangeTier = async (tier, interval = "monthly") => {
    if (!user?.coach) {
      alert("No coach assigned. Please contact support.");
      return;
    }

    setUpgradingToPremium(true);
    try {
      const res = await fetch("/api/stripe/user-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachSlug: user.coach.slug,
          tier: tier,
          interval: interval,
        }),
      });

      if (checkAuthResponse(res)) return;

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Failed to start checkout");
    } finally {
      setUpgradingToPremium(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    // Default to tier 2 for backward compatibility
    await handleChangeTier(2, "monthly");
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll keep access until the end of your billing period.",
      )
    ) {
      return;
    }

    setCancelingSubscription(true);
    try {
      const res = await fetch("/api/user/cancel-subscription", {
        method: "POST",
      });

      if (checkAuthResponse(res)) return;

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        fetchSubscriptionStatus(); // Refresh status
      } else {
        alert(data.error || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel subscription");
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleSaveSettings = async () => {
    if (isPreviewMode) return;

    setIsSavingSettings(true);
    try {
      // Save basic profile info
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: settingsFirstName,
          last_name: settingsLastName,
          email: settingsEmail,
        }),
      });

      if (checkAuthResponse(profileRes)) return;

      // Save timezone
      const settingsRes = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone: settingsTimezone,
        }),
      });

      if (checkAuthResponse(settingsRes)) return;

      if (profileRes.ok && settingsRes.ok) {
        setToastMessage("Settings saved");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: settingsEmail,
        }),
      });

      if (res.ok) {
        setToastMessage("Password reset email sent! Check your inbox.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Failed to send reset email:", error);
      alert("Failed to send reset email");
    }
  };

  const checkAuthResponse = (res) => {
    if (res.status === 401) {
      router.push("/login");
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const toggleTask = async (task) => {
    const newValue = !completedTasks[task];

    // Optimistically update UI
    setCompletedTasks((prev) => ({
      ...prev,
      [task]: newValue,
    }));

    // Skip API call in preview mode
    if (isPreviewMode) return;

    // Save to backend
    try {
      const taskMap = {
        morning: "task_1_completed",
        intention: "task_2_completed",
        evening: "task_3_completed",
      };

      const todayStr = getTodayInUserTimezone();
      const res = await fetch("/api/daily-entries/focus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayStr,
          [taskMap[task]]: newValue,
        }),
      });

      if (checkAuthResponse(res)) return;

      if (res.ok) {
        const data = await res.json();
        setFocusEntry(data.entry);
        if (newValue) {
          posthog.capture("focus_task_completed", {
            task_name: task,
            date: todayStr,
          });
        }
      } else {
        // Revert on error
        setCompletedTasks((prev) => ({
          ...prev,
          [task]: !newValue,
        }));
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      // Revert on error
      setCompletedTasks((prev) => ({
        ...prev,
        [task]: !newValue,
      }));
    }
  };

  const saveIntention = async (obstacles, focusWord) => {
    setIsSavingIntention(true);
    try {
      const todayStr = getTodayInUserTimezone();
      const res = await fetch("/api/daily-entries/focus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayStr,
          task_2_completed: true,
          intention_obstacles: obstacles,
          intention_focus_word: focusWord,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFocusEntry(data.entry);
        setCompletedTasks((prev) => ({ ...prev, intention: true }));
        setIntentionObstacles(obstacles);
        setIntentionFocusWord(focusWord);
        setShowIntentionModal(false);
        posthog.capture("intention_set", {
          has_obstacles: !!obstacles,
          has_focus_word: !!focusWord,
          date: getTodayInUserTimezone(),
        });
      }
    } catch (error) {
      console.error("Failed to save intention:", error);
    } finally {
      setIsSavingIntention(false);
    }
  };

  // Audio player functions
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (!showAudioControls) {
      setShowAudioControls(true);
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      posthog.capture("morning_practice_audio_played", {
        date: getTodayInUserTimezone(),
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    // Auto-check the morning task when audio finishes
    if (!completedTasks.morning) {
      toggleTask("morning");
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Practice audio player functions
  const togglePracticePlayPause = () => {
    if (!practiceAudioRef.current) return;

    // Show controls when first clicked
    if (!showPracticeControls) {
      setShowPracticeControls(true);
    }

    if (isPracticePlaying) {
      practiceAudioRef.current.pause();
    } else {
      practiceAudioRef.current.play();
    }
    setIsPracticePlaying(!isPracticePlaying);
  };

  const handlePracticeTimeUpdate = () => {
    if (!practiceAudioRef.current) return;
    setPracticeCurrentTime(practiceAudioRef.current.currentTime);
  };

  const handlePracticeLoadedMetadata = () => {
    if (!practiceAudioRef.current) return;
    setPracticeDuration(practiceAudioRef.current.duration);
  };

  const handlePracticeSeek = (e) => {
    if (!practiceAudioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    practiceAudioRef.current.currentTime = seekTime;
    setPracticeCurrentTime(seekTime);
  };

  const handlePracticeAudioEnded = () => {
    setIsPracticePlaying(false);
    setPracticeCurrentTime(0);
  };

  // Calculate enabled tasks based on coach config
  const enabledTasks = {
    morning: coachConfig?.focus_tab?.task_1?.enabled !== false,
    intention: coachConfig?.focus_tab?.task_2?.enabled !== false,
    evening: coachConfig?.focus_tab?.task_3?.enabled !== false,
  };

  const completedCount = Object.entries(completedTasks).filter(
    ([key, completed]) => enabledTasks[key] && completed,
  ).length;
  const totalTasks = Object.values(enabledTasks).filter(Boolean).length;
  const progressPercent =
    totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Trigger confetti when all enabled tasks are completed
  useEffect(() => {
    if (
      totalTasks > 0 &&
      completedCount === totalTasks &&
      previousCompletedCount.current === totalTasks - 1
    ) {
      // Full screen confetti burst
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 10000,
      };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Burst from multiple positions
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
    previousCompletedCount.current = completedCount;
  }, [completedCount]);

  // Get mindfulness items from coach config or use defaults
  const mindfulnessItems = coachConfig?.awareness_tab?.logs || [
    { id: "present", label: "Present moment", color: "#60a5fa" },
    { id: "gratitude", label: "Felt gratitude", color: "#4ade80" },
    { id: "pattern", label: "Shifted a pattern", color: "#f87171" },
  ];

  const handleMindfulnessClick = (item) => {
    setSelectedMindfulness(item);
    setShowModal(true);
  };

  const handleSaveMoment = async () => {
    if (!selectedMindfulness || isPreviewMode) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: settingsTimezone,
    });

    const entry = {
      id: crypto.randomUUID(),
      label: selectedMindfulness.label,
      time: timeStr,
      notes: modalNotes,
      timestamp: now.toISOString(),
    };

    // Convert selected date to timezone-aware date string
    const dateInTz = new Date(
      selectedAwarenessDate.toLocaleString("en-US", {
        timeZone: settingsTimezone,
      }),
    );
    const dateStr = dateInTz.toISOString().split("T")[0];

    try {
      const res = await fetch("/api/daily-entries/awareness", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_1_entry: entry, date: dateStr }),
      });

      if (res.ok) {
        setShowModal(false);
        setModalNotes("");
        setSelectedMindfulness(null);

        fetchAwarenessEntries(selectedAwarenessDate);

        setToastMessage("Moment logged successfully");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);

        posthog.capture("awareness_moment_logged", {
          mindfulness_type: entry.label,
          date: dateStr,
        });
      }
    } catch (error) {
      console.error("Failed to save mindfulness moment:", error);
    }
  };

  const emotions = coachConfig?.emotional_state_tab?.categories
    ? coachConfig.emotional_state_tab.categories.reduce((acc, cat) => {
        // Filter out empty options and handle both old string format and new object format
        acc[cat.id] = (cat.options || [])
          .filter((opt) => {
            if (typeof opt === "string") return opt.trim() !== "";
            return opt.name && opt.name.trim() !== "";
          })
          .map((opt) => (typeof opt === "string" ? { name: opt } : opt));
        return acc;
      }, {})
    : {
        challenging: [
          { name: "Stressed" },
          { name: "Anxious" },
          { name: "Overwhelmed" },
          { name: "Sad" },
          { name: "Angry" },
          { name: "Frustrated" },
          { name: "Restless" },
          { name: "Lonely" },
          { name: "Tired" },
          { name: "Scattered" },
        ],
        positive: [
          { name: "Calm" },
          { name: "Joyful" },
          { name: "Creative" },
          { name: "Energized" },
          { name: "Grateful" },
          { name: "Peaceful" },
          { name: "Hopeful" },
          { name: "Content" },
          { name: "Confident" },
          { name: "Inspired" },
        ],
      };

  const toggleEmotion = (emotionId, categoryId) => {
    // Only allow selecting ONE emotion at a time
    setSelectedEmotions([{ id: emotionId, categoryId }]);
  };

  const handleDeleteEntry = async (entryId, entryType) => {
    // Convert selected date to timezone-aware date string
    const dateInTz = new Date(
      selectedAwarenessDate.toLocaleString("en-US", {
        timeZone: settingsTimezone,
      }),
    );
    const dateStr = dateInTz.toISOString().split("T")[0];

    try {
      let updatedEntries;
      if (entryType === "mindfulness") {
        updatedEntries = mindfulnessEntries.filter((e) => e.id !== entryId);
        setMindfulnessEntries(updatedEntries);
      } else {
        updatedEntries = emotionalEntries.filter((e) => e.id !== entryId);
        setEmotionalEntries(updatedEntries);
      }

      // Update backend
      const res = await fetch("/api/daily-entries/awareness", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          [entryType === "mindfulness" ? "log_1_entries" : "log_2_entries"]:
            updatedEntries,
        }),
      });

      if (!res.ok) {
        // Revert on error
        if (entryType === "mindfulness") {
          setMindfulnessEntries(mindfulnessEntries);
        } else {
          setEmotionalEntries(emotionalEntries);
        }
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  const handleEmotionalDone = async () => {
    if (selectedEmotions.length === 0) {
      setShowEmotionalModal(false);
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: settingsTimezone,
    });

    // Get the selected emotion info
    const selected = selectedEmotions[0];
    const emotionLabel = selected.id; // Now this is the emotion name directly

    // Format: categoryId-EmotionLabel
    const formattedEmotions = [`${selected.categoryId}-${emotionLabel}`];

    const entry = {
      id: crypto.randomUUID(),
      emotions: formattedEmotions,
      time: timeStr,
      timestamp: now.toISOString(),
    };

    // Convert selected date to timezone-aware date string
    const dateInTz = new Date(
      selectedAwarenessDate.toLocaleString("en-US", {
        timeZone: settingsTimezone,
      }),
    );
    const dateStr = dateInTz.toISOString().split("T")[0];

    try {
      const res = await fetch("/api/daily-entries/awareness", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_2_entry: entry, date: dateStr }),
      });

      if (res.ok) {
        const data = await res.json();
        setEmotionalEntries(data.entry.log_2_entries || []);
        setShowEmotionalModal(false);

        const category = emotions[selected.categoryId];
        const emotionObj = category?.find((e) => e.name === emotionLabel);

        if (emotionObj && emotionObj.audio_url) {
          setSelectedPractice(emotionObj);
          setShowSuggestedPractice(true);
        } else {
          setSelectedPractice(null);
          setShowSuggestedPractice(false);
        }

        setSelectedEmotions([]);

        posthog.capture("emotional_state_logged", {
          emotion_count: formattedEmotions.length,
          date: dateStr,
        });
      }
    } catch (error) {
      console.error("Failed to save emotional state:", error);
      setShowEmotionalModal(false);
      setSelectedEmotions([]);
    }
  };

  const handleNewSession = () => {
    // Reset chat to initial state
    const initialMessages = [
      {
        role: "assistant",
        content:
          "Before we dive in - what's one thing you're grateful for right now?",
      },
    ];
    setChatMessages(initialMessages);
    setChatMessage("");
    setTokenWarning(null);
    setShowCoachProfile(false);

    // Clear from user-specific localStorage
    if (user && typeof window !== "undefined") {
      const storageKey = `chatMessages_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(initialMessages));
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isSendingChat) return;

    // Disable chat in preview mode
    if (isPreviewMode) {
      setChatMessage("");
      return;
    }

    const userMessage = chatMessage.trim();
    setChatMessage("");

    // Add user message to chat
    const newMessages = [
      ...chatMessages,
      { role: "user", content: userMessage },
    ];
    setChatMessages(newMessages);
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (checkAuthResponse(response)) return;

      const data = await response.json();

      if (data.error) {
        // Check if it's a token limit error
        const errorMessage =
          data.message ||
          "Sorry, I had trouble processing that. Please try again.";
        setChatMessages([
          ...newMessages,
          {
            role: "assistant",
            content: errorMessage,
          },
        ]);
        return;
      }

      setChatMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.message,
        },
      ]);

      // Show token usage warning if present
      if (data.warning) {
        setTokenWarning(data.warning);
        // Auto-hide warning after 10 seconds
        setTimeout(() => setTokenWarning(null), 10000);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  useEffect(() => {
    // Scroll to the top of the last message
    lastMessageRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [chatMessages]);

  // Render markdown bold syntax
  const renderMessageContent = (content) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Get current week days for awareness tab
  const today = new Date();
  const todayInUserTz = new Date(
    today.toLocaleString("en-US", { timeZone: settingsTimezone }),
  );
  const currentDay = today.getDate();
  const startOfWeek = new Date(selectedAwarenessDate);
  startOfWeek.setDate(
    selectedAwarenessDate.getDate() - selectedAwarenessDate.getDay(),
  );

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    const isFuture = day > todayInUserTz;
    weekDays.push({
      date: day.getDate(),
      fullDate: new Date(day),
      dayName: ["S", "S", "M", "T", "W", "T", "F"][i],
      isToday:
        day.getDate() === currentDay && day.getMonth() === today.getMonth(),
      isSelected:
        day.getDate() === selectedAwarenessDate.getDate() &&
        day.getMonth() === selectedAwarenessDate.getMonth(),
      isFuture: isFuture,
    });
  }

  const formatDate = (date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${days[date.getDay()]}, ${
      months[date.getMonth()]
    } ${date.getDate()}`;
  };

  if (isLoading || isConfigLoading) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #f3f4f6",
              borderTop: "4px solid #6b7280",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        paddingBottom: "80px",
      }}
    >
      {/* Header with gradient or custom color */}
      <div
        style={{
          background: (() => {
            const branding = coachConfig?.branding;
            if (!branding) {
              return "linear-gradient(135deg, #ff6b9d 0%, #ffa057 50%, #ffd96a 100%)";
            }

            if (branding.background_type === "gradient") {
              const color1 = branding.gradient_color_1 || "#ff6b9d";
              const color2 = branding.gradient_color_2 || "#ffa057";
              const angle = branding.gradient_angle || 135;
              const spread = branding.gradient_spread || 50;
              return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} ${spread}%, ${color2} 100%)`;
            }

            return branding.background_color || "#f9fafb";
          })(),
          padding: "32px 24px 48px",
          textAlign: "center",
        }}
      >
        {coachConfig?.branding?.app_logo_url ? (
          <img
            src={coachConfig.branding.app_logo_url}
            alt="App Logo"
            style={{
              width: (() => {
                const size = coachConfig.branding.app_logo_size || "medium";
                switch (size) {
                  case "small":
                    return "80px";
                  case "large":
                    return "420px";
                  case "medium":
                  default:
                    return "200px";
                }
              })(),
              maxWidth: "90%",
              height: "auto",
              objectFit: "contain",
              margin: "0 auto 8px",
              display: "block",
            }}
          />
        ) : (
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: "8px",
              letterSpacing: "-0.02em",
            }}
          >
            {coachConfig?.header?.title || "BrainPeace"}
          </h1>
        )}
        <p
          style={{
            fontSize: "16px",
            color: "#1a1a1a",
            opacity: 0.8,
          }}
        >
          {coachConfig?.header?.subtitle || "Mental Fitness for Active Minds"}
        </p>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 24px" }}>
        {activeTab === "focus" && (
          <>
            {/* Today's Focus Section */}
            <div
              style={{
                backgroundColor: "#fffbf0",
                padding: "24px",
                borderRadius: "12px",
                marginTop: "-24px",
                marginBottom: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
                    {coachConfig?.focus_tab?.progress_bar?.title ||
                      "Today's Focus"}
                  </h2>
                  <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    {coachConfig?.focus_tab?.progress_bar?.subtitle ||
                      "Direct your energy intentionally"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "40px",
                      fontWeight: 700,
                      lineHeight: 1,
                      color: "#1a1a1a",
                    }}
                  >
                    {completedCount}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    of {totalTasks}
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    backgroundColor: "#f59e0b",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Morning Practice */}
            {coachConfig?.focus_tab?.task_1?.enabled !== false && (
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
                  style={{ display: "flex", gap: "16px", marginBottom: "16px" }}
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
                    {coachConfig?.focus_tab?.task_1?.icon_url ? (
                      <img
                        src={coachConfig.focus_tab.task_1.icon_url}
                        alt="Task Icon"
                        style={{
                          width: "36px",
                          height: "36px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <Sun size={28} color="#f59e0b" strokeWidth={2} />
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
                        {coachConfig?.focus_tab?.task_1?.title ||
                          "Morning Practice"}
                      </h3>
                      <Star
                        size={20}
                        fill="#f59e0b"
                        color="#f59e0b"
                        strokeWidth={2}
                      />
                    </div>
                    <p style={{ fontSize: "14px", color: "#6b7280" }}>
                      {coachConfig?.focus_tab?.task_1?.subtitle ||
                        "Follow Your Spark • 7:00"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleTask("morning")}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: completedTasks.morning ? "none" : "2px solid #d1d5db",
                      backgroundColor: completedTasks.morning
                        ? (coachConfig?.branding?.primary_color || "#ef4444")
                        : "#fff",
                      cursor: "pointer",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    {completedTasks.morning && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7L5.5 10.5L12 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                {getTodaysAudio() && (
                  <div
                    style={{
                      marginTop: "12px",
                    }}
                  >
                    <audio
                      ref={audioRef}
                      src={getTodaysAudio()}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={handleAudioEnded}
                      style={{ display: "none" }}
                    />

                    {/* Play/Pause Button */}
                    <button
                      onClick={togglePlayPause}
                      style={{
                        width: "100%",
                        padding: "16px",
                        backgroundColor:
                          coachConfig?.branding?.primary_color || "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "18px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        marginBottom: showAudioControls ? "12px" : "0",
                        transition: "background-color 0.2s",
                        outline: "none",
                      }}
                      onMouseEnter={(e) => {
                        const color =
                          coachConfig?.branding?.primary_color || "#ef4444";
                        e.target.style.backgroundColor = color;
                        e.target.style.filter = "brightness(0.9)";
                      }}
                      onMouseLeave={(e) => {
                        const color =
                          coachConfig?.branding?.primary_color || "#ef4444";
                        e.target.style.backgroundColor = color;
                        e.target.style.filter = "brightness(1)";
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>
                        {showAudioControls ? (isPlaying ? "⏸" : "▶") : "▶"}
                      </span>
                      {showAudioControls
                        ? isPlaying
                          ? "Pause"
                          : "Play"
                        : "Listen Now"}
                    </button>

                    {/* Progress Bar - Only show after first click */}
                    {showAudioControls && (
                      <>
                        <div style={{ marginBottom: "8px" }}>
                          <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            style={{
                              width: "100%",
                              height: "6px",
                              borderRadius: "3px",
                              outline: "none",
                              cursor: "pointer",
                              accentColor:
                                coachConfig?.branding?.primary_color ||
                                "#ef4444",
                            }}
                          />
                        </div>

                        {/* Time Display */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            color: "#6b7280",
                          }}
                        >
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Daily Intention */}
            {coachConfig?.focus_tab?.task_2?.enabled !== false && (
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowIntentionModal(true);
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
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
                    {coachConfig?.focus_tab?.task_2?.icon_url ? (
                      <img
                        src={coachConfig.focus_tab.task_2.icon_url}
                        alt="Task Icon"
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
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
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
                      {coachConfig?.focus_tab?.task_2?.title ||
                        "Daily Intention"}
                    </h3>
                    <p style={{ fontSize: "14px", color: "#6b7280" }}>
                      {completedTasks.intention && intentionFocusWord
                        ? intentionFocusWord
                        : coachConfig?.focus_tab?.task_2?.subtitle ||
                          "Set your focus for the day"}
                    </p>
                  </div>
                  {completedTasks.intention ? (
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor:
                          coachConfig?.branding?.primary_color || "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2 7L5.5 10.5L12 3.5"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "2px solid #d1d5db",
                        backgroundColor: "#fff",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Evening Review */}
            {coachConfig?.focus_tab?.task_3?.enabled !== false && (
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "24px",
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
                  {coachConfig?.focus_tab?.task_3?.icon_url ? (
                    <img
                      src={coachConfig.focus_tab.task_3.icon_url}
                      alt="Task Icon"
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
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
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
                    {coachConfig?.focus_tab?.task_3?.title || "Evening Review"}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    {coachConfig?.focus_tab?.task_3?.subtitle ||
                      "Journal offline tonight"}
                  </p>
                </div>
                <button
                  onClick={() => toggleTask("evening")}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: completedTasks.evening ? "none" : "2px solid #d1d5db",
                    backgroundColor: completedTasks.evening
                      ? (coachConfig?.branding?.primary_color || "#ef4444")
                      : "#fff",
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  {completedTasks.evening && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Day Notes */}
            <div
              style={{
                backgroundColor: "#fff",
                padding: "24px",
                borderRadius: "12px",
                marginBottom: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
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
                    overflow: "hidden",
                  }}
                >
                  {coachConfig?.focus_tab?.day_notes?.icon_url ? (
                    <img
                      src={coachConfig.focus_tab.day_notes.icon_url}
                      alt="Day Notes Icon"
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
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
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
                    {coachConfig?.focus_tab?.day_notes?.title || "Day Notes"}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    {coachConfig?.focus_tab?.day_notes?.subtitle ||
                      "Log observations to spot patterns"}
                  </p>
                </div>
              </div>
              <textarea
                value={dayNotes}
                onChange={(e) => {
                  setDayNotes(e.target.value);
                  setNotesModified(true);
                }}
                placeholder="What happened today? How did you feel? What did you notice about yourself?"
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px",
                  fontSize: "14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  marginBottom: "12px",
                }}
              />
              <button
                onClick={async () => {
                  if (!notesModified && !isSavingFocus) return;

                  setIsSavingFocus(true);
                  try {
                    const res = await fetch("/api/daily-entries/focus", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ focus_notes: dayNotes }),
                    });

                    if (res.ok) {
                      const data = await res.json();
                      setFocusEntry(data.entry);
                      setNotesModified(false);
                      setToastMessage("Notes saved successfully");
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }
                  } catch (error) {
                    console.error("Failed to save notes:", error);
                  } finally {
                    setIsSavingFocus(false);
                  }
                }}
                disabled={isSavingFocus || !notesModified}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: isSavingFocus
                    ? "#d1fae5"
                    : notesModified
                      ? "#10b981"
                      : "#f3f4f6",
                  color: notesModified || isSavingFocus ? "#fff" : "#9ca3af",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor:
                    isSavingFocus || !notesModified ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                <span>✓</span>
                {isSavingFocus ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </>
        )}

        {activeTab === "awareness" && (
          <div style={{ position: "relative", minHeight: "100vh" }}>
            {/* Locked Overlay */}
            {!subscriptionStatus?.isPremium && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(4px)",
                  zIndex: 10,
                  pointerEvents: "all",
                  cursor: "not-allowed",
                }}
              />
            )}

            {/* Date Header */}
            <div style={{ marginTop: "24px", marginBottom: "24px" }}>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: "24px",
                  color: "#1a1a1a",
                }}
              >
                {formatDate(selectedAwarenessDate)}
              </h2>

              {/* Week Calendar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "32px",
                }}
              >
                {weekDays.map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      !day.isFuture && !subscriptionStatus?.isPremium
                        ? null
                        : !day.isFuture &&
                          setSelectedAwarenessDate(day.fullDate)
                    }
                    disabled={day.isFuture || !subscriptionStatus?.isPremium}
                    style={{
                      textAlign: "center",
                      flex: 1,
                      background: "none",
                      border: "none",
                      cursor:
                        day.isFuture || !subscriptionStatus?.isPremium
                          ? "not-allowed"
                          : "pointer",
                      padding: "0",
                      opacity:
                        day.isFuture || !subscriptionStatus?.isPremium
                          ? 0.4
                          : 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        marginBottom: "8px",
                      }}
                    >
                      {day.dayName}
                    </div>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        margin: "0 auto",
                        borderRadius: "50%",
                        backgroundColor: day.isSelected
                          ? coachConfig?.branding?.primary_color || "#ef4444"
                          : "transparent",
                        color: day.isSelected ? "#fff" : "#1a1a1a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: day.isSelected ? 600 : 400,
                        position: "relative",
                        border:
                          day.isToday && !day.isSelected
                            ? `2px solid ${
                                coachConfig?.branding?.primary_color ||
                                "#ef4444"
                              }`
                            : "none",
                      }}
                    >
                      {day.date}
                      {day.isSelected && emotionalEntries.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "-8px",
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: primaryColor,
                          }}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Log Section */}
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h2
                  style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                  }}
                >
                  Log
                </h2>
                {!isLoadingAwareness && (
                  <span style={{ fontSize: "16px", color: "#9ca3af" }}>
                    {mindfulnessEntries.length + emotionalEntries.length}{" "}
                    entries
                  </span>
                )}
              </div>

              {isLoadingAwareness ? (
                // Skeleton Loader
                <>
                  {/* MINDFULNESS Section Skeleton */}
                  <div style={{ marginBottom: "32px" }}>
                    <div
                      style={{
                        width: "120px",
                        height: "14px",
                        backgroundColor: "#e5e7eb",
                        borderRadius: "4px",
                        marginBottom: "16px",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                    {[1, 2, 3].map((i) => (
                      <div
                        key={`mind-skeleton-${i}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px 0",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: "#e5e7eb",
                              animation: "pulse 1.5s ease-in-out infinite",
                            }}
                          />
                          <div
                            style={{
                              width: "140px",
                              height: "16px",
                              backgroundColor: "#e5e7eb",
                              borderRadius: "4px",
                              animation: "pulse 1.5s ease-in-out infinite",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "4px",
                            backgroundColor: "#e5e7eb",
                            animation: "pulse 1.5s ease-in-out infinite",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* EMOTIONAL STATE Section Skeleton */}
                  <div>
                    <div
                      style={{
                        width: "160px",
                        height: "14px",
                        backgroundColor: "#e5e7eb",
                        borderRadius: "4px",
                        marginBottom: "16px",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 0",
                      }}
                    >
                      <div
                        style={{
                          width: "180px",
                          height: "16px",
                          backgroundColor: "#e5e7eb",
                          borderRadius: "4px",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      />
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "4px",
                          backgroundColor: "#e5e7eb",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      />
                    </div>
                  </div>

                  {/* Entries Skeleton */}
                  <div style={{ marginTop: "24px" }}>
                    <div
                      style={{
                        width: "180px",
                        height: "14px",
                        backgroundColor: "#e5e7eb",
                        borderRadius: "4px",
                        marginBottom: "16px",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                    {[1, 2].map((i) => (
                      <div
                        key={`entry-skeleton-${i}`}
                        style={{
                          backgroundColor: "#fff",
                          padding: "16px",
                          borderRadius: "12px",
                          marginBottom: "12px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "100px",
                              height: "14px",
                              backgroundColor: "#e5e7eb",
                              borderRadius: "4px",
                              animation: "pulse 1.5s ease-in-out infinite",
                            }}
                          />
                          <div
                            style={{
                              width: "60px",
                              height: "14px",
                              backgroundColor: "#e5e7eb",
                              borderRadius: "4px",
                              animation: "pulse 1.5s ease-in-out infinite",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "40px",
                            backgroundColor: "#e5e7eb",
                            borderRadius: "4px",
                            animation: "pulse 1.5s ease-in-out infinite",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <style jsx>{`
                    @keyframes pulse {
                      0%,
                      100% {
                        opacity: 1;
                      }
                      50% {
                        opacity: 0.5;
                      }
                    }
                  `}</style>
                </>
              ) : (
                <>
                  {/* MINDFULNESS Section */}
                  <div style={{ marginBottom: "32px" }}>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#7c3aed",
                        letterSpacing: "0.05em",
                        marginBottom: "16px",
                      }}
                    >
                      MINDFULNESS
                    </h3>

                    {mindfulnessItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px 0",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: item.color,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "16px",
                              color: "#1a1a1a",
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            !subscriptionStatus?.isPremium
                              ? null
                              : handleMindfulnessClick(item)
                          }
                          disabled={!subscriptionStatus?.isPremium}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "4px",
                            border: "none",
                            backgroundColor: "transparent",
                            color: "#60a5fa",
                            fontSize: "24px",
                            cursor: !subscriptionStatus?.isPremium
                              ? "not-allowed"
                              : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: !subscriptionStatus?.isPremium ? 0.5 : 1,
                          }}
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* EMOTIONAL STATE Section */}
                  <div>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#7c3aed",
                        letterSpacing: "0.05em",
                        marginBottom: "16px",
                      }}
                    >
                      {(
                        coachConfig?.emotional_state_tab?.log_label ||
                        "EMOTIONAL STATE"
                      ).toUpperCase()}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 0",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "16px",
                          color: "#1a1a1a",
                        }}
                      >
                        Log{" "}
                        {coachConfig?.emotional_state_tab?.log_label?.toLowerCase() ||
                          "emotional state"}
                      </span>
                      <button
                        onClick={() =>
                          !subscriptionStatus?.isPremium
                            ? null
                            : setShowEmotionalModal(true)
                        }
                        disabled={!subscriptionStatus?.isPremium}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "4px",
                          border: "none",
                          backgroundColor: "transparent",
                          color: "#60a5fa",
                          fontSize: "24px",
                          cursor: !subscriptionStatus?.isPremium
                            ? "not-allowed"
                            : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: !subscriptionStatus?.isPremium ? 0.5 : 1,
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {(emotionalEntries.length > 0 ||
                    mindfulnessEntries.length > 0) && (
                    <div style={{ marginTop: "24px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#6b7280",
                            letterSpacing: "0.05em",
                          }}
                        >
                          ENTRIES FOR THIS DAY
                        </h3>
                      </div>

                      {/* Mindfulness Entries */}
                      {mindfulnessEntries.map((entry) => (
                        <div
                          key={entry.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 0",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#60a5fa",
                              }}
                            />
                            <span
                              style={{ fontSize: "16px", color: "#1a1a1a" }}
                            >
                              {entry.label}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "14px",
                              color: "#9ca3af",
                              marginRight: "12px",
                            }}
                          >
                            {entry.time}
                          </span>
                          <button
                            onClick={() =>
                              !subscriptionStatus?.isPremium
                                ? null
                                : handleDeleteEntry(entry.id, "mindfulness")
                            }
                            disabled={!subscriptionStatus?.isPremium}
                            style={{
                              background: "none",
                              border: "none",
                              color:
                                coachConfig?.branding?.primary_color ||
                                "#ef4444",
                              fontSize: "18px",
                              cursor: !subscriptionStatus?.isPremium
                                ? "not-allowed"
                                : "pointer",
                              padding: "0 4px",
                              opacity: !subscriptionStatus?.isPremium ? 0.5 : 1,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {/* Emotional Entries */}
                      {emotionalEntries.map((entry) => (
                        <div
                          key={entry.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 0",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: primaryColor,
                              }}
                            />
                            <span
                              style={{ fontSize: "16px", color: "#1a1a1a" }}
                            >
                              Feeling{" "}
                              {Array.isArray(entry.emotions)
                                ? entry.emotions
                                    .map((e) => {
                                      // Handle both string format and object format
                                      if (typeof e === "string") {
                                        return e.split("-")[1] || e;
                                      } else if (
                                        typeof e === "object" &&
                                        e !== null
                                      ) {
                                        // If it's an object, try to extract the label
                                        return e.label || e.emotion || "";
                                      }
                                      return "";
                                    })
                                    .filter((e) => e !== "")
                                    .join(", ")
                                    .toLowerCase()
                                : ""}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "14px",
                              color: "#9ca3af",
                              marginRight: "12px",
                            }}
                          >
                            {entry.time}
                          </span>
                          <button
                            onClick={() =>
                              !subscriptionStatus?.isPremium
                                ? null
                                : handleDeleteEntry(entry.id, "emotional")
                            }
                            disabled={!subscriptionStatus?.isPremium}
                            style={{
                              background: "none",
                              border: "none",
                              color:
                                coachConfig?.branding?.primary_color ||
                                "#ef4444",
                              fontSize: "18px",
                              cursor: !subscriptionStatus?.isPremium
                                ? "not-allowed"
                                : "pointer",
                              padding: "0 4px",
                              opacity: !subscriptionStatus?.isPremium ? 0.5 : 1,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Practice */}
                  {showSuggestedPractice && selectedPractice && (
                    <div
                      ref={suggestedPracticeRef}
                      style={{
                        backgroundColor: "#eff6ff",
                        padding: "20px",
                        borderRadius: "12px",
                        marginTop: "24px",
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={() => {
                          setShowSuggestedPractice(false);
                          setSelectedPractice(null);
                          setShowPracticeControls(false);
                          setIsPracticePlaying(false);
                          if (practiceAudioRef.current) {
                            practiceAudioRef.current.pause();
                            practiceAudioRef.current.currentTime = 0;
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          background: "none",
                          border: "none",
                          fontSize: "20px",
                          color: "#6b7280",
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#1a1a1a",
                          marginBottom: "4px",
                        }}
                      >
                        Suggested Practice
                      </h3>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          marginBottom: "16px",
                        }}
                      >
                        For when feeling {selectedPractice.name?.toLowerCase()}
                      </p>
                      <div
                        style={{
                          backgroundColor: "#fff",
                          padding: "16px",
                          borderRadius: "8px",
                          marginBottom: "12px",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#1a1a1a",
                            marginBottom: "4px",
                          }}
                        >
                          {selectedPractice.practice_name ||
                            "Mindfulness Practice"}
                        </h4>
                        <p style={{ fontSize: "14px", color: "#3b82f6" }}>
                          {selectedPractice.duration || ""}
                        </p>
                      </div>

                      {selectedPractice.audio_url && (
                        <div>
                          <audio
                            ref={practiceAudioRef}
                            src={selectedPractice.audio_url}
                            onTimeUpdate={handlePracticeTimeUpdate}
                            onLoadedMetadata={handlePracticeLoadedMetadata}
                            onEnded={handlePracticeAudioEnded}
                            style={{ display: "none" }}
                          />

                          {/* Play/Pause Button */}
                          <button
                            onClick={togglePracticePlayPause}
                            style={{
                              width: "100%",
                              padding: "16px",
                              backgroundColor: primaryColor,
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "18px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "10px",
                              marginBottom: showPracticeControls ? "12px" : "0",
                              transition: "background-color 0.2s",
                              outline: "none",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.opacity = "0.9")
                            }
                            onMouseLeave={(e) => (e.target.style.opacity = "1")}
                          >
                            <span style={{ fontSize: "20px" }}>
                              {showPracticeControls
                                ? isPracticePlaying
                                  ? "⏸"
                                  : "▶"
                                : "▶"}
                            </span>
                            {showPracticeControls
                              ? isPracticePlaying
                                ? "Pause"
                                : "Play"
                              : "Start Practice"}
                          </button>

                          {/* Progress Bar - Only show after first click */}
                          {showPracticeControls && (
                            <>
                              <div style={{ marginBottom: "8px" }}>
                                <input
                                  type="range"
                                  min="0"
                                  max={practiceDuration || 0}
                                  value={practiceCurrentTime}
                                  onChange={handlePracticeSeek}
                                  style={{
                                    width: "100%",
                                    height: "6px",
                                    borderRadius: "3px",
                                    outline: "none",
                                    cursor: "pointer",
                                    accentColor: "#3b82f6",
                                  }}
                                />
                              </div>

                              {/* Time Display */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "12px",
                                  color: "#6b7280",
                                }}
                              >
                                <span>{formatTime(practiceCurrentTime)}</span>
                                <span>{formatTime(practiceDuration)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Entries for this day */}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "coach" && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#f9fafb",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Locked Overlay */}
            {!subscriptionStatus?.isPremium && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(4px)",
                  zIndex: 100,
                  pointerEvents: "all",
                  cursor: "not-allowed",
                }}
              />
            )}

            {/* Header */}
            <div>
              {/* Gradient Section */}
              <div
                style={{
                  background: (() => {
                    const branding = coachConfig?.branding;
                    if (!branding) {
                      return "linear-gradient(135deg, #ff6b9d 0%, #ffa057 50%, #ffd96a 100%)";
                    }

                    if (branding.background_type === "gradient") {
                      const color1 = branding.gradient_color_1 || "#ff6b9d";
                      const color2 = branding.gradient_color_2 || "#ffa057";
                      const angle = branding.gradient_angle || 135;
                      const spread = branding.gradient_spread || 50;
                      return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} ${spread}%, ${color2} 100%)`;
                    }

                    return branding.background_color || "#f9fafb";
                  })(),
                  padding: "32px 24px 48px",
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div style={{ width: "100%", maxWidth: "600px" }}>
                  {coachConfig?.branding?.app_logo_url ? (
                    <img
                      src={coachConfig.branding.app_logo_url}
                      alt="App Logo"
                      style={{
                        width: (() => {
                          const size =
                            coachConfig.branding.app_logo_size || "medium";
                          switch (size) {
                            case "small":
                              return "80px";
                            case "large":
                              return "320px";
                            case "medium":
                            default:
                              return "200px";
                          }
                        })(),
                        maxWidth: "90%",
                        height: "auto",
                        objectFit: "contain",
                        margin: "0 auto 8px",
                        display: "block",
                      }}
                    />
                  ) : (
                    <h1
                      style={{
                        fontSize: "36px",
                        fontWeight: 700,
                        color: "#1a1a1a",
                        marginBottom: "8px",
                        letterSpacing: "-0.02em",
                        textAlign: "center",
                      }}
                    >
                      {coachConfig?.header?.title || "BrainPeace"}
                    </h1>
                  )}
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#1a1a1a",
                      opacity: 0.8,
                      textAlign: "center",
                      margin: 0,
                    }}
                  >
                    {coachConfig?.header?.subtitle ||
                      "Mental Fitness for Active Minds"}
                  </p>
                </div>
              </div>

              {/* Control Bar - White Background */}
              <div
                style={{
                  backgroundColor: "#fff",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "600px",
                    padding: "12px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <button
                    onClick={() =>
                      !subscriptionStatus?.isPremium
                        ? null
                        : setShowCoachProfile(!showCoachProfile)
                    }
                    disabled={!subscriptionStatus?.isPremium}
                    style={{
                      background: "none",
                      border: "none",
                      color: coachConfig?.branding?.primary_color || "#ef4444",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: !subscriptionStatus?.isPremium
                        ? "not-allowed"
                        : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: 0,
                      opacity: !subscriptionStatus?.isPremium ? 0.5 : 1,
                    }}
                  >
                    Coach Profile
                    <span
                      style={{
                        fontSize: "12px",
                        display: "inline-block",
                        transform: showCoachProfile
                          ? "rotate(180deg)"
                          : "rotate(0)",
                        transition: "transform 0.2s",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "#10b981",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#10b981",
                        fontWeight: 500,
                      }}
                    >
                      Fresh Session
                    </span>
                  </div>

                  <button
                    onClick={
                      !subscriptionStatus?.isPremium
                        ? () => {}
                        : handleNewSession
                    }
                    disabled={!subscriptionStatus?.isPremium}
                    style={{
                      backgroundColor:
                        coachConfig?.branding?.primary_color || "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "20px",
                      padding: "8px 20px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: !subscriptionStatus?.isPremium
                        ? "not-allowed"
                        : "pointer",
                      opacity: !subscriptionStatus?.isPremium ? 0.5 : 1,
                    }}
                  >
                    New Session
                  </button>
                </div>
              </div>
            </div>

            {/* Token Usage Warning */}
            {tokenWarning && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  backgroundColor:
                    tokenWarning.level === "high" ? "#fee2e2" : "#fef3c7",
                  border:
                    tokenWarning.level === "high"
                      ? "1px solid #fca5a5"
                      : "1px solid #fcd34d",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "600px",
                    color:
                      tokenWarning.level === "high" ? "#991b1b" : "#92400e",
                    padding: "12px 24px",
                    fontSize: "14px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <span>{tokenWarning.message}</span>
                  <button
                    onClick={() => setTokenWarning(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      fontSize: "18px",
                      cursor: "pointer",
                      padding: "0 4px",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Chat Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                background: "linear-gradient(180deg, #fce7f3 0%, #e0e7ff 100%)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "600px",
                }}
              >
                {/* Coach Profile Dropdown */}
                {showCoachProfile && user?.coach && (
                  <div
                    style={{
                      backgroundColor: "#fff",
                      padding: "24px",
                      borderRadius: "16px",
                      marginBottom: "24px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        marginBottom: "16px",
                      }}
                    >
                      {coachConfig?.coach_tab?.bot_profile_picture_url ||
                      user.coach.logo_url ? (
                        <img
                          src={
                            coachConfig?.coach_tab?.bot_profile_picture_url ||
                            user.coach.logo_url
                          }
                          alt={user.coach.business_name}
                          style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "16px",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "16px",
                            background:
                              "linear-gradient(135deg, #ff6b9d 0%, #ffa057 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "36px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {user.coach.business_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: "28px",
                            fontWeight: 700,
                            color: "#1a1a1a",
                            marginBottom: "12px",
                            marginTop: "0",
                          }}
                        >
                          {user.coach.business_name}
                        </h3>
                        <p
                          style={{
                            fontSize: "16px",
                            lineHeight: "1.5",
                            color: "#4b5563",
                            margin: 0,
                          }}
                        >
                          {user.coach.bio ||
                            coachConfig?.bio ||
                            "Your dedicated AI coach here to support your journey."}
                        </p>
                      </div>
                    </div>

                    {/* Book a Call Button */}
                    {coachConfig?.coach_tab?.booking?.enabled && (
                      <button
                        onClick={() => setShowBookingModal(true)}
                        style={{
                          width: "100%",
                          padding: "16px",
                          backgroundColor:
                            coachConfig?.branding?.primary_color || "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "12px",
                          fontSize: "18px",
                          fontWeight: 700,
                          cursor: "pointer",
                          marginBottom: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
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
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          ></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {coachConfig?.coach_tab?.booking?.button_text ||
                          "Book a Call"}
                      </button>
                    )}

                    <div
                      style={{
                        backgroundColor: "#fefce8",
                        border: "2px solid #fbbf24",
                        borderRadius: "12px",
                        padding: "16px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "1.5",
                          color: "#713f12",
                          margin: 0,
                        }}
                      >
                        <strong>Note:</strong>{" "}
                        {coachConfig?.coach_tab?.booking?.ai_disclaimer
                          ? coachConfig.coach_tab.booking.ai_disclaimer.replace(
                              "{coach_name}",
                              user.coach.business_name,
                            )
                          : `Responses are AI-generated and not directly from ${user.coach.business_name}.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Booking Modal */}
                {showBookingModal &&
                  coachConfig?.coach_tab?.booking?.enabled && (
                    <div
                      onClick={() => setShowBookingModal(false)}
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: "24px",
                      }}
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          backgroundColor: "#fff",
                          borderRadius: "20px",
                          padding: "32px 24px",
                          maxWidth: "500px",
                          width: "100%",
                          maxHeight: "80vh",
                          overflow: "auto",
                        }}
                      >
                        {/* Modal Header */}
                        <div
                          style={{ marginBottom: "24px", textAlign: "center" }}
                        >
                          <h2
                            style={{
                              fontSize: "24px",
                              fontWeight: 700,
                              color: "#1a1a1a",
                              marginBottom: "8px",
                            }}
                          >
                            {coachConfig?.coach_tab?.booking?.button_text ||
                              "Book a Call"}
                          </h2>
                          <p
                            style={{
                              fontSize: "16px",
                              color: "#6b7280",
                              margin: 0,
                            }}
                          >
                            Choose a session type below
                          </p>
                        </div>

                        {/* Booking Options */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          {(coachConfig?.coach_tab?.booking?.options || [])
                            .filter((option) => option.url)
                            .map((option) => (
                              <a
                                key={option.id}
                                href={option.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "block",
                                  padding: "20px",
                                  backgroundColor: "#f9fafb",
                                  border: "2px solid #e5e7eb",
                                  borderRadius: "12px",
                                  textDecoration: "none",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor =
                                    coachConfig?.branding?.primary_color ||
                                    "#ef4444";
                                  e.currentTarget.style.backgroundColor =
                                    "#fef2f2";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = "#e5e7eb";
                                  e.currentTarget.style.backgroundColor =
                                    "#f9fafb";
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "start",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <h3
                                    style={{
                                      fontSize: "18px",
                                      fontWeight: 600,
                                      color: "#1a1a1a",
                                      margin: 0,
                                    }}
                                  >
                                    {option.title}
                                  </h3>
                                  {option.duration && (
                                    <span
                                      style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color:
                                          coachConfig?.branding
                                            ?.primary_color || "#ef4444",
                                        backgroundColor: "#fef2f2",
                                        padding: "4px 12px",
                                        borderRadius: "12px",
                                      }}
                                    >
                                      {option.duration}
                                    </span>
                                  )}
                                </div>
                                <p
                                  style={{
                                    fontSize: "14px",
                                    color: "#6b7280",
                                    margin: 0,
                                  }}
                                >
                                  {option.description}
                                </p>
                              </a>
                            ))}
                        </div>

                        {/* Cancel Button */}
                        <button
                          onClick={() => setShowBookingModal(false)}
                          style={{
                            width: "100%",
                            padding: "14px",
                            marginTop: "20px",
                            backgroundColor: "transparent",
                            border: "2px solid #e5e7eb",
                            borderRadius: "12px",
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#6b7280",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                {/* Chat Messages */}
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    ref={
                      idx === chatMessages.length - 1 ? lastMessageRef : null
                    }
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginBottom: "16px",
                      justifyContent:
                        msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    {msg.role === "assistant" && (
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background:
                            coachConfig?.coach_tab?.bot_profile_picture_url ||
                            user?.coach?.logo_url
                              ? "transparent"
                              : "linear-gradient(135deg, #ff6b9d 0%, #ffa057 100%)",
                          border:
                            coachConfig?.coach_tab?.bot_profile_picture_url ||
                            user?.coach?.logo_url
                              ? `2px solid ${
                                  coachConfig?.branding?.primary_color ||
                                  "#ef4444"
                                }`
                              : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "20px",
                          fontWeight: 700,
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        {coachConfig?.coach_tab?.bot_profile_picture_url ? (
                          <img
                            src={coachConfig.coach_tab.bot_profile_picture_url}
                            alt="AI Coach"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : user?.coach?.logo_url ? (
                          <img
                            src={user.coach.logo_url}
                            alt={user.coach.business_name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : user?.coach?.business_name ? (
                          user.coach.business_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        ) : (
                          "AI"
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        backgroundColor:
                          msg.role === "user"
                            ? coachConfig?.branding?.primary_color || "#ef4444"
                            : "#fff",
                        color: msg.role === "user" ? "#fff" : "#1a1a1a",
                        padding: "16px 20px",
                        borderRadius: "20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        maxWidth: "80%",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "1.5",
                          margin: 0,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {renderMessageContent(msg.content)}
                      </p>
                    </div>
                  </div>
                ))}
                {isSendingChat && (
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #ff6b9d 0%, #ffa057 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "20px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      IJ
                    </div>
                    <div
                      style={{
                        backgroundColor: "#fff",
                        padding: "16px 20px",
                        borderRadius: "20px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "1.5",
                          color: "#1a1a1a",
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "16px",
                            height: "16px",
                            border: "2px solid #e5e7eb",
                            borderTop: `2px solid ${
                              coachConfig?.branding?.primary_color || "#ef4444"
                            }`,
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        Thinking...
                      </p>
                    </div>
                  </div>
                )}

                {/* Spacer to allow scrolling past the input pill */}
                <div style={{ height: "220px", width: "100%" }} />

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div
              style={{
                position: "fixed",
                bottom: "90px",
                left: 0,
                right: 0,
                zIndex: 40,
                display: "flex",
                justifyContent: "center",
                padding: "0 24px 16px 24px",
              }}
            >
              <form
                onSubmit={handleSendChatMessage}
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  backgroundColor: "#fff",
                  borderRadius: "32px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: "8px 8px 8px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={
                    isPreviewMode
                      ? "Chat disabled in preview"
                      : "Type your response here..."
                  }
                  disabled={
                    isPreviewMode ||
                    isSendingChat ||
                    !subscriptionStatus?.isPremium
                  }
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    fontSize: "16px",
                    border: "none",
                    outline: "none",
                    color: "#1a1a1a",
                    backgroundColor: "transparent",
                    opacity:
                      isPreviewMode || !subscriptionStatus?.isPremium ? 0.5 : 1,
                  }}
                />
                <button
                  type="submit"
                  disabled={
                    isPreviewMode ||
                    isSendingChat ||
                    !chatMessage.trim() ||
                    !subscriptionStatus?.isPremium
                  }
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: primaryColor,
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor:
                      isSendingChat ||
                      !chatMessage.trim() ||
                      !subscriptionStatus?.isPremium
                        ? "not-allowed"
                        : "pointer",
                    flexShrink: 0,
                    opacity:
                      isSendingChat ||
                      !chatMessage.trim() ||
                      !subscriptionStatus?.isPremium
                        ? 0.5
                        : 1,
                  }}
                >
                  <svg
                    style={{ width: "24px", height: "24px", color: "#fff" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "more" && !moreSubpage && (
          <div style={{ marginTop: "24px" }}>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: 700,
                marginBottom: "24px",
                color: "#1a1a1a",
              }}
            >
              More
            </h2>

            {/* Menu Items */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[
                {
                  icon: (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3b82f6"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      ></path>
                    </svg>
                  ),
                  bgColor: "#dbeafe",
                  title: "Announcements",
                  subtitle: "Community updates and news",
                  id: "announcements",
                  isPremium: true,
                },
                {
                  icon: (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a855f7"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      ></path>
                    </svg>
                  ),
                  bgColor: "#e9d5ff",
                  title: "Resource Hub",
                  subtitle: "Community calls, programs & resources",
                  id: "resources",
                  isPremium: true,
                  requiresTier3: true, // Only tier 3 users can access
                },
                {
                  icon: <Calendar size={24} color="#3b82f6" strokeWidth={2} />,
                  bgColor: "#dbeafe",
                  title: "Insights",
                  subtitle: "Your patterns over time",
                  id: "insights",
                  isPremium: true,
                },
                {
                  icon: <Star size={24} color="#eab308" strokeWidth={2} />,
                  bgColor: "#fef3c7",
                  title: "Library",
                  subtitle: "All practices and favorites",
                  id: "library",
                  isPremium: true,
                },
                {
                  icon: (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6b7280"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ),
                  bgColor: "#f3f4f6",
                  title: "Settings",
                  subtitle: "Preferences and account details",
                  id: "settings",
                  isPremium: false,
                },
              ].filter((item) => {
                if (item.requiresTier3 && user?.coach?.tier3_enabled === false && subscriptionStatus?.tier !== 3) {
                  return false;
                }
                return true;
              }).map((item, idx) => {
                const isLocked = item.requiresTier3
                  ? subscriptionStatus?.tier !== 3
                  : item.isPremium && !subscriptionStatus?.isPremium;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setMoreSubpage(item.id);
                      if (isLocked) {
                        setUpgradeModalContext(item.title);
                        setShowUpgradeModal(true);
                      }
                    }}
                    style={{
                      backgroundColor: "#fff",
                      padding: "16px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        backgroundColor: item.bgColor,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
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
                        {item.title}
                      </h3>
                      <p style={{ fontSize: "14px", color: "#6b7280" }}>
                        {item.subtitle}
                      </p>
                    </div>
                    {isLocked ? (
                      <svg
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "#fbbf24",
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    ) : (
                      <svg
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "#9ca3af",
                        }}
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
                    )}
                  </div>
                );
              })}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "32px",
                marginBottom: "32px",
                backgroundColor: "#fff",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Announcements Page */}
        {activeTab === "more" && moreSubpage === "announcements" && (
          <div style={{ marginTop: "24px", position: "relative" }}>
            {/* Locked Overlay */}
            {!subscriptionStatus?.isPremium && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(4px)",
                  zIndex: 10,
                  pointerEvents: "all",
                  cursor: "not-allowed",
                }}
              />
            )}
            {/* Back Button & Title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
                position: "relative",
                zIndex: 20,
              }}
            >
              <button
                onClick={() => setMoreSubpage(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0",
                  color: "#1a1a1a",
                }}
              >
                ←
              </button>
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  margin: 0,
                }}
              >
                Announcements
              </h2>
            </div>

            {/* Announcements List */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Highlighted Announcement */}
              <div
                style={{
                  backgroundColor: "#dbeafe",
                  padding: "20px",
                  borderRadius: "12px",
                  borderLeft: "4px solid #3b82f6",
                }}
              >
                <div style={{ display: "flex", gap: "16px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#3b82f6",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      flexShrink: 0,
                    }}
                  >
                    🔔
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#1e40af",
                          margin: 0,
                        }}
                      >
                        New Community Call Tomorrow
                      </h3>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>
                        2 hours ago
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "15px",
                        color: "#374151",
                        lineHeight: "1.5",
                        margin: 0,
                      }}
                    >
                      Join us tomorrow at 12pm ET for our monthly community
                      call. Topic: Shifting Patterns in Real-Time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Regular Announcements */}
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ display: "flex", gap: "16px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#e9d5ff",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      flexShrink: 0,
                    }}
                  >
                    📹
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 600,
                          color: "#1a1a1a",
                          margin: 0,
                        }}
                      >
                        New Program Released
                      </h3>
                      <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                        Yesterday
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "15px",
                        color: "#6b7280",
                        lineHeight: "1.5",
                        margin: 0,
                      }}
                    >
                      "Working With Your Inner Critic" is now available in the
                      Learning Hub. 4 modules, actionable practices.
                    </p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ display: "flex", gap: "16px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      flexShrink: 0,
                    }}
                  >
                    ℹ️
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 600,
                          color: "#1a1a1a",
                          margin: 0,
                        }}
                      >
                        App Update
                      </h3>
                      <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                        3 days ago
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "15px",
                        color: "#6b7280",
                        lineHeight: "1.5",
                        margin: 0,
                      }}
                    >
                      We've improved the Awareness Log with better filtering and
                      time-based insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resource Hub Page */}
        {activeTab === "more" && moreSubpage === "resources" && (
          <div style={{ marginTop: "24px", position: "relative" }}>
            {/* Locked Overlay - Only Tier 3 users can access */}
            {subscriptionStatus?.tier !== 3 && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(4px)", zIndex: 10, pointerEvents: "all", cursor: "not-allowed" }} />
            )}

            {rhActiveCollection && typeof rhActiveCollection === "object" ? (
              /* ── Collection Detail View ── */
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                  <button onClick={() => { setRhActiveCollection(null); setRhCollectionItems([]); setRhAudioPlayer(null); setRhVideoPlayer(null); fetchRhCollections(); }} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", padding: "0", color: "#1a1a1a" }}>←</button>
                  <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{rhActiveCollection.title}</h2>
                </div>
                {rhActiveCollection.description && <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>{rhActiveCollection.description}</p>}
                {rhActiveCollection.delivery_mode === "drip" && <div style={{ fontSize: "13px", color: primaryColor, backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30`, borderRadius: "8px", padding: "8px 12px", marginBottom: "20px" }}>This is a drip collection — content unlocks progressively as you complete items.</div>}

                {rhLoadingItems ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}><div style={{ width: "32px", height: "32px", border: `2px solid ${primaryColor}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} /></div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "100px" }}>
                    {rhCollectionItems.map((item, idx) => {
                      if (item.item_type === "pause") {
                        return (
                          <div key={item.id || idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: item.locked ? "#fef3c7" : "#f0fdf4", borderRadius: "10px", border: `1px dashed ${item.locked ? "#fbbf24" : "#86efac"}` }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={item.locked ? "#d97706" : "#16a34a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M12 6v6l4 2" /></svg>
                            <span style={{ fontSize: "14px", fontWeight: 600, color: item.locked ? "#92400e" : "#166534" }}>
                              {item.locked ? `Wait ${item.days_remaining || item.pause_days || 1} more day${(item.days_remaining || item.pause_days || 1) !== 1 ? "s" : ""}` : `${item.pause_days || 1} day pause — complete!`}
                            </span>
                          </div>
                        );
                      }

                      const content = item.content_item;
                      if (!content) return null;
                      const isLocked = item.locked;
                      const isViewed = item.viewed;
                      const actionLabel = content.link_url ? "Open" : content.type === "video" ? "Watch" : content.type === "audio" ? "Listen" : "View";

                      return (
                        <div key={item.id || idx} style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", opacity: isLocked ? 0.5 : 1, pointerEvents: isLocked ? "none" : "auto", border: isViewed ? `1px solid ${primaryColor}40` : "1px solid #e5e7eb" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: content.type === "video" ? "#dbeafe" : content.type === "audio" ? "#fce7f3" : "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {content.type === "video" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><path d="M1 5a2 2 0 012-2h11a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5z" /></svg>}
                              {content.type === "audio" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" /><path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></svg>}
                              {content.type === "pdf" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{content.title}</h4>
                                {isViewed && <span style={{ fontSize: "11px", fontWeight: 700, color: primaryColor, backgroundColor: `${primaryColor}15`, padding: "2px 8px", borderRadius: "8px" }}>Viewed</span>}
                                {!isViewed && !isLocked && <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", backgroundColor: "#f0fdf4", padding: "2px 8px", borderRadius: "8px" }}>New</span>}
                              </div>
                              {content.description && <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 8px 0" }}>{content.description}</p>}
                              {content.duration && <span style={{ fontSize: "12px", color: "#9ca3af" }}>{content.duration}</span>}
                            </div>
                            {isLocked && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>}
                          </div>
                          {!isLocked && (
                            <button
                              onClick={() => handleContentAction(item, rhActiveCollection)}
                              style={{ marginTop: "12px", width: "100%", padding: "10px", backgroundColor: primaryColor, color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                              {actionLabel}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Audio Player Bar */}
                {rhAudioPlayer && (
                  <div style={{ position: "fixed", bottom: "80px", left: "16px", right: "16px", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", padding: "12px 16px", zIndex: 30, border: `1px solid ${primaryColor}30` }}>
                    <audio
                      ref={rhAudioRef}
                      src={rhAudioPlayer.url}
                      onTimeUpdate={() => { if (rhAudioRef.current) setRhAudioTime(rhAudioRef.current.currentTime); }}
                      onLoadedMetadata={() => { if (rhAudioRef.current) setRhAudioDuration(rhAudioRef.current.duration); }}
                      onEnded={() => { setRhAudioPlaying(false); setRhAudioTime(0); }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        onClick={() => {
                          if (rhAudioRef.current) {
                            if (rhAudioPlaying) { rhAudioRef.current.pause(); } else { rhAudioRef.current.play(); }
                            setRhAudioPlaying(!rhAudioPlaying);
                          }
                        }}
                        style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: primaryColor, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        {rhAudioPlaying ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        )}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rhAudioPlayer.title}</p>
                        <input
                          type="range"
                          min="0"
                          max={rhAudioDuration || 0}
                          value={rhAudioTime}
                          onChange={(e) => { if (rhAudioRef.current) { rhAudioRef.current.currentTime = Number(e.target.value); setRhAudioTime(Number(e.target.value)); } }}
                          style={{ width: "100%", height: "4px", marginTop: "4px", accentColor: primaryColor }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af" }}>
                          <span>{formatRhTime(rhAudioTime)}</span>
                          <span>{formatRhTime(rhAudioDuration)}</span>
                        </div>
                      </div>
                      <button onClick={() => { if (rhAudioRef.current) { rhAudioRef.current.pause(); } setRhAudioPlayer(null); setRhAudioPlaying(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#9ca3af" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Video Player Modal */}
                {rhVideoPlayer && (
                  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "100%", maxWidth: "640px", padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h3 style={{ color: "#fff", fontSize: "16px", fontWeight: 600, margin: 0 }}>{rhVideoPlayer.title}</h3>
                        <button onClick={() => setRhVideoPlayer(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", padding: "4px" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                      <video src={rhVideoPlayer.url} controls autoPlay style={{ width: "100%", borderRadius: "12px", backgroundColor: "#000" }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Collections List View ── */
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                  <button onClick={() => setMoreSubpage(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", padding: "0", color: "#1a1a1a" }}>←</button>
                  <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Resource Hub</h2>
                </div>
                <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "24px" }}>Your curated collection of tools & wisdom</p>

                {rhLoadingCollections ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}><div style={{ width: "32px", height: "32px", border: `2px solid ${primaryColor}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} /></div>
                ) : rhCollections.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
                    <p style={{ fontSize: "16px", fontWeight: 500 }}>No collections available yet</p>
                    <p style={{ fontSize: "14px", marginTop: "4px" }}>Your coach hasn&apos;t published any resource collections.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "100px" }}>
                    {rhCollections.map((col) => (
                      <div key={col.id} onClick={() => openRhCollection(col.id)} style={{ backgroundColor: "#fff", padding: "16px 20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "48px", height: "48px", backgroundColor: "#f3f4f6", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{col.title}</h3>
                            {col.viewed_count < col.item_count && col.item_count > 0 && (
                              <span style={{ backgroundColor: primaryColor, color: "#fff", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", flexShrink: 0 }}>
                                {col.item_count - col.viewed_count}
                              </span>
                            )}
                          </div>
                          {col.description && <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.description}</p>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <span style={{ fontSize: "15px", color: "#9ca3af", fontWeight: 600 }}>{col.item_count}</span>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Insights Page */}
        {activeTab === "more" && moreSubpage === "insights" && (
          <div style={{ marginTop: "24px", position: "relative" }}>
            {/* Locked Overlay */}
            {!subscriptionStatus?.isPremium && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(4px)",
                  zIndex: 10,
                  pointerEvents: "all",
                  cursor: "not-allowed",
                }}
              />
            )}
            {/* Back Button & Title */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <button
                  onClick={() => setMoreSubpage(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    padding: "0",
                    color: "#1a1a1a",
                  }}
                >
                  ←
                </button>
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    margin: 0,
                  }}
                >
                  Insights
                </h2>
              </div>
              {insightsTab === "focus" && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <button
                    onClick={() => {
                      const newMonth = new Date(insightsMonth);
                      newMonth.setMonth(newMonth.getMonth() - 1);
                      setInsightsMonth(newMonth);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "20px",
                      cursor: "pointer",
                      color: "#6b7280",
                    }}
                  >
                    ‹
                  </button>
                  <span style={{ fontSize: "16px", fontWeight: 600 }}>
                    {insightsMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => {
                      const newMonth = new Date(insightsMonth);
                      newMonth.setMonth(newMonth.getMonth() + 1);
                      setInsightsMonth(newMonth);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "20px",
                      cursor: "pointer",
                      color: "#6b7280",
                    }}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <button
                onClick={() => setInsightsTab("focus")}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  backgroundColor:
                    insightsTab === "focus" ? "#3b82f6" : "#f3f4f6",
                  color: insightsTab === "focus" ? "#fff" : "#6b7280",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Daily Focus
              </button>
              <button
                onClick={() => setInsightsTab("awareness")}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  backgroundColor:
                    insightsTab === "awareness" ? "#3b82f6" : "#f3f4f6",
                  color: insightsTab === "awareness" ? "#fff" : "#6b7280",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Daily Awareness
              </button>
            </div>

            {/* Daily Focus View */}
            {insightsTab === "focus" && (
              <>
                {/* Your Journey Section */}
                <div
                  style={{
                    backgroundColor: "#fff",
                    padding: "24px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    marginBottom: selectedInsightsDate ? "16px" : "80px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#1a1a1a",
                        margin: 0,
                      }}
                    >
                      Your Journey
                    </h3>
                    <span style={{ fontSize: "14px", color: "#9ca3af" }}>
                      Tap a day to add notes
                    </span>
                  </div>

                  {/* Calendar Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {(() => {
                      const year = insightsMonth.getFullYear();
                      const month = insightsMonth.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const startDay = firstDay.getDay();
                      const daysInMonth = lastDay.getDate();

                      const calendarDays = [];

                      // Previous month days
                      const prevMonthDays = new Date(year, month, 0).getDate();
                      for (let i = startDay - 1; i >= 0; i--) {
                        const day = prevMonthDays - i;
                        calendarDays.push({
                          day,
                          dateStr: new Date(year, month - 1, day)
                            .toISOString()
                            .split("T")[0],
                          isCurrentMonth: false,
                        });
                      }

                      // Current month days
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = new Date(year, month, day)
                          .toISOString()
                          .split("T")[0];
                        calendarDays.push({
                          day,
                          dateStr,
                          isCurrentMonth: true,
                        });
                      }

                      // Next month days to fill grid
                      const remaining = 42 - calendarDays.length;
                      for (let day = 1; day <= remaining; day++) {
                        calendarDays.push({
                          day,
                          dateStr: new Date(year, month + 1, day)
                            .toISOString()
                            .split("T")[0],
                          isCurrentMonth: false,
                        });
                      }

                      return calendarDays.map((dayInfo, i) => {
                        const entry = insightsData[dayInfo.dateStr];
                        const completedCount = entry
                          ? [
                              entry.task_1_completed,
                              entry.task_2_completed,
                              entry.task_3_completed,
                            ].filter(Boolean).length
                          : 0;
                        const progressPercent = (completedCount / 3) * 100;
                        const isSelected =
                          selectedInsightsDate === dayInfo.dateStr;

                        return (
                          <div
                            key={i}
                            onClick={() =>
                              dayInfo.isCurrentMonth &&
                              handleInsightsDateClick(dayInfo.dateStr)
                            }
                            style={{
                              textAlign: "center",
                              position: "relative",
                              cursor: dayInfo.isCurrentMonth
                                ? "pointer"
                                : "default",
                              opacity: dayInfo.isCurrentMonth ? 1 : 0.3,
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                aspectRatio: "1",
                                maxWidth: "44px",
                                margin: "0 auto",
                                borderRadius: "8px",
                                backgroundColor: isSelected
                                  ? "#e0e7ff"
                                  : "#fff",
                                border: isSelected
                                  ? "2px solid #3b82f6"
                                  : "1px solid #f3f4f6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#1a1a1a",
                              }}
                            >
                              {dayInfo.day}
                            </div>
                            {entry && progressPercent > 0 && (
                              <div
                                style={{
                                  width: `${Math.max(
                                    progressPercent === 100
                                      ? 100
                                      : progressPercent,
                                    20,
                                  )}%`,
                                  height: "3px",
                                  backgroundColor:
                                    progressPercent === 100
                                      ? "#3b82f6"
                                      : "#f97316",
                                  borderRadius: "2px",
                                  margin: "4px auto 0",
                                  maxWidth: "100%",
                                }}
                              />
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Day Details */}
                {selectedInsightsDate && (
                  <div
                    style={{
                      backgroundColor: "#fff",
                      padding: "24px",
                      borderRadius: "12px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      marginBottom: "80px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#1a1a1a",
                          margin: 0,
                        }}
                      >
                        {new Date(selectedInsightsDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </h3>
                      <button
                        onClick={() => setSelectedInsightsDate(null)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "20px",
                          color: "#9ca3af",
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>

                    <p
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        marginBottom: "20px",
                      }}
                    >
                      Practices completed:{" "}
                      <strong>
                        {selectedDayData
                          ? [
                              selectedDayData.task_1_completed,
                              selectedDayData.task_2_completed,
                              selectedDayData.task_3_completed,
                            ].filter(Boolean).length
                          : 0}{" "}
                        of 3
                      </strong>
                    </p>

                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1a1a1a",
                        marginBottom: "12px",
                      }}
                    >
                      Day Notes
                    </h4>

                    <textarea
                      value={dayNotesEdit}
                      onChange={(e) => setDayNotesEdit(e.target.value)}
                      placeholder="What happened? What did you learn? How were you feeling?"
                      style={{
                        width: "100%",
                        minHeight: "120px",
                        padding: "12px",
                        fontSize: "14px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        resize: "vertical",
                        fontFamily: "inherit",
                        marginBottom: "16px",
                        color: "#1a1a1a",
                      }}
                    />

                    <button
                      onClick={handleSaveDayNotes}
                      disabled={isSavingDayNotes}
                      style={{
                        width: "100%",
                        padding: "14px",
                        backgroundColor: isSavingDayNotes
                          ? "#d1fae5"
                          : "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: 600,
                        cursor: isSavingDayNotes ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <span>✓</span>
                      {isSavingDayNotes ? "Saving..." : "Save Note"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Daily Awareness View */}
            {insightsTab === "awareness" && (
              <>
                {/* Timeframe Section */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      margin: 0,
                    }}
                  >
                    Timeframe
                  </h3>
                  <select
                    value={awarenessTimeframe}
                    onChange={(e) =>
                      setAwarenessTimeframe(parseInt(e.target.value))
                    }
                    style={{
                      padding: "10px 40px 10px 16px",
                      fontSize: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage:
                        "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27%3e%3cpath fill=%27%236b7280%27 d=%27M6 8L0 0h12z%27/%3e%3c/svg%3e')",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                    }}
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                  </select>
                </div>

                {/* Emotional Landscape */}
                <div
                  style={{
                    backgroundColor: "#fff",
                    padding: "24px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    marginBottom: "80px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: "8px",
                    }}
                  >
                    Your Emotional Landscape
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#9ca3af",
                      marginBottom: "32px",
                    }}
                  >
                    Distribution of emotions logged (tap slices for details)
                  </p>

                  {(() => {
                    const { distribution, totalCount } =
                      calculateEmotionalDistribution();

                    if (totalCount === 0) {
                      return (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "48px",
                            color: "#9ca3af",
                          }}
                        >
                          No emotional data logged in this timeframe
                        </div>
                      );
                    }

                    // Get color based on category from coach config
                    const getEmotionColor = (categoryId) => {
                      if (coachConfig?.emotional_state_tab?.categories) {
                        const category =
                          coachConfig.emotional_state_tab.categories.find(
                            (cat) => cat.id === categoryId,
                          );
                        if (category && category.color) {
                          return category.color;
                        }
                      }
                      // Fallback colors for default categories
                      if (categoryId === "challenging") return "#3b82f6";
                      if (categoryId === "positive") return "#10b981";
                      return "#9ca3af";
                    };

                    // Calculate cumulative percentages for SVG
                    let cumulativePercent = 0;
                    const segments = distribution.map((item) => {
                      const startPercent = cumulativePercent;
                      cumulativePercent += parseFloat(item.percentage);
                      return {
                        ...item,
                        startPercent,
                        color: getEmotionColor(item.categoryId),
                      };
                    });

                    return (
                      <>
                        {/* Donut Chart */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "32px",
                            padding: "20px",
                          }}
                        >
                          <svg
                            width="280"
                            height="280"
                            viewBox="0 0 200 200"
                            style={{ overflow: "visible" }}
                          >
                            {/* Colored segments */}
                            {segments.map((segment, i) => {
                              const circumference = 2 * Math.PI * 70;
                              const segmentLength =
                                (parseFloat(segment.percentage) / 100) *
                                  circumference +
                                0.5; // Add small overlap to prevent gaps
                              const offset =
                                (segment.startPercent / 100) * circumference;

                              return (
                                <circle
                                  key={i}
                                  cx="100"
                                  cy="100"
                                  r="70"
                                  fill="none"
                                  stroke={segment.color}
                                  strokeWidth="40"
                                  strokeLinecap="butt"
                                  strokeDasharray={`${segmentLength} ${circumference}`}
                                  strokeDashoffset={-offset}
                                  transform="rotate(-90 100 100)"
                                  style={{
                                    transition: "all 0.3s ease",
                                  }}
                                />
                              );
                            })}
                          </svg>
                        </div>

                        {/* Legend */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "16px",
                          }}
                        >
                          {distribution.map((item, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "50%",
                                  backgroundColor: getEmotionColor(
                                    item.categoryId,
                                  ),
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "16px",
                                  color: "#1a1a1a",
                                }}
                              >
                                {item.emotion.charAt(0).toUpperCase() +
                                  item.emotion.slice(1)}{" "}
                                ({item.percentage}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {/* Library Page */}
        {activeTab === "more" && moreSubpage === "library" && (
          <div style={{ marginTop: "24px", position: "relative" }}>
            {/* Locked Overlay */}
            {!subscriptionStatus?.isPremium && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(4px)",
                  zIndex: 10,
                  pointerEvents: "all",
                  cursor: "not-allowed",
                }}
              />
            )}
            {/* Back Button & Title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
                position: "relative",
                zIndex: 20,
              }}
            >
              <button
                onClick={() => setMoreSubpage(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0",
                  color: "#1a1a1a",
                }}
              >
                ←
              </button>
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  margin: 0,
                }}
              >
                Library
              </h2>
            </div>

            {/* Filter Tags */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "24px",
              }}
            >
              {[
                { label: "All", active: true },
                { label: "Morning", active: false },
                { label: "Energy", active: false },
                { label: "Evening", active: false },
                { label: "Reflection", active: false },
                { label: "Gratitude", active: false },
                { label: "Quick", active: false },
                { label: "Stress", active: false },
                { label: "Deep", active: false },
              ].map((tag, idx) => (
                <button
                  key={idx}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: tag.active
                      ? coachConfig?.branding?.primary_color || "#ef4444"
                      : "#f3f4f6",
                    color: tag.active ? "#fff" : "#6b7280",
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Practice Items */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[
                {
                  icon: "☀️",
                  title: "Morning Practice",
                  subtitle: "Follow Your Spark • 7:00",
                  favorite: true,
                  bgColor: "#fff9e6",
                },
                {
                  icon: "🌙",
                  title: "Evening Reflection",
                  subtitle: "Daily Review • 8:30",
                  favorite: false,
                  bgColor: "#e0e7ff",
                },
                {
                  icon: "✨",
                  title: "Gratitude Pause",
                  subtitle: "Notice the Good • 5:00",
                  favorite: false,
                  bgColor: "#fef3c7",
                },
                {
                  icon: "🫁",
                  title: "Breath Reset",
                  subtitle: "Center Yourself • 3:00",
                  favorite: false,
                  bgColor: "#dbeafe",
                },
                {
                  icon: "🧘",
                  title: "Body Scan",
                  subtitle: "Release Tension • 12:00",
                  favorite: false,
                  bgColor: "#e0e7ff",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#fff",
                    padding: "16px",
                    borderRadius: "12px",
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
                      backgroundColor: item.bgColor,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#1a1a1a",
                        marginBottom: "4px",
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                  <button
                    style={{
                      padding: "10px 20px",
                      backgroundColor:
                        coachConfig?.branding?.primary_color || "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Play
                  </button>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "24px",
                      color: item.favorite ? "#fbbf24" : "#d1d5db",
                      cursor: "pointer",
                      padding: "0",
                    }}
                  >
                    ⭐
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Page */}
        {activeTab === "more" && moreSubpage === "settings" && (
          <div style={{ marginTop: "24px" }}>
            {/* Back Button & Title */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <button
                  onClick={() => setMoreSubpage(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    padding: "0",
                    color: "#1a1a1a",
                  }}
                >
                  ←
                </button>
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    margin: 0,
                  }}
                >
                  Settings
                </h2>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: isSavingSettings ? "not-allowed" : "pointer",
                  opacity: isSavingSettings ? 0.5 : 1,
                }}
              >
                {isSavingSettings ? "Saving..." : "Done"}
              </button>
            </div>

            {/* Account Information */}
            <div style={{ marginBottom: "32px" }}>
              <h3
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.05em",
                  marginBottom: "16px",
                }}
              >
                ACCOUNT INFORMATION
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  First Name
                </label>
                <input
                  type="text"
                  value={settingsFirstName}
                  onChange={(e) => setSettingsFirstName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  value={settingsLastName}
                  onChange={(e) => setSettingsLastName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={settingsEmail}
                  onChange={(e) => setSettingsEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  Timezone
                </label>
                <select
                  value={settingsTimezone}
                  onChange={(e) => setSettingsTimezone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Paris (CET/CEST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Shanghai (CST)</option>
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                </select>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    marginTop: "8px",
                  }}
                >
                  This controls how dates are calculated for your daily entries
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    Password
                  </label>
                  <button
                    onClick={handleResetPassword}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#3b82f6",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Reset Password
                  </button>
                </div>
                <input
                  type="password"
                  value="••••••••"
                  disabled
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                  }}
                />
              </div>
            </div>

            {/* Subscription */}
            <div>
              <h3
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.05em",
                  marginBottom: "16px",
                }}
              >
                SUBSCRIPTION
              </h3>

              {isLoadingSubscription ? (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Loading subscription status...
                </div>
              ) : (
                <>
                  {/* Test Account Banner */}
                  {subscriptionStatus?.status === "test_premium" && (
                    <div
                      style={{
                        backgroundColor: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "20px",
                        color: "#1e40af",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>🛠️</span>
                      <div>
                        <strong>Test Account Mode:</strong>
                        <div style={{ fontSize: "12px", marginTop: "2px" }}>
                          You have complimentary premium access for testing
                          purposes.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Plans List */}
                  <div style={{ marginTop: "12px", marginBottom: "24px" }}>
                    {/* Basic Plan (Tier 1) */}
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#fff",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "#1a1a1a" }}>
                          Basic (Free)
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          Access to daily practices
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "18px",
                              color: "#1a1a1a",
                            }}
                          >
                            {cs}0
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            /month
                          </div>
                        </div>
                        {subscriptionStatus?.isPremium ? (
                          <button
                            onClick={handleCancelSubscription}
                            disabled={cancelingSubscription}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#fff",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: "8px",
                              fontSize: "14px",
                              fontWeight: 600,
                              cursor: cancelingSubscription
                                ? "not-allowed"
                                : "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {cancelingSubscription ? "..." : "Downgrade"}
                          </button>
                        ) : (
                          <span
                            style={{
                              backgroundColor: "#f3f4f6",
                              color: "#6b7280",
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "4px 12px",
                              borderRadius: "12px",
                            }}
                          >
                            CURRENT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Daily Companion Plan (Tier 2) */}
                    <div
                      style={{
                        border: `1px solid ${subscriptionStatus?.tier === 2 ? primaryColor : "#e5e7eb"}`,
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor:
                          subscriptionStatus?.tier === 2 ? "#fdf4ff" : "#fff",
                        boxShadow:
                          subscriptionStatus?.tier === 2
                            ? `0 0 0 1px ${primaryColor}`
                            : "none",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "#1a1a1a" }}>
                          Daily Companion
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          Full access to all features
                        </div>
                        {subscriptionStatus?.tier === 2 &&
                          subscriptionStatus.subscription?.currentPeriodEnd && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: primaryColor,
                                marginTop: "4px",
                              }}
                            >
                              Next billing:{" "}
                              {new Date(
                                subscriptionStatus.subscription
                                  .currentPeriodEnd,
                              ).toLocaleDateString()}
                            </div>
                          )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "18px",
                              color: "#1a1a1a",
                            }}
                          >
                            {cs}9.99
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            /month
                          </div>
                        </div>
                        {subscriptionStatus?.tier === 2 ? (
                          <span
                            style={{
                              backgroundColor: primaryColor,
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "4px 12px",
                              borderRadius: "12px",
                            }}
                          >
                            CURRENT
                          </span>
                        ) : subscriptionStatus?.tier === 3 ? (
                          <button
                            onClick={() => handleChangeTier(2, "monthly")}
                            disabled={upgradingToPremium}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#fff",
                              color: primaryColor,
                              border: `1px solid ${primaryColor}`,
                              borderRadius: "8px",
                              fontSize: "14px",
                              fontWeight: 600,
                              cursor: upgradingToPremium
                                ? "not-allowed"
                                : "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {upgradingToPremium ? "..." : "Downgrade"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleChangeTier(2, "monthly")}
                            disabled={upgradingToPremium || !user?.coach}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: primaryColor,
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "14px",
                              fontWeight: 600,
                              cursor:
                                upgradingToPremium || !user?.coach
                                  ? "not-allowed"
                                  : "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {upgradingToPremium ? "..." : "Upgrade"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tier 3 Plan - only show if enabled by coach or user is currently on tier 3 */}
                    {(user?.coach?.tier3_enabled !== false || subscriptionStatus?.tier === 3) && (<div
                      style={{
                        border: `1px solid ${subscriptionStatus?.tier === 3 ? primaryColor : "#e5e7eb"}`,
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor:
                          subscriptionStatus?.tier === 3 ? "#fdf4ff" : "#fff",
                        boxShadow:
                          subscriptionStatus?.tier === 3
                            ? `0 0 0 1px ${primaryColor}`
                            : "none",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "#1a1a1a" }}>
                          {user?.coach?.tier3_name || "Premium Plus"}
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "11px",
                              backgroundColor: "#fbbf24",
                              color: "#000",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: 700,
                            }}
                          >
                            ELITE
                          </span>
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          Premium + exclusive Resource Hub
                        </div>
                        {subscriptionStatus?.tier === 3 &&
                          subscriptionStatus.subscription?.currentPeriodEnd && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: primaryColor,
                                marginTop: "4px",
                              }}
                            >
                              Next billing:{" "}
                              {new Date(
                                subscriptionStatus.subscription
                                  .currentPeriodEnd,
                              ).toLocaleDateString()}
                            </div>
                          )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "18px",
                              color: "#1a1a1a",
                            }}
                          >
                            {cs}
                            {(
                              (user?.coach?.user_monthly_price_cents || 1999) /
                              100
                            ).toFixed(2)}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            /month
                          </div>
                        </div>
                        {subscriptionStatus?.tier === 3 ? (
                          <span
                            style={{
                              backgroundColor: primaryColor,
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "4px 12px",
                              borderRadius: "12px",
                            }}
                          >
                            CURRENT
                          </span>
                        ) : (
                          <button
                            onClick={() => handleChangeTier(3, "monthly")}
                            disabled={upgradingToPremium || !user?.coach}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: primaryColor,
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "14px",
                              fontWeight: 600,
                              cursor:
                                upgradingToPremium || !user?.coach
                                  ? "not-allowed"
                                  : "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {upgradingToPremium
                              ? "..."
                              : subscriptionStatus?.tier === 2
                                ? "Upgrade"
                                : "Select"}
                          </button>
                        )}
                      </div>
                    </div>)}
                  </div>

                  {/* Yearly Billing Info */}
                  <div
                    style={{
                      backgroundColor: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "16px",
                      fontSize: "13px",
                      color: "#1e40af",
                    }}
                  >
                    💡 <strong>Save with yearly billing:</strong> Get 1 month
                    free when you choose yearly (pay for 11 months, get 12
                    months access). Select yearly during checkout.
                  </div>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "16px",
                      backgroundColor: "#fff",
                      color: "#dc2626",
                      border: "2px solid #dc2626",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: "90px", // Clear the bottom tab bar
                    }}
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Daily Intention */}
      {showIntentionModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowIntentionModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "28px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "#1a1a1a" }}>
              {coachConfig?.focus_tab?.task_2?.intention_modal_title || "Set Your Intention"}
            </h3>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                {coachConfig?.focus_tab?.task_2?.intention_obstacles_label || "What might get in the way today?"}
              </label>
              <textarea
                value={intentionObstacles}
                onChange={(e) => setIntentionObstacles(e.target.value)}
                placeholder={coachConfig?.focus_tab?.task_2?.intention_obstacles_placeholder || "Meetings, distractions, fatigue, worry about..."}
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "12px",
                  fontSize: "15px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                {coachConfig?.focus_tab?.task_2?.intention_focus_label || "One word to refocus your energy"}
              </label>
              <input
                type="text"
                value={intentionFocusWord}
                onChange={(e) => setIntentionFocusWord(e.target.value)}
                placeholder={coachConfig?.focus_tab?.task_2?.intention_focus_placeholder || "Peace, Presence, Trust, Joy..."}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "15px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowIntentionModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => saveIntention(intentionObstacles, intentionFocusWord)}
                disabled={isSavingIntention || !intentionFocusWord.trim()}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  backgroundColor: (!intentionFocusWord.trim() || isSavingIntention)
                    ? "#d1d5db"
                    : (coachConfig?.branding?.primary_color || "#a855f7"),
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: (!intentionFocusWord.trim() || isSavingIntention) ? "not-allowed" : "pointer",
                  opacity: isSavingIntention ? 0.7 : 1,
                }}
              >
                {isSavingIntention ? "Saving..." : "Set Intention"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Mindfulness Entry */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px 16px 0 0",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* Scrollable Content Area */}
            <div
              style={{
                flex: "1 1 auto",
                overflowY: "auto",
                padding: "24px",
                paddingBottom: "16px",
                minHeight: 0, // Crucial for nested flex scrolling
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                  }}
                >
                  {selectedMindfulness?.label ||
                    coachConfig?.awareness_tab?.modal_title ||
                    "Nice catch!"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    color: "#9ca3af",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  When did this happen?
                </label>
                <input
                  type="text"
                  value={modalTime}
                  onChange={(e) => setModalTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  {selectedMindfulness?.prompt ||
                    "What pattern did you catch? What did you do instead?"}
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder={
                    selectedMindfulness?.placeholder ||
                    "I caught myself... and instead I..."
                  }
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "12px",
                    fontSize: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "0",
                }}
              >
                Your notes help create personalized insights
              </p>
            </div>

            {/* Fixed Button Area */}
            <div
              style={{
                padding: "16px 24px 24px",
                paddingBottom: "110px", // Ensure button clears the tab bar
                borderTop: "1px solid #e5e7eb",
                backgroundColor: "#fff",
                flex: "0 0 auto", // Prevent shrinking
              }}
            >
              <button
                onClick={handleSaveMoment}
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: primaryColor || "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save Moment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emotional State Modal */}
      {showEmotionalModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
          onClick={() => setShowEmotionalModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#f3f4f6",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                fontWeight: 700,
                textAlign: "center",
                marginBottom: "8px",
                color: "#1a1a1a",
              }}
            >
              {formatDate(selectedAwarenessDate)}
            </h3>
            <p
              style={{
                fontSize: "14px",
                textAlign: "center",
                color: "#6b7280",
                marginBottom: "24px",
              }}
            >
              {coachConfig?.emotional_state_tab?.modal_subtitle ||
                "Select all that apply"}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {(
                coachConfig?.emotional_state_tab?.categories || [
                  { id: "challenging", label: "CHALLENGING", color: "#3b82f6" },
                  { id: "positive", label: "POSITIVE", color: "#10b981" },
                ]
              ).map((category) => (
                <div key={category.id}>
                  <div
                    style={{
                      backgroundColor: category.color,
                      color: "#fff",
                      padding: "8px",
                      borderRadius: "8px 8px 0 0",
                      textAlign: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {category.label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {(emotions[category.id] || []).map((emotion, index) => {
                      const emotionName = emotion.name || emotion;
                      const emotionId = emotionName;
                      const isSelected =
                        selectedEmotions.length > 0 &&
                        selectedEmotions[0].id === emotionId;
                      return (
                        <button
                          key={emotionId}
                          onClick={() => toggleEmotion(emotionId, category.id)}
                          style={{
                            padding: "12px",
                            backgroundColor: isSelected
                              ? category.color
                              : "#fff",
                            color: isSelected ? "#fff" : "#1a1a1a",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            cursor: "pointer",
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          {emotionName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleEmotionalDone}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "#fff",
                color: "#3b82f6",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 1000,
          pointerEvents: "none",
        }}
      >
        <nav
          style={{
            width: "100%",
            maxWidth: "600px",
            backgroundColor: "#fff",
            borderTop: "1px solid #e5e7eb",
            borderLeft: "1px solid #e5e7eb",
            borderRight: "1px solid #e5e7eb",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
            display: "flex",
            justifyContent: "space-around",
            padding: "12px 0",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            pointerEvents: "auto",
          }}
        >
          {[
            { id: "focus", icon: Compass, label: "Focus", isPremium: false },
            { id: "awareness", icon: Sun, label: "Awareness", isPremium: true },
            {
              id: "coach",
              icon: MessageCircle,
              label: "Coach",
              isPremium: true,
            },
            { id: "more", icon: Menu, label: "More", isPremium: false },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isLocked = tab.isPremium && !subscriptionStatus?.isPremium;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "more") {
                    setMoreSubpage(null);
                  }

                  // If we're clicking the same tab that's already locked and showing modal, don't do anything
                  if (activeTab === tab.id && showUpgradeModal) {
                    return;
                  }

                  // If clicking a locked tab
                  if (isLocked) {
                    setActiveTab(tab.id); // Go to tab
                    setUpgradeModalContext(tab.label);
                    setShowUpgradeModal(true); // Show modal
                    return;
                  }

                  // Clicking an unlocked tab
                  setActiveTab(tab.id);
                  setShowUpgradeModal(false); // Close modal if open
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  padding: "8px",
                  position: "relative",
                }}
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  {isLocked && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-2px",
                        right: "-6px",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "#fbbf24",
                        boxShadow: "0 0 0 2px #fff",
                      }}
                    />
                  )}
                  <IconComponent
                    size={28}
                    strokeWidth={2}
                    style={{
                      opacity: activeTab === tab.id ? 1 : 0.5,
                      color: activeTab === tab.id ? primaryColor : "#9ca3af",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: activeTab === tab.id ? primaryColor : "#9ca3af",
                    fontWeight: activeTab === tab.id ? 600 : 400,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999, // Lower than bottom nav
            padding: "20px",
            paddingBottom: "100px", // Add padding so modal content doesn't overlap nav
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "20px",
              padding: "40px 32px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: `3px solid ${coachConfig?.branding?.primary_color || "#a855f7"}`,
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${coachConfig?.branding?.primary_color || "#a855f7"} 0%, ${coachConfig?.branding?.primary_color || "#ec4899"} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                boxShadow: `0 8px 24px ${coachConfig?.branding?.primary_color || "#a855f7"}40`,
              }}
            >
              <MessageCircle size={36} style={{ color: "#fff" }} />
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: "32px",
                fontWeight: 700,
                textAlign: "center",
                marginBottom: "16px",
                color: "#1a1a1a",
                lineHeight: 1.2,
              }}
            >
              {upgradeModalContext === "Awareness Log"
                ? "Awareness Log"
                : upgradeModalContext === "Coach"
                  ? "AI Coach"
                  : upgradeModalContext}
            </h2>

            {/* Description */}
            {upgradeModalContext === "Resource Hub" && (
              <p
                style={{
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: "14px",
                  marginBottom: "16px",
                }}
              >
                Requires {user?.coach?.tier3_name || "Premium Plus"} for exclusive access to community
                calls, programs & resources.
              </p>
            )}

            {/* CTA Button */}
            <button
              onClick={() => {
                setShowUpgradeModal(false);
                // For Resource Hub, upgrade to tier 3, otherwise tier 2
                if (upgradeModalContext === "Resource Hub") {
                  handleChangeTier(3, "monthly");
                } else {
                  handleUpgradeToPremium();
                }
              }}
              disabled={upgradingToPremium}
              style={{
                width: "100%",
                backgroundColor: primaryColor,
                color: "#fff",
                fontSize: "18px",
                fontWeight: 600,
                padding: "16px",
                borderRadius: "12px",
                border: "none",
                cursor: upgradingToPremium ? "not-allowed" : "pointer",
                marginBottom: "12px",
                opacity: upgradingToPremium ? 0.6 : 1,
              }}
            >
              {upgradingToPremium ? "Processing..." : "Unlock Full Access"}
            </button>

            {/* Back Button */}
            <button
              onClick={() => {
                setShowUpgradeModal(false);
                setActiveTab("focus");
              }}
              style={{
                width: "100%",
                backgroundColor: "#f3f4f6",
                color: "#4b5563",
                fontSize: "16px",
                fontWeight: 600,
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Back to Focus
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#10b981",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "14px",
            fontWeight: 600,
            zIndex: 9999,
            animation: "slideUp 0.3s ease-out",
            whiteSpace: "nowrap",
          }}
        >
          ✓ {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #e5e7eb",
              borderTop: "3px solid #ef4444",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      }
    >
      <UserDashboardContent />
    </Suspense>
  );
}
