"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import html2canvas from "html2canvas";
import posthog from "posthog-js";

const COUNTRY_CURRENCY_SYMBOL = {
  US: "$", DE: "\u20ac", FR: "\u20ac", ES: "\u20ac", IT: "\u20ac",
  NL: "\u20ac", IE: "\u20ac", BE: "\u20ac", AT: "\u20ac",
  GB: "\u00a3", CA: "CA$", AU: "A$", NZ: "NZ$", CH: "CHF ", SG: "S$",
};

export default function ConfigSection({
  user,
  coach,
  checkAuthResponse,
  showToast,
  handleSessionExpired,
  profileConfig,
  setProfileConfig,
  tier3PriceInput,
  setTier3PriceInput,
  isSavingConfig,
  setIsSavingConfig,
  savingSection,
  setSavingSection,
  handleSaveProfile,
  markPanelDirty,
  markPanelClean,
  clearDirtyPanels,
  setUser,
}) {
  const initialLoadDoneRef = useRef(false);
  const loadGenRef = useRef(0);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);

const [headerConfig, setHeaderConfig] = useState({
  title: "BrainPeace",
  subtitle: "Mental Fitness for Active Minds",
});

const [uploadingLogo, setUploadingLogo] = useState(false);

const [logoLoadError, setLogoLoadError] = useState(false);

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

const [previewPosition, setPreviewPosition] = useState({ x: 800, y: 100 });

const [isDragging, setIsDragging] = useState(false);

const dragRef = useRef({ offsetX: 0, offsetY: 0 });

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
  meta_description: "",
});

const [tokenUsage, setTokenUsage] = useState({
  totalTokens: 0,
  subscriberCount: 0,
  averagePerUser: 0,
  tokenLimit: 1000000,
});

useEffect(() => {
  setPreviewPosition({ x: window.innerWidth - 420, y: 100 });
}, []);

  const cs = COUNTRY_CURRENCY_SYMBOL[coach?.stripe_country] || "$";

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
  loadGenRef.current += 1;
  const gen = loadGenRef.current;
  setTimeout(() => {
    if (gen === loadGenRef.current) {
      clearDirtyPanels();
      initialLoadDoneRef.current = true;
    }
  }, 800);
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

const handleLogoUpload = async (e) => {
  console.log("handleLogoUpload triggered", e);
  const file = e.target.files?.[0];
  console.log("Selected file:", file);
  if (!file) return;

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    showToast(
      "Please upload a valid image (JPEG, PNG, GIF, or WebP)",
    );
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast("Image must be under 5MB. Please resize or compress it.");
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

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (res.ok && data.url) {
      setProfileConfig((prev) => ({ ...prev, logo_url: data.url }));
      setLogoLoadError(false);
      showToast("Logo uploaded! Remember to save your profile.");
    } else if (res.status === 401) {
      handleSessionExpired();
    } else {
      showToast(data.error || "Failed to upload logo");
    }
  } catch (error) {
    console.error("Upload error:", error);
    showToast("Failed to upload logo. Check your connection and try again.");
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
    showToast("Please upload a valid audio file (MP3, WAV, M4A)");
    return;
  }

  // Validate file size (50MB)
  if (file.size > 50 * 1024 * 1024) {
    showToast("File size must be less than 50MB");
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

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (res.ok && data.url) {
      setFocusConfig((prev) => ({
        ...prev,
        task_1: {
          ...prev.task_1,
          audio_url: data.url,
          audio_path: data.path,
        },
      }));
      showToast(
        "Audio uploaded! Remember to save your configuration.",
      );
    } else if (res.status === 401) {
      handleSessionExpired();
    } else {
      showToast(data.error || "Failed to upload audio");
    }
  } catch (error) {
    console.error("Upload error:", error);
    showToast("Failed to upload audio. Check your connection and try again.");
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
  showToast("Audio removed. Remember to save your configuration.");
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
  if (field === "name" && value.length > 17) return;
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
    showToast("Please upload a valid audio file (MP3, WAV, M4A)");
    return;
  }

  // Validate file size (50MB)
  if (file.size > 50 * 1024 * 1024) {
    showToast("File size must be less than 50MB");
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

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (res.ok && data.url) {
      const audioDuration = await getAudioDuration(file);

      const newCategories = [...emotionalStateConfig.categories];
      newCategories[catIndex].options[optIndex].audio_url = data.url;
      newCategories[catIndex].options[optIndex].audio_path = data.path;
      newCategories[catIndex].options[optIndex].duration = audioDuration;
      setEmotionalStateConfig({
        ...emotionalStateConfig,
        categories: newCategories,
      });
      showToast(
        "Audio uploaded! Remember to save your configuration.",
      );
    } else if (res.status === 401) {
      handleSessionExpired();
    } else {
      showToast(data.error || "Failed to upload audio");
    }
  } catch (error) {
    console.error("Upload error:", error);
    showToast("Failed to upload audio. Check your connection and try again.");
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
  showToast("Audio removed. Remember to save your configuration.");
};

