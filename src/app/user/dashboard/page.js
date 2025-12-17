"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
  const [showSuggestedPractice, setShowSuggestedPractice] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chatMessage, setChatMessage] = useState("");
  const [showCoachProfile, setShowCoachProfile] = useState(false);
  const [moreSubpage, setMoreSubpage] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("moreSubpage") || null;
    }
    return null;
  }); // null, 'announcements', 'resources', 'insights', 'library', 'settings'
  const [selectedAwarenessDate, setSelectedAwarenessDate] = useState(
    new Date()
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
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

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

  // Persist state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("activeTab", activeTab);
    }
  }, [activeTab]);

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
    } catch (error) {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFocusEntry = async () => {
    try {
      const res = await fetch("/api/daily-entries/today");
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
      }
    } catch (error) {
      console.error("Failed to fetch daily entry:", error);
    }
  };

  const fetchAwarenessEntries = async (date) => {
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await fetch(`/api/daily-entries/date?date=${dateStr}`);
      const data = await res.json();

      if (res.ok && data.entry) {
        setEmotionalEntries(data.entry.log_2_entries || []);
        setMindfulnessEntries(data.entry.log_1_entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch awareness entries:", error);
    }
  };

  const fetchInsightsData = async (month) => {
    try {
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;
      const res = await fetch(
        `/api/daily-entries/month?year=${year}&month=${monthNum}`
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
    if (!selectedInsightsDate) return;

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
        // Refresh insights data
        fetchInsightsData(insightsMonth);
        setToastMessage("Day notes saved");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
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
        }&endDate=${endDate.toISOString().split("T")[0]}`
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
          // The structure is: log.emotions = ["type-emotion"]
          if (log.emotions && Array.isArray(log.emotions)) {
            log.emotions.forEach((emotionStr) => {
              // Extract just the emotion name (after the dash if present)
              const emotionName = emotionStr.includes("-")
                ? emotionStr.split("-")[1]
                : emotionStr;
              emotionCounts[emotionName] =
                (emotionCounts[emotionName] || 0) + 1;
              totalCount++;
            });
          }
        });
      }
    });

    // Convert to array with percentages
    const distribution = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion,
        count,
        percentage: ((count / totalCount) * 100).toFixed(0),
      }))
      .sort((a, b) => b.count - a.count);

    return { distribution, totalCount };
  };

  const fetchProfileSettings = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();

      if (res.ok && data.profile) {
        setSettingsFirstName(data.profile.first_name || "");
        setSettingsLastName(data.profile.last_name || "");
        setSettingsEmail(data.profile.email || "");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: settingsFirstName,
          last_name: settingsLastName,
          email: settingsEmail,
        }),
      });

      if (res.ok) {
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

    // Save to backend
    try {
      const taskMap = {
        morning: "task_1_completed",
        intention: "task_2_completed",
        evening: "task_3_completed",
      };

      const res = await fetch("/api/daily-entries/focus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [taskMap[task]]: newValue,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFocusEntry(data.entry);
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

  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const totalTasks = Object.keys(completedTasks).length;
  const progressPercent = (completedCount / totalTasks) * 100;

  // Trigger confetti when all tasks are completed
  useEffect(() => {
    if (completedCount === 3 && previousCompletedCount.current === 2) {
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

  const mindfulnessItems = [
    { id: "present", label: "Present moment", color: "#60a5fa" },
    { id: "gratitude", label: "Felt gratitude", color: "#4ade80" },
    { id: "pattern", label: "Shifted a pattern", color: "#f87171" },
  ];

  const handleMindfulnessClick = (item) => {
    setSelectedMindfulness(item);
    setShowModal(true);
  };

  const handleSaveMoment = async () => {
    if (!selectedMindfulness) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const entry = {
      id: crypto.randomUUID(),
      label: selectedMindfulness.label,
      time: timeStr,
      notes: modalNotes,
      timestamp: now.toISOString(),
    };

    const dateStr = selectedAwarenessDate.toISOString().split("T")[0];

    try {
      const res = await fetch("/api/daily-entries/awareness", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_1_entry: entry, date: dateStr }),
      });

      if (res.ok) {
        // Success - close modal and reset
        setShowModal(false);
        setModalNotes("");
        setSelectedMindfulness(null);

        // Refresh entries to show the new one
        fetchAwarenessEntries(selectedAwarenessDate);

        // Show success toast
        setToastMessage("Moment logged successfully");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save mindfulness moment:", error);
    }
  };

  const emotions = {
    challenging: [
      "Stressed",
      "Anxious",
      "Overwhelmed",
      "Sad",
      "Angry",
      "Frustrated",
      "Restless",
      "Lonely",
      "Tired",
      "Scattered",
    ],
    positive: [
      "Calm",
      "Joyful",
      "Creative",
      "Energized",
      "Grateful",
      "Peaceful",
      "Hopeful",
      "Content",
      "Confident",
      "Inspired",
    ],
  };

  const toggleEmotion = (emotion) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleDeleteEntry = async (entryId, entryType) => {
    const dateStr = selectedAwarenessDate.toISOString().split("T")[0];

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
    });

    // Format emotions with category prefix (challenging-Stressed, positive-Joyful)
    const formattedEmotions = selectedEmotions.map((emotion) => {
      const category = emotions.challenging.includes(emotion)
        ? "challenging"
        : "positive";
      return `${category}-${emotion}`;
    });

    const entry = {
      id: crypto.randomUUID(),
      emotions: formattedEmotions,
      time: timeStr,
      timestamp: now.toISOString(),
    };

    const dateStr = selectedAwarenessDate.toISOString().split("T")[0];

    try {
      const res = await fetch("/api/daily-entries/awareness", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_2_entry: entry, date: dateStr }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state with server data
        setEmotionalEntries(data.entry.log_2_entries || []);
        setShowSuggestedPractice(true);
        setShowEmotionalModal(false);
        setSelectedEmotions([]);
      }
    } catch (error) {
      console.error("Failed to save emotional state:", error);
      setShowEmotionalModal(false);
      setSelectedEmotions([]);
    }
  };

  // Get current week days for awareness tab
  const today = new Date();
  const currentDay = today.getDate();
  const startOfWeek = new Date(selectedAwarenessDate);
  startOfWeek.setDate(
    selectedAwarenessDate.getDate() - selectedAwarenessDate.getDay()
  );

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDays.push({
      date: day.getDate(),
      fullDate: new Date(day),
      dayName: ["S", "S", "M", "T", "W", "T", "F"][i],
      isToday:
        day.getDate() === currentDay && day.getMonth() === today.getMonth(),
      isSelected:
        day.getDate() === selectedAwarenessDate.getDate() &&
        day.getMonth() === selectedAwarenessDate.getMonth(),
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

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
        }}
      >
        <div style={{ color: "#6b7280" }}>Loading...</div>
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
      {/* Header with gradient */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #ff6b9d 0%, #ffa057 50%, #ffd96a 100%)",
          padding: "32px 24px 48px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          BrainPeace
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#1a1a1a",
            opacity: 0.8,
          }}
        >
          Mental Fitness for Active Minds
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
                    Today's Focus
                  </h2>
                  <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    Direct your energy intentionally
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
                  backgroundColor: "#f3d96d",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    backgroundColor: "#f4c542",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Morning Practice */}
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
                    fontSize: "28px",
                    flexShrink: 0,
                  }}
                >
                  ☀️
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
                      Morning Practice
                    </h3>
                    <span style={{ fontSize: "20px" }}>⭐</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    Follow Your Spark • 7:00
                  </p>
                </div>
                <button
                  onClick={() => toggleTask("morning")}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: "2px solid #d1d5db",
                    backgroundColor: completedTasks.morning
                      ? "#22c55e"
                      : "#fff",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
              </div>
              <button
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#ff5a7e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px" }}>▶</span>
                Listen Now
              </button>
            </div>

            {/* Daily Intention */}
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
                  fontSize: "28px",
                  flexShrink: 0,
                }}
              >
                🔔
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
                  Daily Intention
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  Set your focus for the day
                </p>
              </div>
              <button
                onClick={() => toggleTask("intention")}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "2px solid #d1d5db",
                  backgroundColor: completedTasks.intention
                    ? "#22c55e"
                    : "#fff",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
            </div>

            {/* Evening Review */}
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
                  fontSize: "28px",
                  flexShrink: 0,
                }}
              >
                🌙
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
                  Evening Review
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  Journal offline tonight
                </p>
              </div>
              <button
                onClick={() => toggleTask("evening")}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "2px solid #d1d5db",
                  backgroundColor: completedTasks.evening ? "#22c55e" : "#fff",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
            </div>

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
                    backgroundColor: "#d1fae5",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                  }}
                >
                  📝
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
                    Day Notes
                  </h3>
                  <p style={{ fontSize: "14px", color: "#6b7280" }}>
                    Log observations to spot patterns
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
          <>
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
                    onClick={() => setSelectedAwarenessDate(day.fullDate)}
                    style={{
                      textAlign: "center",
                      flex: 1,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0",
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
                          ? "#ff5a7e"
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
                            ? "2px solid #ff5a7e"
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
                            backgroundColor: "#a855f7",
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
                <span style={{ fontSize: "16px", color: "#9ca3af" }}>
                  {mindfulnessEntries.length + emotionalEntries.length} entries
                </span>
              </div>

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
                      onClick={() => handleMindfulnessClick(item)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "#60a5fa",
                        fontSize: "24px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
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
                  EMOTIONAL STATE
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
                    Log emotional state
                  </span>
                  <button
                    onClick={() => setShowEmotionalModal(true)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#60a5fa",
                      fontSize: "24px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Suggested Practice */}
              {showSuggestedPractice && (
                <div
                  style={{
                    backgroundColor: "#d1fae5",
                    padding: "20px",
                    borderRadius: "12px",
                    marginTop: "24px",
                    position: "relative",
                  }}
                >
                  <button
                    onClick={() => setShowSuggestedPractice(false)}
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
                    For when feeling{" "}
                    {(
                      emotionalEntries[
                        emotionalEntries.length - 1
                      ]?.emotions[0]?.split("-")[1] || ""
                    ).toLowerCase()}
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
                      Gratitude Pause
                    </h4>
                    <p style={{ fontSize: "14px", color: "#6b7280" }}>5 min</p>
                  </div>
                  <button
                    style={{
                      width: "100%",
                      padding: "14px",
                      backgroundColor: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>▶</span>
                    Start Practice
                  </button>
                </div>
              )}

              {/* Entries for this day */}
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
                        <span style={{ fontSize: "16px", color: "#1a1a1a" }}>
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
                          handleDeleteEntry(entry.id, "mindfulness")
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          fontSize: "18px",
                          cursor: "pointer",
                          padding: "0 4px",
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
                            backgroundColor: "#a855f7",
                          }}
                        />
                        <span style={{ fontSize: "16px", color: "#1a1a1a" }}>
                          Feeling{" "}
                          {entry.emotions
                            .map((e) => e.split("-")[1] || e)
                            .join(", ")
                            .toLowerCase()}
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
                        onClick={() => handleDeleteEntry(entry.id, "emotional")}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          fontSize: "18px",
                          cursor: "pointer",
                          padding: "0 4px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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
            {/* Header */}
            <div>
              {/* Gradient Section */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #ff6b9d 0%, #ffa057 50%, #ffd96a 100%)",
                  padding: "32px 24px",
                }}
              >
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
                  BrainPeace
                </h1>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#1a1a1a",
                    opacity: 0.8,
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  Mental Fitness for Active Minds
                </p>
              </div>

              {/* Control Bar - White Background */}
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <button
                  onClick={() => setShowCoachProfile(!showCoachProfile)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: 0,
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
                  style={{
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "20px",
                    padding: "8px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  New Session
                </button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                paddingBottom: "100px",
                background: "linear-gradient(180deg, #fce7f3 0%, #e0e7ff 100%)",
              }}
            >
              {/* Coach Profile Dropdown */}
              {showCoachProfile && (
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
                      IJ
                    </div>
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
                        Iv Jaeger
                      </h3>
                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "1.5",
                          color: "#4b5563",
                          margin: 0,
                        }}
                      >
                        Coach for female founders with ADHD in creative and
                        professional services. Supports women through mental
                        fitness practices and grounded daily habits. Certified
                        yoga instructor and mental fitness coach who brings a
                        calm, steady approach to navigating the demands of
                        entrepreneurship.
                      </p>
                    </div>
                  </div>

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
                      <strong>Note:</strong> Responses are AI-generated and not
                      directly from Iv Jaeger herself.
                    </p>
                  </div>
                </div>
              )}

              {/* Coach Message */}
              <div
                style={{ display: "flex", gap: "12px", marginBottom: "16px" }}
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
                    maxWidth: "80%",
                  }}
                >
                  <p
                    style={{
                      fontSize: "16px",
                      lineHeight: "1.5",
                      color: "#1a1a1a",
                      margin: 0,
                    }}
                  >
                    Before we dive in - what's one thing you're grateful for
                    right now?
                  </p>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "#fff",
                padding: "16px 24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your response here..."
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  fontSize: "16px",
                  border: "1px solid #fecaca",
                  borderRadius: "24px",
                  outline: "none",
                  color: "#1a1a1a",
                }}
              />
              <button
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
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
                  icon: "📢",
                  bgColor: "#dbeafe",
                  title: "Announcements",
                  subtitle: "Community updates and news",
                  id: "announcements",
                },
                {
                  icon: "📹",
                  bgColor: "#e9d5ff",
                  title: "Resource Hub",
                  subtitle: "Community calls, programs & resources",
                  id: "resources",
                },
                {
                  icon: "📊",
                  bgColor: "#dbeafe",
                  title: "Insights",
                  subtitle: "Your patterns over time",
                  id: "insights",
                },
                {
                  icon: "⭐",
                  bgColor: "#fef3c7",
                  title: "Library",
                  subtitle: "All practices and favorites",
                  id: "library",
                },
                {
                  icon: "⚙️",
                  bgColor: "#f3f4f6",
                  title: "Settings",
                  subtitle: "Preferences and account details",
                  id: "settings",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setMoreSubpage(item.id)}
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
                      fontSize: "24px",
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
                  <svg
                    style={{ width: "20px", height: "20px", color: "#9ca3af" }}
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
                </div>
              ))}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "32px",
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
          <div style={{ marginTop: "24px" }}>
            {/* Back Button & Title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
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
          <div style={{ marginTop: "24px" }}>
            {/* Back Button & Title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "16px",
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
                Resource Hub
              </h2>
            </div>

            <p
              style={{
                fontSize: "16px",
                color: "#6b7280",
                marginBottom: "24px",
              }}
            >
              Your curated collection of tools & wisdom
            </p>

            {/* Resource Categories */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {[
                {
                  icon: "📚",
                  title: "Bonus Library",
                  subtitle: "Extra practices to explore",
                  badge: "2",
                  count: 4,
                },
                {
                  icon: "📹",
                  title: "Community Calls",
                  subtitle: "Recorded sessions you can revisit",
                  badge: "1",
                  count: 4,
                },
                {
                  icon: "✨",
                  title: "Curated Learning",
                  subtitle: "Wisdom from leading experts",
                  badge: "2",
                  count: 4,
                },
                {
                  icon: "📋",
                  title: "Assessments",
                  subtitle: "Track your growth over time",
                  badge: "1",
                  count: 4,
                },
                {
                  icon: "📖",
                  title: "Other Resources",
                  subtitle: "Reading lists, worksheets, and more",
                  badge: "2",
                  count: 5,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#fff",
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        backgroundColor: "#f3f4f6",
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
                            fontWeight: 700,
                            color: "#1a1a1a",
                            margin: 0,
                          }}
                        >
                          {item.title}
                        </h3>
                        <span
                          style={{
                            backgroundColor: "#10b981",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "12px",
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          margin: 0,
                        }}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "16px",
                          color: "#9ca3af",
                          fontWeight: 600,
                        }}
                      >
                        {item.count}
                      </span>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Page */}
        {activeTab === "more" && moreSubpage === "insights" && (
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
                                    20
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
                          }
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

                    // Define colors for emotions
                    const emotionColors = {
                      calm: "#10b981",
                      grateful: "#6366f1",
                      stressed: "#ef4444",
                      creative: "#f97316",
                      anxious: "#8b5cf6",
                      joyful: "#fbbf24",
                      sad: "#60a5fa",
                      angry: "#dc2626",
                      peaceful: "#34d399",
                      excited: "#fb923c",
                    };

                    // Get color for emotion (case insensitive, with fallback)
                    const getEmotionColor = (emotion) => {
                      const normalizedEmotion = emotion.toLowerCase();
                      return emotionColors[normalizedEmotion] || "#9ca3af";
                    };

                    // Calculate cumulative percentages for SVG
                    let cumulativePercent = 0;
                    const segments = distribution.map((item) => {
                      const startPercent = cumulativePercent;
                      cumulativePercent += parseFloat(item.percentage);
                      return {
                        ...item,
                        startPercent,
                        color: getEmotionColor(item.emotion),
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
                            {/* Background circle */}
                            <circle
                              cx="100"
                              cy="100"
                              r="70"
                              fill="none"
                              stroke="#f3f4f6"
                              strokeWidth="40"
                            />
                            {/* Colored segments */}
                            {segments.map((segment, i) => {
                              const circumference = 2 * Math.PI * 70;
                              const segmentLength =
                                (parseFloat(segment.percentage) / 100) *
                                circumference;
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
                                    item.emotion
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
          <div style={{ marginTop: "24px" }}>
            {/* Back Button & Title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
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
                    backgroundColor: tag.active ? "#ef4444" : "#f3f4f6",
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
                      backgroundColor: "#ef4444",
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

              {/* Subscription Options */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                {/* Free Account */}
                <div
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: "4px",
                    }}
                  >
                    Free Account
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginBottom: "8px",
                    }}
                  >
                    Access to daily practices
                  </p>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                    }}
                  >
                    $0
                  </div>
                </div>

                {/* Companion */}
                <div
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: "4px",
                    }}
                  >
                    Companion
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginBottom: "8px",
                    }}
                  >
                    Full access to all app features
                  </p>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                    }}
                  >
                    $9<span style={{ fontSize: "18px" }}>/month</span>
                  </div>
                </div>

                {/* Membership - Current */}
                <div
                  style={{
                    backgroundColor: "#f3e8ff",
                    border: "3px solid #a855f7",
                    borderRadius: "12px",
                    padding: "20px",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      backgroundColor: "#a855f7",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: "12px",
                    }}
                  >
                    CURRENT
                  </span>
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: "4px",
                    }}
                  >
                    Membership
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginBottom: "8px",
                    }}
                  >
                    App + Learning Hub access + community calls
                  </p>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                    }}
                  >
                    $29<span style={{ fontSize: "18px" }}>/month</span>
                  </div>
                </div>

                {/* Bundled Account */}
                <div
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: "4px",
                    }}
                  >
                    Bundled Account
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Part of your coaching services • Full access included
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#9ca3af",
                      fontStyle: "italic",
                    }}
                  >
                    Managed through coaching bundle
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "#fff",
                  color: "#1a1a1a",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: "12px",
                }}
              >
                Update Payment Method
              </button>

              <button
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "#fff",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: "12px",
                }}
              >
                Cancel Subscription
              </button>

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
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

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
              padding: "24px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
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
                Nice catch!
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
                What pattern did you catch? What did you do instead?
              </label>
              <textarea
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="I caught myself... and instead I..."
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
                marginBottom: "20px",
              }}
            >
              Your notes help create personalized insights
            </p>

            <button
              onClick={handleSaveMoment}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "#5b7fff",
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
              Select all that apply
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {/* Challenging Column */}
              <div>
                <div
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    padding: "8px",
                    borderRadius: "8px 8px 0 0",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  CHALLENGING
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {emotions.challenging.map((emotion) => (
                    <button
                      key={emotion}
                      onClick={() => toggleEmotion(emotion)}
                      style={{
                        padding: "12px",
                        backgroundColor: selectedEmotions.includes(emotion)
                          ? "#3b82f6"
                          : "#fff",
                        color: selectedEmotions.includes(emotion)
                          ? "#fff"
                          : "#1a1a1a",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontWeight: selectedEmotions.includes(emotion)
                          ? 600
                          : 400,
                      }}
                    >
                      {emotion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Positive Column */}
              <div>
                <div
                  style={{
                    backgroundColor: "#10b981",
                    color: "#fff",
                    padding: "8px",
                    borderRadius: "8px 8px 0 0",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  POSITIVE
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {emotions.positive.map((emotion) => (
                    <button
                      key={emotion}
                      onClick={() => toggleEmotion(emotion)}
                      style={{
                        padding: "12px",
                        backgroundColor: selectedEmotions.includes(emotion)
                          ? "#10b981"
                          : "#fff",
                        color: selectedEmotions.includes(emotion)
                          ? "#fff"
                          : "#1a1a1a",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontWeight: selectedEmotions.includes(emotion)
                          ? 600
                          : 400,
                      }}
                    >
                      {emotion}
                    </button>
                  ))}
                </div>
              </div>
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
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-around",
          padding: "12px 0",
        }}
      >
        {[
          { id: "focus", icon: "🎯", label: "Focus" },
          { id: "awareness", icon: "☀️", label: "Awareness" },
          { id: "coach", icon: "💬", label: "Coach" },
          { id: "more", icon: "☰", label: "More" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
            }}
          >
            <span
              style={{
                fontSize: "24px",
                opacity: activeTab === tab.id ? 1 : 0.5,
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: activeTab === tab.id ? "#ff5a7e" : "#9ca3af",
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

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
