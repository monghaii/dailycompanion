"use client";

import { useState, useEffect, useRef, memo, Suspense } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { posthogIdentifyIfAllowed } from "@/components/PostHogProvider";
import AnalyticsSection from "./components/AnalyticsSection";
import FinanceSection from "./components/FinanceSection";
import SettingsSection from "./components/SettingsSection";
import ConfigSection from "./components/ConfigSection";
import ResourceHubSection from "./components/ResourceHubSection";
import HelpWidget from "@/components/HelpWidget";

const ANNOUNCEMENT_ICONS = {
  megaphone: { label: "Megaphone", path: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  bell: { label: "Bell", path: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  star: { label: "Star", path: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  info: { label: "Info", path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  calendar: { label: "Calendar", path: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  gift: { label: "Gift", path: "M12 8v13m0-13V6a4 4 0 00-4-4c-1.38 0-2.5.82-2.5 2S6.62 6 8 6h4zm0 0V6a4 4 0 014-4c1.38 0 2.5.82 2.5 2S17.38 6 16 6h-4zm-8 2h16v2H4v-2zm2 2v7a2 2 0 002 2h8a2 2 0 002-2v-7" },
  sparkles: { label: "Sparkles", path: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
  heart: { label: "Heart", path: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  lightning: { label: "Lightning", path: "M13 10V3L4 14h7v7l9-11h-7z" },
  book: { label: "Book", path: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  check: { label: "Check Circle", path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  flag: { label: "Flag", path: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" },
  link: { label: "Link", path: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
  rocket: { label: "Rocket", path: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
  users: { label: "Users", path: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
};

function AnnouncementIconSvg({ iconKey, size = 20, color = "currentColor" }) {
  const iconData = ANNOUNCEMENT_ICONS[iconKey] || ANNOUNCEMENT_ICONS.megaphone;
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={iconData.path} />
    </svg>
  );
}

function AnnouncementsSection({ coachId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", icon: "megaphone", link: "", is_pinned: false });
  const [editingId, setEditingId] = useState(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/coach/announcements");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", body: "", icon: "megaphone", link: "", is_pinned: false });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      const isEdit = !!editingId;
      const res = await fetch("/api/coach/announcements", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingId, ...form } : form),
      });
      if (res.ok) {
        resetForm();
        fetchAnnouncements();
      }
    } catch (err) {
      console.error("Failed to save announcement:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a) => {
    setForm({ title: a.title, body: a.body, icon: a.icon, link: a.link || "", is_pinned: a.is_pinned });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`/api/coach/announcements?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchAnnouncements();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="flex-1 bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Share updates and news with your clients</p>
        </div>
        <button
          onClick={() => { if (showForm) { resetForm(); } else { setShowForm(true); } }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors cursor-pointer"
        >
          {showForm ? "Cancel" : "+ New Announcement"}
        </button>
      </div>

      <div className="p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{editingId ? "Edit Announcement" : "New Announcement"}</h3>

              <div className="flex gap-3">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
                  <button
                    type="button"
                    onClick={() => setIconPickerOpen(!iconPickerOpen)}
                    className="w-12 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <AnnouncementIconSvg iconKey={form.icon} size={20} color="#6366f1" />
                  </button>
                  {iconPickerOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-5 gap-1 z-50 w-60">
                      {Object.entries(ANNOUNCEMENT_ICONS).map(([key, { label }]) => (
                        <button
                          key={key}
                          type="button"
                          title={label}
                          onClick={() => { setForm({ ...form, icon: key }); setIconPickerOpen(false); }}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${form.icon === key ? "bg-purple-100 ring-2 ring-purple-400" : "hover:bg-gray-100"}`}
                        >
                          <AnnouncementIconSvg iconKey={key} size={18} color={form.icon === key ? "#7c3aed" : "#6b7280"} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Announcement title"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Body</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Write your announcement..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Link (optional)</label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.is_pinned}
                    onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Pin to top
                </label>
                <button
                  type="submit"
                  disabled={saving || !form.title.trim() || !form.body.trim()}
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {saving ? "Saving..." : editingId ? "Update Announcement" : "Post Announcement"}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <AnnouncementIconSvg iconKey="megaphone" size={28} color="#9ca3af" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No announcements yet</h3>
              <p className="text-gray-500 text-sm">Create your first announcement to share updates with your clients.</p>
            </div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${a.is_pinned ? "bg-purple-100" : "bg-gray-100"}`}>
                  <AnnouncementIconSvg iconKey={a.icon} size={20} color={a.is_pinned ? "#7c3aed" : "#6b7280"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                    {a.is_pinned && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Pinned</span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{formatTimeAgo(a.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{a.body}</p>
                  {a.link && (
                    <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline mt-1 inline-flex items-center gap-1">
                      <AnnouncementIconSvg iconKey="link" size={12} color="#7c3aed" />
                      {a.link.replace(/^https?:\/\//, "").substring(0, 40)}{a.link.replace(/^https?:\/\//, "").length > 40 ? "..." : ""}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(a)}
                    className="text-gray-400 hover:text-purple-600 transition-colors p-1 cursor-pointer"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

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
      if (res.status === 401) {
        router.push("/coach/login");
        return;
      }
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
      "Joined Date",
      "Subscription",
      "Tier",
    ];
    const rows = clients.map((client) => [
      client.firstName || "",
      client.lastName || "",
      client.email || "",
      formatDate(client.userCreatedAt),
      client.subscriptionStatus === "canceled" || client.canceledAt ? "Canceled" : client.subscriptionStatus === "active" ? "Active" : client.subscriptionStatus === "trialing" ? "Trial" : client.subscriptionStatus === "past_due" ? "Past Due" : "Free",
      client.subscriptionTier ? `Tier ${client.subscriptionTier}` : "",
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
              className="flex items-center gap-2 px-4 py-2 bg-[#fbbf24] text-black rounded-lg hover:bg-[#f59e0b] transition-colors font-medium cursor-pointer"
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
              <div className="text-5xl mb-4"></div>
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
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(client.userCreatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {client.subscriptionStatus === "canceled" || client.canceledAt ? (
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Canceled</span>
                              {client.subscriptionTier && (
                                <span className="text-xs text-gray-400 ml-1">Tier {client.subscriptionTier}</span>
                              )}
                              {client.canceledAt && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {formatDate(client.canceledAt)}
                                </div>
                              )}
                            </div>
                          ) : client.subscriptionStatus === "active" || client.subscriptionStatus === "trialing" ? (
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${client.subscriptionStatus === "trialing" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                {client.subscriptionStatus === "trialing" ? "Trial" : "Active"}{client.subscriptionTier ? ` · Tier ${client.subscriptionTier}` : ""}
                              </span>
                              {client.currentPeriodEnd && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Renews {formatDate(client.currentPeriodEnd)}
                                </div>
                              )}
                            </div>
                          ) : client.subscriptionStatus === "past_due" ? (
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Past Due</span>
                              {client.subscriptionTier && (
                                <span className="text-xs text-gray-400 ml-1">Tier {client.subscriptionTier}</span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Free</span>
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

const ProfileMenu = memo(function ProfileMenu({ userName, coachSlug, onLogout }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
          {userName?.charAt(0)}
        </div>
        <span className="text-sm font-medium text-gray-900">{userName}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{userName}</p>
              <p className="text-xs text-gray-500 whitespace-nowrap">{coachSlug}</p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                window.open("/user/dashboard", "_blank");
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Try Your Companion
            </button>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
});

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSectionRaw] = useState("config");

  const initialLoadDoneRef = useRef(false);
  const loadGenRef = useRef(0);
  const [dirtyPanels, setDirtyPanels] = useState(new Set());
  const hasUnsavedChanges = dirtyPanels.size > 0;

  const markPanelDirty = (panel) => {
    if (!initialLoadDoneRef.current) return;
    setDirtyPanels((prev) => {
      if (prev.has(panel)) return prev;
      return new Set([...prev, panel]);
    });
  };
  const markPanelClean = (panel) => {
    setDirtyPanels((prev) => {
      if (!prev.has(panel)) return prev;
      const next = new Set(prev);
      next.delete(panel);
      return next;
    });
  };

  const setActiveSection = (section) => {
    if (hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Leave without saving?")) return;
      setDirtyPanels(new Set());
    }
    setActiveSectionRaw(section);
  };

  useEffect(() => {
    const saved = localStorage.getItem("coachSidebarOpen");
    if (saved !== null) setIsSidebarOpen(saved === "true");
  }, []);

  // Once user data loads, decide the landing section
  useEffect(() => {
    if (!user?.coach) return;
    if (user.coach.platform_subscription_status !== "active") {
      setActiveSection("finance");
    } else if (user.coach.stripe_account_status !== "active") {
      setActiveSection("finance");
    } else {
      setActiveSection("config");
    }
  }, [user]);

  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
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
  const [tier3PriceInput, setTier3PriceInput] = useState("");

  // Resource Hub State

  // Kit (ConvertKit) Integration State

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
      initialLoadDoneRef.current = false;
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
    }
  }, [user]);

  const isErrorToast = (msg) => /fail|error|unauthorized|invalid|must be|under \d+MB|please upload|session expired/i.test(msg);

  const handleSessionExpired = () => {
    setToastMessage("Session expired. Redirecting to login...");
    setShowToast(true);
    setTimeout(() => router.push("/coach/login"), 2000);
  };


  useEffect(() => {
    const handler = (e) => {
      if (dirtyPanels.size > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtyPanels]);

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

      if (data.user.coach) {
        posthogIdentifyIfAllowed(data.user.id, {
          email: data.user.email,
          role: "coach",
          business_name: data.user.coach.business_name,
          coach_slug: data.user.coach.slug,
          stripe_country: data.user.coach.stripe_country,
          platform_subscription_status: data.user.coach.platform_subscription_status,
        });
      }
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

  // Preview modal drag handlers — use refs to avoid re-rendering on every pixel


  // ── Resource Hub helpers ──

  // Lucide icon SVG paths for collections & content types

  // Send config updates to preview iframe — only called explicitly after save

  const handleSaveProfile = async () => {
    const currentProfile = {
      ...profileConfig,
      bio: (document.getElementById("profile-bio")?.value ?? profileConfig.bio)?.slice(0, 375),
      tagline:
        document.getElementById("profile-tagline")?.value ??
        profileConfig.tagline,
      landing_headline:
        document.getElementById("profile-landing-headline")?.value ??
        profileConfig.landing_headline,
      landing_subheadline:
        document.getElementById("profile-landing-subheadline")?.value ??
        profileConfig.landing_subheadline,
      landing_cta:
        document.getElementById("profile-landing-cta")?.value ??
        profileConfig.landing_cta,
      is_active: true,
    };

    setProfileConfig(currentProfile);

    const res = await fetch("/api/coach/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentProfile),
    });

    if (checkAuthResponse(res)) return;
    const data = await res.json();

    if (res.ok) {
      setUser((prev) => ({
        ...prev,
        coach: {
          ...prev.coach,
          ...data.coach,
        },
      }));
    } else {
      throw new Error(data.error || "Failed to update profile");
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

  // Currency symbol based on coach's Stripe country

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
          className={`border-b border-gray-200 ${isSidebarOpen ? "p-4 flex items-center justify-between" : "py-3.5 px-4 flex flex-col items-center gap-2"}`}
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
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
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
            onClick={() => setActiveSection("announcements")}
            disabled={coach?.platform_subscription_status !== "active"}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
              coach?.platform_subscription_status !== "active"
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer"
            } ${
              activeSection === "announcements"
                ? "bg-amber-100 text-amber-900 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title={
              coach?.platform_subscription_status !== "active"
                ? "Subscribe to unlock"
                : "Announcements"
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
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
            {isSidebarOpen && <span>Announcements</span>}
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

          {/* Help Center - external link */}
          <a
            href="https://daily-companion.notion.site/Daily-Companion-Coach-Hub-30a9b65a2ee5801a9708ef20c1d799a8"
            target="_blank"
            rel="noopener noreferrer"
            className="help-center-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {isSidebarOpen && (
              <span className="flex items-center gap-1.5">
                Knowledge Base
                <svg
                  className="w-3.5 h-3.5 opacity-60"
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
              </span>
            )}
          </a>
        </nav>

      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end shrink-0 relative z-30">
          <ProfileMenu userName={user?.full_name} coachSlug={coach?.slug} onLogout={handleLogout} />
        </div>

        {/* Clients Section */}
        {activeSection === "clients" && <ClientsSection />}

        {/* Announcements Section */}
        {activeSection === "announcements" && (
          <AnnouncementsSection coachId={coach?.id} />
        )}

        {/* Analytics Section */}
        {activeSection === "analytics" && <AnalyticsSection />}


        {/* Finance Section */}
        {activeSection === "finance" && (
          <FinanceSection
            user={user}
            coach={coach}
            checkAuthResponse={checkAuthResponse}
            showToast={(msg) => { setToastMessage(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }}
            profileConfig={profileConfig}
            setProfileConfig={setProfileConfig}
            tier3PriceInput={tier3PriceInput}
            setTier3PriceInput={setTier3PriceInput}
            isSavingConfig={isSavingConfig}
            setIsSavingConfig={setIsSavingConfig}
            savingSection={savingSection}
            setSavingSection={setSavingSection}
            handleSaveProfile={handleSaveProfile}
            markPanelClean={markPanelClean}
          />
        )}


        {/* Settings Section */}
        {activeSection === "settings" && (
          <SettingsSection
            checkAuthResponse={checkAuthResponse}
            showToast={(msg) => { setToastMessage(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }}
          />
        )}


        {/* Config Content */}
        {activeSection === "config" && (
          <ConfigSection
            user={user}
            coach={coach}
            checkAuthResponse={checkAuthResponse}
            showToast={(msg) => { setToastMessage(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }}
            handleSessionExpired={handleSessionExpired}
            profileConfig={profileConfig}
            setProfileConfig={setProfileConfig}
            tier3PriceInput={tier3PriceInput}
            setTier3PriceInput={setTier3PriceInput}
            isSavingConfig={isSavingConfig}
            setIsSavingConfig={setIsSavingConfig}
            savingSection={savingSection}
            setSavingSection={setSavingSection}
            handleSaveProfile={handleSaveProfile}
            markPanelDirty={markPanelDirty}
            markPanelClean={markPanelClean}
            clearDirtyPanels={() => setDirtyPanels(new Set())}
            setUser={setUser}
          />
        )}


        {/* Resource Hub Content */}
        {activeSection === "resource-hub" && (
          <ResourceHubSection
            checkAuthResponse={checkAuthResponse}
            showToast={(msg) => { setToastMessage(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }}
            profileConfig={profileConfig}
            setActiveSection={setActiveSection}
          />
        )}

      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            backgroundColor: isErrorToast(toastMessage) ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${isErrorToast(toastMessage) ? "#fecaca" : "#bbf7d0"}`,
            color: isErrorToast(toastMessage) ? "#991b1b" : "#166534",
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
        .help-center-link:hover {
          animation: helpPulse 1.5s ease-in-out infinite;
        }
        @keyframes helpPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(139, 92, 246, 0); }
        }
      `}</style>
      <HelpWidget />
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