const handleRemoveLogo = () => {
  setProfileConfig((prev) => ({ ...prev, logo_url: null }));
  setLogoLoadError(false);
  showToast("Logo removed. Remember to save your profile.");
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
      showToast(successMessage || "Config saved successfully!");
      setTimeout(() => sendConfigToPreview(), 100);
      posthog.capture("coach_config_saved", { section });
      if (section === "branding") markPanelClean("branding");
      else if (section === "header") markPanelClean("header");
      else if (section === "focus_tab") markPanelClean("focus");
      else if (section === "awareness_tab" || section === "emotional_state_tab") markPanelClean("awareness");
      else if (section === "coach_tab") markPanelClean("coach_tab");

      if (["branding", "header", "focus_tab"].includes(section)) {
        setTimeout(() => captureFocusScreenshot(), 500);
      }
    } else {
      showToast(
        "Failed to save config: " + (resData.error || "Unknown error"),
      );
    }
  } catch (error) {
    console.error("Save config error:", error);
    showToast("Failed to save config");
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
  const currentConfig = {
    hero: landingConfig.hero,
    coach_info: {
      ...landingConfig.coach_info,
      name:
        document.getElementById("landing-coach-name")?.value ||
        landingConfig.coach_info.name,
      title:
        document.getElementById("landing-coach-title")?.value ||
        landingConfig.coach_info.title,
      bio:
        document.getElementById("landing-coach-bio")?.value ||
        landingConfig.coach_info.bio,
    },
    pricing: {
      ...landingConfig.pricing,
      monthly_highlight:
        document.getElementById("landing-pricing-monthly")?.checked ??
        landingConfig.pricing.monthly_highlight,
      show_yearly:
        document.getElementById("landing-pricing-yearly")?.checked ??
        landingConfig.pricing.show_yearly,
      features: (
        document.getElementById("landing-pricing-features")?.value || ""
      )
        .split("\n")
        .filter((f) => f.trim()),
    },
    testimonials: landingConfig.testimonials,
    branding: landingConfig.branding,
    meta_description:
      document.getElementById("landing-meta-description")?.value ||
      landingConfig.meta_description ||
      "",
  };

  setLandingConfig(currentConfig);

  const res = await fetch("/api/coach/landing-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config: currentConfig }),
  });

  if (checkAuthResponse(res)) return;
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || "Failed to save landing config");
};

const handleSaveAll = async () => {
  setIsSavingConfig(true);
  setSavingSection("all");
  try {
    await handleSaveProfile();
    await handleSaveLandingConfig();
    await captureFocusScreenshot();
    markPanelClean("landing");
    showToast("Landing page saved successfully!");
  } catch (error) {
    console.error("Save error:", error);
    showToast("Failed to save: " + (error.message || "Unknown error"));
  } finally {
    setIsSavingConfig(false);
    setSavingSection(null);
  }
};

const handlePreviewMouseDown = (e) => {
  dragRef.current = {
    offsetX: e.clientX - previewPosition.x,
    offsetY: e.clientY - previewPosition.y,
  };
  setIsDragging(true);
};

