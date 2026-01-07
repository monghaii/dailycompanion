"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [activeSection, setActiveSection] = useState("config");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
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
    user_monthly_price_cents: 2900,
    logo_url: null,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [brandingConfig, setBrandingConfig] = useState({
    primary_color: "#7c3aed",
    background_color: "#f9fafb",
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
  const systemPromptRef = useRef(null);

  const [coachTabConfig, setCoachTabConfig] = useState({
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
          user_monthly_price_cents: user.coach.user_monthly_price_cents || 2900,
          logo_url: user.coach.logo_url || null,
        });
      }
      fetchCoachConfig();
      fetchTokenUsage();
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

        if (config.awareness) {
          setAwarenessConfig((prev) => ({
            ...prev,
            ...parseSection(config.awareness),
          }));
        }

        if (config.focus_tab) {
          setFocusConfig((prev) => ({
            ...prev,
            ...parseSection(config.focus_tab),
          }));
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
              })
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

  const handleLogoUpload = async (e) => {
    console.log("handleLogoUpload triggered", e);
    const file = e.target.files?.[0];
    console.log("Selected file:", file);
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setToastMessage(
        "❌ Please upload a valid image (JPEG, PNG, GIF, or WebP)"
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
          "✅ Audio uploaded! Remember to save your configuration."
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
          "✅ Audio uploaded! Remember to save your configuration."
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
    try {
      const res = await fetch("/api/coach/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileConfig),
      });

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
      setSavingSection(null);
    }
  };

  const handleSaveLandingConfig = async () => {
    setIsSavingConfig(true);
    setSavingSection("landing");
    try {
      const res = await fetch("/api/coach/landing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: landingConfig }),
      });

      const resData = await res.json();

      if (res.ok) {
        setToastMessage("✅ Landing page saved successfully!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage(
          "❌ Failed to save landing page: " +
            (resData.error || "Unknown error")
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
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {isSidebarOpen && (
            <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap overflow-hidden">
              Coach Hub
            </h2>
          )}
          <button
            onClick={() => {
              const newState = !isSidebarOpen;
              setIsSidebarOpen(newState);
              if (typeof window !== "undefined") {
                localStorage.setItem("coachSidebarOpen", String(newState));
              }
            }}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors mx-auto"
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
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === "config"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title="Config"
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
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === "resource-hub"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title="Resource Hub"
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
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === "analytics"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title="Analytics"
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
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === "clients"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title="Clients"
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
                ? "bg-purple-100 text-purple-700 font-medium"
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
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors cursor-pointer ${
              activeSection === "settings"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title="Settings"
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
                  <details className="group">
                    <summary className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer list-none">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Profile Settings
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Manage your public profile
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
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Your Coaching Business"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Landing Page URL Slug
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 shrink-0">
                              /
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
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="your-name"
                            />
                            <a
                              href={`/${profileConfig.slug || "your-slug"}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-sm bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shrink-0"
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
                        <div className="flex items-start gap-4">
                          {profileConfig.logo_url && !logoLoadError ? (
                            <div className="relative">
                              <img
                                src={profileConfig.logo_url}
                                alt="Business Logo"
                                onError={(e) => {
                                  console.error(
                                    "Image failed to load:",
                                    profileConfig.logo_url
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
                            value={profileConfig.bio}
                            onChange={(e) =>
                              setProfileConfig({
                                ...profileConfig,
                                bio: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            placeholder="Tell your clients about yourself..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Monthly Price
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={(
                                profileConfig.user_monthly_price_cents / 100
                              ).toFixed(2)}
                              onChange={(e) =>
                                setProfileConfig({
                                  ...profileConfig,
                                  user_monthly_price_cents: Math.round(
                                    parseFloat(e.target.value) * 100
                                  ),
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="29.99"
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Subscription per month
                          </p>
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
                              value={profileConfig.tagline}
                              onChange={(e) =>
                                setProfileConfig({
                                  ...profileConfig,
                                  tagline: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Life & Wellness Coach"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Main Headline
                            </label>
                            <input
                              type="text"
                              value={profileConfig.landing_headline}
                              onChange={(e) =>
                                setProfileConfig({
                                  ...profileConfig,
                                  landing_headline: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Transform Your Life with Personalized Coaching"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Subheadline
                            </label>
                            <input
                              type="text"
                              value={profileConfig.landing_subheadline}
                              onChange={(e) =>
                                setProfileConfig({
                                  ...profileConfig,
                                  landing_subheadline: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Join others on their journey to growth and fulfillment"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Call-to-Action Button Text
                            </label>
                            <input
                              type="text"
                              value={profileConfig.landing_cta}
                              onChange={(e) =>
                                setProfileConfig({
                                  ...profileConfig,
                                  landing_cta: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Start Your Journey"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                        <button
                          onClick={handleSaveProfile}
                          disabled={
                            isSavingConfig && savingSection === "profile"
                          }
                          className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingConfig && savingSection === "profile"
                            ? "Saving..."
                            : "Save Profile"}
                        </button>
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
                          Customize the look and feel
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

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                        <button
                          onClick={() =>
                            handleSaveConfig(
                              "branding",
                              brandingConfig,
                              "✅ Branding saved successfully!"
                            )
                          }
                          disabled={
                            isSavingConfig && savingSection === "branding"
                          }
                          className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                        <button
                          onClick={() =>
                            handleSaveConfig(
                              "header",
                              headerConfig,
                              "✅ Header config saved!"
                            )
                          }
                          disabled={
                            isSavingConfig && savingSection === "header"
                          }
                          className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Task description"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Audio File{" "}
                                <span className="text-gray-400 font-normal">
                                  (Optional)
                                </span>
                              </label>
                              {focusConfig.task_1.audio_url ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <span className="text-green-600">🎵</span>
                                    <span className="text-xs text-green-700 flex-1">
                                      Audio file uploaded
                                    </span>
                                    <button
                                      type="button"
                                      onClick={handleRemoveAudio}
                                      className="text-red-600 hover:text-red-700 text-xs font-medium"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  <audio
                                    controls
                                    src={focusConfig.task_1.audio_url}
                                    className="w-full"
                                    style={{ height: "40px" }}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <input
                                    type="file"
                                    id="audio-upload"
                                    accept="audio/mpeg,audio/wav,audio/mp3,audio/mp4,audio/x-m4a"
                                    onChange={handleAudioUpload}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor="audio-upload"
                                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-purple-400 hover:text-purple-600 cursor-pointer transition-colors ${
                                      uploadingAudio
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    {uploadingAudio ? (
                                      <>
                                        <span className="animate-spin">⏳</span>
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <span>🎵</span>
                                        Upload Audio File
                                      </>
                                    )}
                                  </label>
                                  <p className="text-xs text-gray-500 mt-1">
                                    MP3, WAV, or M4A • Max 50MB
                                  </p>
                                </div>
                              )}
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Task description"
                                />
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Task description"
                                />
                              </div>
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
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Description"
                              />
                            </div>
                          </div>
                        </details>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                        <button
                          onClick={() =>
                            handleSaveConfig(
                              "focus_tab",
                              focusConfig,
                              "✅ Focus tab config saved successfully!"
                            )
                          }
                          disabled={
                            isSavingConfig && savingSection === "focus_tab"
                          }
                          className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
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
                                          className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                        >
                                          + Add Option
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        {category.options.map(
                                          (option, optIndex) => (
                                            <div
                                              key={optIndex}
                                              className="border border-gray-200 rounded-lg p-3 space-y-2"
                                            >
                                              <div className="flex gap-2 items-start">
                                                <input
                                                  type="text"
                                                  value={option.name}
                                                  onChange={(e) =>
                                                    handleUpdateEmotionOption(
                                                      catIndex,
                                                      optIndex,
                                                      "name",
                                                      e.target.value
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
                                                      optIndex
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
                                                      e.target.value
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
                                                          optIndex
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
                                                        optIndex
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
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </details>
                              </div>
                            )
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
                              ""
                            );
                            const cleanedConfig = {
                              ...emotionalStateConfig,
                              categories: emotionalStateConfig.categories.map(
                                (cat) => ({
                                  ...cat,
                                  options: cat.options.filter(
                                    (opt) => opt.name && opt.name.trim() !== ""
                                  ),
                                })
                              ),
                            };
                            await handleSaveConfig(
                              "emotional_state_tab",
                              cleanedConfig,
                              "✅ Awareness tab config saved successfully!"
                            );
                          }}
                          disabled={
                            isSavingConfig &&
                            (savingSection === "awareness_tab" ||
                              savingSection === "emotional_state_tab")
                          }
                          className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                  100
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
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

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                          onClick={() =>
                            handleSaveConfig(
                              "coach_tab",
                              coachTabConfig,
                              "✅ Coach Tab configuration saved successfully!"
                            )
                          }
                          disabled={
                            isSavingConfig && savingSection === "coach_tab"
                          }
                          className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Landing Page Configuration */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <details className="group">
                    <summary className="p-6 border-b border-gray-100 bg-gray-50/50 cursor-pointer list-none flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Landing Page Configuration
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Customize your public landing page at /{coach?.slug}
                        </p>
                      </div>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                        ▼
                      </span>
                    </summary>
                    <div className="p-6 space-y-6">
                      {/* Hero Section */}
                      <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-3">
                          Hero Section
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Headline
                            </label>
                            <input
                              type="text"
                              value={landingConfig.hero.headline}
                              onChange={(e) =>
                                setLandingConfig({
                                  ...landingConfig,
                                  hero: {
                                    ...landingConfig.hero,
                                    headline: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Transform Your Life..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Subheadline
                            </label>
                            <input
                              type="text"
                              value={landingConfig.hero.subheadline}
                              onChange={(e) =>
                                setLandingConfig({
                                  ...landingConfig,
                                  hero: {
                                    ...landingConfig.hero,
                                    subheadline: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Join others on their journey..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CTA Button Text
                            </label>
                            <input
                              type="text"
                              value={landingConfig.hero.cta_button_text}
                              onChange={(e) =>
                                setLandingConfig({
                                  ...landingConfig,
                                  hero: {
                                    ...landingConfig.hero,
                                    cta_button_text: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Start Your Journey"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Coach Info Section */}
                      <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-3">
                          Coach Information
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={landingConfig.coach_info.name}
                              onChange={(e) =>
                                setLandingConfig({
                                  ...landingConfig,
                                  coach_info: {
                                    ...landingConfig.coach_info,
                                    name: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Your Name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Title
                            </label>
                            <input
                              type="text"
                              value={landingConfig.coach_info.title}
                              onChange={(e) =>
                                setLandingConfig({
                                  ...landingConfig,
                                  coach_info: {
                                    ...landingConfig.coach_info,
                                    title: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Life & Wellness Coach"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bio
                            </label>
                            <textarea
                              value={landingConfig.coach_info.bio}
                              onChange={(e) =>
                                setLandingConfig({
                                  ...landingConfig,
                                  coach_info: {
                                    ...landingConfig.coach_info,
                                    bio: e.target.value,
                                  },
                                })
                              }
                              rows={4}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Brief bio about your coaching approach..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pricing Features */}
                      <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-3">
                          Pricing Features
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={landingConfig.pricing.monthly_highlight}
                              onChange={(e) =>
                                setLandingConfig({
                                  ...landingConfig,
                                  pricing: {
                                    ...landingConfig.pricing,
                                    monthly_highlight: e.target.checked,
                                  },
                                })
                              }
                              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label className="text-sm font-medium text-gray-700">
                              Highlight Monthly Plan (shows "Most Popular"
                              badge)
                            </label>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={landingConfig.pricing.show_yearly}
                              onChange={(e) =>
                                setLandingConfig({
                                  ...landingConfig,
                                  pricing: {
                                    ...landingConfig.pricing,
                                    show_yearly: e.target.checked,
                                  },
                                })
                              }
                              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label className="text-sm font-medium text-gray-700">
                              Show Yearly Plan Option
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Feature List (one per line)
                            </label>
                            <textarea
                              value={landingConfig.pricing.features.join("\n")}
                              onChange={(e) =>
                                setLandingConfig({
                                  ...landingConfig,
                                  pricing: {
                                    ...landingConfig.pricing,
                                    features: e.target.value
                                      .split("\n")
                                      .filter((f) => f.trim()),
                                  },
                                })
                              }
                              rows={6}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                              placeholder="Daily guided practices&#10;AI-powered coaching&#10;Progress tracking"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Preview & Save */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <a
                          href={`/${coach?.slug}`}
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

                        <button
                          onClick={handleSaveLandingConfig}
                          disabled={
                            isSavingConfig && savingSection === "landing"
                          }
                          className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingConfig && savingSection === "landing"
                            ? "Saving..."
                            : "Save Landing Page"}
                        </button>
                      </div>
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