useEffect(() => {
  if (!isDragging) return;

  let rafId = null;
  const handlePreviewMouseMove = (e) => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      setPreviewPosition({
        x: e.clientX - dragRef.current.offsetX,
        y: e.clientY - dragRef.current.offsetY,
      });
    });
  };

  const handlePreviewMouseUp = () => {
    if (rafId) cancelAnimationFrame(rafId);
    setIsDragging(false);
  };

  document.addEventListener("mousemove", handlePreviewMouseMove);
  document.addEventListener("mouseup", handlePreviewMouseUp);
  return () => {
    document.removeEventListener("mousemove", handlePreviewMouseMove);
    document.removeEventListener("mouseup", handlePreviewMouseUp);
  };
}, [isDragging]);

useEffect(() => { markPanelDirty("landing"); }, [profileConfig, landingConfig]);
useEffect(() => { markPanelDirty("branding"); }, [brandingConfig]);
useEffect(() => { markPanelDirty("header"); }, [headerConfig]);
useEffect(() => { markPanelDirty("focus"); }, [focusConfig, audioLibrary]);
useEffect(() => { markPanelDirty("awareness"); }, [awarenessConfig, emotionalStateConfig]);
useEffect(() => { markPanelDirty("coach_tab"); }, [coachTabConfig]);

  useEffect(() => {
    fetchCoachConfig();
    fetchTokenUsage();
  }, []);

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">
              Configuration
            </h1>
            <p className="text-gray-600 mt-1">
              Customize your Daily Companion instance
            </p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-black rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 shrink-0"
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
          {/* Direct Signup Links */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
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
              Share these links to allow users to sign up directly for
              free or premium
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
                    value={`${origin}/signup?coach=${coach?.slug}&plan=free`}
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-mono"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={(e) => {
                      navigator.clipboard.writeText(
                        `${origin}/signup?coach=${coach?.slug}&plan=free`,
                      );
                      const btn = e.currentTarget;
                      const originalText = btn.textContent;
                      btn.textContent = "✓";
                      btn.classList.add("bg-green-600");
                      setTimeout(() => {
                        btn.textContent = originalText;
                        btn.classList.remove("bg-green-600");
                      }, 2000);
                    }}
                    className="px-3 py-2 bg-[#fbbf24] text-black text-xs font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Daily Companion Signup Link ({cs}9.99/month)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${origin}/signup?coach=${coach?.slug}&plan=premium`}
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-mono"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={(e) => {
                      navigator.clipboard.writeText(
                        `${origin}/signup?coach=${coach?.slug}&plan=premium`,
                      );
                      const btn = e.currentTarget;
                      const originalText = btn.textContent;
                      btn.textContent = "✓";
                      btn.classList.add("bg-green-600");
                      setTimeout(() => {
                        btn.textContent = originalText;
                        btn.classList.remove("bg-green-600");
                      }, 2000);
                    }}
                    className="px-3 py-2 bg-[#fbbf24] text-black text-xs font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
              {profileConfig.tier3_enabled && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {profileConfig.tier3_name || "Premium Plus"} Signup Link ({cs}{tier3PriceInput}/month)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${origin}/signup?coach=${coach?.slug}&plan=premium&tier=3`}
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-mono"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      onClick={(e) => {
                        navigator.clipboard.writeText(
                          `${origin}/signup?coach=${coach?.slug}&plan=premium&tier=3`,
                        );
                        const btn = e.currentTarget;
                        const originalText = btn.textContent;
                        btn.textContent = "✓";
                        btn.classList.add("bg-green-600");
                        setTimeout(() => {
                          btn.textContent = originalText;
                          btn.classList.remove("bg-green-600");
                        }, 2000);
                      }}
                      className="px-3 py-2 bg-[#fbbf24] text-black text-xs font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                    Business identity, colors, and visual styling
                  </p>
                </div>
                <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                  ▼
                </span>
              </summary>
              <div className="p-6 space-y-6">
                {/* Business Name */}
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    placeholder="Your Coaching Business"
                  />
                </div>

                {/* Business Logo */}
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
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : logoLoadError && profileConfig.logo_url ? (
                      <div className="relative">
                        <div className="w-24 h-24 border-2 border-red-300 rounded-lg flex flex-col items-center justify-center text-red-500 text-xs p-2 text-center bg-red-50">
                          <span className="text-lg mb-1">!</span>
                          <span>Failed to load</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                        {uploadingLogo ? (
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
                        ) : (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        )}
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

                {/* Primary Color */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Colors
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
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
                          className="w-28 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Background
                      </label>
                      <div className="flex gap-1.5 mb-3">
                        <button
                          onClick={() =>
                            setBrandingConfig({
                              ...brandingConfig,
                              background_type: "solid",
                            })
                          }
                          className={`px-3 py-1 text-xs rounded-md border font-medium transition-colors ${
                            brandingConfig.background_type === "solid"
                              ? "border-purple-600 bg-purple-50 text-purple-700"
                              : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          Solid
                        </button>
                        <button
                          onClick={() =>
                            setBrandingConfig({
                              ...brandingConfig,
                              background_type: "gradient",
                            })
                          }
                          className={`px-3 py-1 text-xs rounded-md border font-medium transition-colors ${
                            brandingConfig.background_type === "gradient"
                              ? "border-purple-600 bg-purple-50 text-purple-700"
                              : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          Gradient
                        </button>
                      </div>

                      {brandingConfig.background_type === "solid" ? (
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
                            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
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
                            className="w-28 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Color 1</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={brandingConfig.gradient_color_1}
                                  onChange={(e) =>
                                    setBrandingConfig({
                                      ...brandingConfig,
                                      gradient_color_1: e.target.value,
                                    })
                                  }
                                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
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
                                  className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Color 2</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={brandingConfig.gradient_color_2}
                                  onChange={(e) =>
                                    setBrandingConfig({
                                      ...brandingConfig,
                                      gradient_color_2: e.target.value,
                                    })
                                  }
                                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
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
                                  className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Angle: {brandingConfig.gradient_angle}°
                              </label>
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
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Spread: {brandingConfig.gradient_spread}%
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
                            </div>
                          </div>
                          <div
                            className="w-full h-14 rounded-lg border border-gray-300"
                            style={{
                              background: `linear-gradient(${brandingConfig.gradient_angle}deg, ${brandingConfig.gradient_color_1} 0%, ${brandingConfig.gradient_color_2} ${brandingConfig.gradient_spread}%, ${brandingConfig.gradient_color_2} 100%)`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* App Logo */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    App Logo
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">
                    Replaces the title text in your client&apos;s in-app header only. Does not appear on your landing page.
                  </p>

                  {brandingConfig.app_logo_url && (
                    <div className="mb-3">
                      <div
                        className="rounded-lg overflow-hidden border border-gray-200"
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
                          padding: "20px 16px",
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
                            fontSize: "12px",
                            color: "#1a1a1a",
                            opacity: 0.8,
                            marginTop: "6px",
                          }}
                        >
                          {headerConfig.subtitle ||
                            "Mental Fitness for Active Minds"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <label className="text-xs text-gray-500">Size:</label>
                        <div className="flex gap-1">
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
                              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                                brandingConfig.app_logo_size === size
                                  ? "bg-purple-600 text-white border-purple-600"
                                  : "bg-white text-gray-600 border-gray-300 hover:border-purple-400"
                              }`}
                            >
                              {size.charAt(0).toUpperCase() + size.slice(1)}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() =>
                            setBrandingConfig({
                              ...brandingConfig,
                              app_logo_url: null,
                            })
                          }
                          className="ml-auto text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                      if (!validTypes.includes(file.type)) {
                        showToast("Please upload a valid image (JPEG, PNG, GIF, or WebP)");
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        showToast("Image must be under 5MB. Please resize or compress it.");
                        return;
                      }

                      setUploadingAppLogo(true);
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("type", "logo");

                      try {
                        const res = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });
                        let data;
                        try { data = await res.json(); } catch { data = {}; }

                        if (res.ok && data.url) {
                          setBrandingConfig({
                            ...brandingConfig,
                            app_logo_url: data.url,
                          });
                        } else if (res.status === 401) {
                          handleSessionExpired();
                        } else {
                          showToast(data.error || "Failed to upload logo");
                        }
                      } catch (error) {
                        console.error("Upload error:", error);
                        showToast("Failed to upload logo. Check your connection and try again.");
                      } finally {
                        setUploadingAppLogo(false);
                      }
                    }}
                    className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#fef3c7] file:text-black hover:file:bg-[#fbbf24] disabled:opacity-50"
                    disabled={uploadingAppLogo}
                  />
                  {uploadingAppLogo && (
                    <p className="text-xs text-gray-500 mt-1">
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
                        "Branding saved successfully!",
                      )
                    }
                    disabled={
                      isSavingConfig && savingSection === "branding"
                    }
                    className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingConfig && savingSection === "branding"
                      ? "Saving..."
                      : "Save Branding"}
                  </button>
                </div>
              </div>
            </details>
          </div>

          {/* Landing Page Configuration */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <details className="group">
              <summary className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer list-none">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Landing Page Configuration
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Customize your public landing page
                  </p>
                </div>
                <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                  ▼
                </span>
              </summary>
              <div className="p-6 space-y-6">
                {/* Page URL */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Page URL
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 shrink-0">
                      /coach/
                    </span>
                    <input
                      type="text"
                      value={profileConfig.slug}
                      onChange={(e) => {
                        const formattedSlug = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "");
                        setProfileConfig({
                          ...profileConfig,
                          slug: formattedSlug,
                        });
                      }}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      placeholder="your-name"
                    />
                    <a
                      href={`/coach/${profileConfig.slug || "your-slug"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer flex items-center gap-2 shrink-0"
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
                      View
                    </a>
                  </div>
                </div>

                {/* Hero Section */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Hero Section
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Headline
                      </label>
                      <input
                        type="text"
                        id="profile-landing-headline"
                        defaultValue={profileConfig.landing_headline}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        placeholder="Join others on their journey to growth and fulfillment"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Hero Bio
                      </label>
                      <textarea
                        rows={3}
                        id="profile-bio"
                        defaultValue={profileConfig.bio}
                        maxLength={375}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                        placeholder="Tell your clients about yourself..."
                        onChange={(e) => {
                          const counter = document.getElementById("profile-bio-count");
                          if (counter) counter.textContent = `${e.target.value.length}/375`;
                        }}
                      />
                      <p id="profile-bio-count" className="text-xs text-gray-400 mt-1 text-right">
                        {(profileConfig.bio || "").length}/375
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Title / Role
                      </label>
                      <input
                        type="text"
                        id="profile-tagline"
                        defaultValue={profileConfig.tagline}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        placeholder="Life & Wellness Coach"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        id="profile-landing-cta"
                        defaultValue={profileConfig.landing_cta}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        placeholder="Start Your Journey"
                      />
                    </div>
                  </div>
                </div>

                {/* Coach Info */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Coach Info
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Shown in the &ldquo;Made by&rdquo; section on your landing page
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        id="landing-coach-name"
                        defaultValue={landingConfig.coach_info.name}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        placeholder="Brief bio about your coaching approach..."
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Pricing
                  </h3>
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
                        Highlight Monthly Plan (shows &ldquo;Most Popular&rdquo;
                        badge)
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="landing-pricing-yearly"
                        defaultChecked={
                          landingConfig.pricing.show_yearly
                        }
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

                {/* SEO & Sharing */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    SEO & Sharing
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Meta Description
                    </label>
                    <textarea
                      id="landing-meta-description"
                      defaultValue={
                        landingConfig.meta_description || ""
                      }
                      rows={3}
                      maxLength={160}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      placeholder="A short description for search results and social media previews (max 160 characters)"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Appears in Google search results and social media
                      previews when someone shares your landing page.
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                  <button
                    onClick={handleSaveAll}
                    disabled={isSavingConfig}
                    className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingConfig && savingSection === "all"
                      ? "Saving..."
                      : "Save Landing Page"}
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
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    placeholder="BrainPeace"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                        "Header config saved!",
                      )
                    }
                    disabled={
                      isSavingConfig && savingSection === "header"
                    }
                    className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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

                        <div className="space-y-2 max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg p-3">
                          {audioLibrary
                            .filter((a) => a.audio_url)
                            .map((audio, index, filteredArr) => {
                              const actualIndex = audioLibrary.findIndex(
                                (a) => a.id === audio.id,
                              );
                              return (
                                <div
                                  key={audio.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", String(index));
                                    e.currentTarget.style.opacity = "0.5";
                                  }}
                                  onDragEnd={(e) => {
                                    e.currentTarget.style.opacity = "1";
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderTopColor = "#7c3aed";
                                  }}
                                  onDragLeave={(e) => {
                                    e.currentTarget.style.borderTopColor = "";
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderTopColor = "";
                                    const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                                    const toIdx = index;
                                    if (fromIdx === toIdx) return;
                                    const filled = audioLibrary.filter((a) => a.audio_url);
                                    const moved = [...filled];
                                    const [item] = moved.splice(fromIdx, 1);
                                    moved.splice(toIdx, 0, item);
                                    const reindexed = moved.map((a, i) => ({ ...a, id: i }));
                                    const oldToday = filled[currentDayIndex];
                                    const newTodayIdx = oldToday ? reindexed.findIndex((a) => a.audio_url === oldToday.audio_url && a.audio_path === oldToday.audio_path) : 0;
                                    setAudioLibrary(reindexed);
                                    setCurrentDayIndex(newTodayIdx >= 0 ? newTodayIdx : 0);
                                  }}
                                  className={`p-3 rounded-lg border-2 transition-colors ${
                                    actualIndex === currentDayIndex
                                      ? "border-purple-500 bg-purple-50"
                                      : "border-gray-200 bg-white"
                                  }`}
                                  style={{ cursor: "grab" }}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-4 h-4 text-gray-300 shrink-0 cursor-grab" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                                    <span className="text-xs font-medium text-gray-400 shrink-0">
                                      {index + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={audio.name || ""}
                                      onChange={(e) => {
                                        const newLib = [...audioLibrary];
                                        newLib[actualIndex] = { ...newLib[actualIndex], name: e.target.value };
                                        setAudioLibrary(newLib);
                                      }}
                                      placeholder={audio.audio_path?.split("/").pop()?.replace(/\.[^.]+$/, "") || `Day ${index + 1}`}
                                      className="flex-1 min-w-0 px-2 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-transparent outline-none bg-transparent"
                                    />
                                    {actualIndex === currentDayIndex && (
                                      <span className="text-xs bg-[#fbbf24] text-black px-2 py-0.5 rounded-full font-semibold shrink-0">
                                        Today
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
                                          className="text-xs text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
                                        >
                                          Set as Today
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const filled = audioLibrary.filter((a) => a.audio_url);
                                          const newFilled = filled.filter((_, i) => i !== index);
                                          const reindexed = newFilled.map((a, i) => ({ ...a, id: i }));
                                          const oldToday = filled[currentDayIndex];
                                          let newTodayIdx = 0;
                                          if (oldToday && index !== currentDayIndex) {
                                            newTodayIdx = reindexed.findIndex((a) => a.audio_url === oldToday.audio_url);
                                          }
                                          setAudioLibrary(reindexed);
                                          setCurrentDayIndex(Math.max(0, newTodayIdx));
                                        }}
                                        className="text-xs text-red-600 hover:text-red-700 font-medium ml-auto cursor-pointer"
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
                                    showToast("Please upload a valid audio file (MP3, WAV, M4A)");
                                    return;
                                  }

                                  // Validate file size (50MB)
                                  if (file.size > 50 * 1024 * 1024) {
                                    showToast("File size must be less than 50MB");
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

                                    let data;
                                    try {
                                      data = await res.json();
                                    } catch {
                                      data = {};
                                    }

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
                                      showToast("Audio uploaded! Remember to save your configuration.");
                                    } else if (res.status === 401) {
                                      handleSessionExpired();
                                    } else {
                                      showToast(data.error || "Failed to upload audio. Please try again.");
                                    }
                                  } catch (error) {
                                    console.error("Upload error:", error);
                                    showToast("Failed to upload audio. Check your connection and try again.");
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
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
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
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                      const existingStartDate = coachConfig?.focus_tab?.library_start_date;
                      await handleSaveConfig(
                        "focus_tab",
                        {
                          ...focusConfig,
                          audio_library: audioLibrary.filter(
                            (a) => a.audio_url,
                          ),
                          current_day_index: currentDayIndex,
                          library_start_date: existingStartDate || new Date().toISOString(),
                        },
                        "Focus tab config saved successfully!",
                      );
                      setTimeout(() => captureFocusScreenshot(), 300);
                    }}
                    disabled={
                      isSavingConfig && savingSection === "focus_tab"
                    }
                    className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
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
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
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
                                          <div className="flex-1 relative">
                                            <input
                                              type="text"
                                              value={option.name}
                                              maxLength={17}
                                              onChange={(e) =>
                                                handleUpdateEmotionOption(
                                                  catIndex,
                                                  optIndex,
                                                  "name",
                                                  e.target.value,
                                                )
                                              }
                                              placeholder="Emotion name"
                                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                            <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] ${option.name.length >= 17 ? "text-red-400" : "text-gray-300"}`}>{option.name.length}/17</span>
                                          </div>
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
                                        </div>

                                        {/* Audio Upload */}
                                        {option.audio_url ? (
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                                              <span className="text-green-600">
                                                Audio
                                              </span>
                                              <span className="text-green-700 flex-1 truncate">
                                                {option.audio_path ? option.audio_path.split("/").pop() : "Audio uploaded"}
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
                                                    ...
                                                  </span>
                                                  Uploading...
                                                </>
                                              ) : (
                                                <>
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
                        "Awareness tab config saved successfully!",
                      );
                    }}
                    disabled={
                      isSavingConfig &&
                      (savingSection === "awareness_tab" ||
                        savingSection === "emotional_state_tab")
                    }
                    className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                      if (!validTypes.includes(file.type)) {
                        showToast("Please upload a valid image (JPEG, PNG, GIF, or WebP)");
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        showToast("Image must be under 5MB. Please resize or compress it.");
                        return;
                      }

                      setUploadingBotProfilePicture(true);
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("type", "logo");

                      try {
                        const res = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });
                        let data;
                        try { data = await res.json(); } catch { data = {}; }

                        if (res.ok && data.url) {
                          setCoachTabConfig({
                            ...coachTabConfig,
                            bot_profile_picture_url: data.url,
                          });
                        } else if (res.status === 401) {
                          handleSessionExpired();
                        } else {
                          showToast(data.error || "Failed to upload picture");
                        }
                      } catch (error) {
                        console.error("Upload error:", error);
                        showToast("Failed to upload picture. Check your connection and try again.");
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
                    Tip: The system prompt defines the AI's role,
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
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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

                      {/* Suggest Booking During Long Sessions */}
                      {(coachTabConfig.booking?.options || []).some(o => o.url) && (
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                Suggest Booking During Long Sessions
                              </label>
                              <p className="text-xs text-gray-500 mt-0.5">
                                When a session enters "Wrap Up Soon" status, the AI will suggest booking a call and a booking button will appear in the chat
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={coachTabConfig.booking?.suggest_booking_in_session || false}
                                onChange={(e) =>
                                  setCoachTabConfig({
                                    ...coachTabConfig,
                                    booking: {
                                      ...coachTabConfig.booking,
                                      suggest_booking_in_session: e.target.checked,
                                    },
                                  })
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                            </label>
                          </div>
                        </div>
                      )}
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
                        "Coach Tab configuration saved successfully!",
                      )
                    }
                    disabled={
                      isSavingConfig && savingSection === "coach_tab"
                    }
                    className="px-6 py-2.5 bg-[#fbbf24] text-black font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingConfig && savingSection === "coach_tab"
                      ? "Saving..."
                      : "Save Coach Configuration"}
                  </button>
                </div>
              </div>
            </details>
          </div>

        </div>
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
                  "Sending initial config on iframe load:",
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
              pointerEvents: isDragging ? "none" : "auto",
            }}
            title="Mobile Preview"
          />
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
    </>
  );
}
