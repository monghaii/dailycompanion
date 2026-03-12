"use client";

import { useState, useEffect } from "react";

const TABS = [
  { id: "engagement", label: "Engagement" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "ai", label: "AI" },
];

const PERIOD_OPTIONS = [
  { value: 7, label: "Last 7 Days" },
  { value: 30, label: "Last 30 Days" },
  { value: 90, label: "Last 90 Days" },
];

const SECTION_ICONS = {
  focus: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
    </svg>
  ),
  awareness: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  coach: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  ),
  more: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
};

const BAR_COLORS = {
  focus: "bg-orange-400",
  awareness: "bg-blue-400",
  coach: "bg-purple-400",
  more: "bg-green-400",
};

export default function AnalyticsSection() {
  const [activeTab, setActiveTab] = useState("engagement");
  const [period, setPeriod] = useState(30);

  // Engagement state
  const [engagement, setEngagement] = useState(null);
  const [engagementLoading, setEngagementLoading] = useState(true);

  // Popular content state
  const [popularContent, setPopularContent] = useState(null);
  const [popularLoading, setPopularLoading] = useState(true);

  // AI / Token usage state
  const [tokenUsage, setTokenUsage] = useState({
    totalTokens: 0,
    subscriberCount: 0,
    averagePerUser: 0,
    tokenLimit: 1000000,
  });
  const [tokenLoading, setTokenLoading] = useState(true);

  useEffect(() => {
    fetchEngagement();
    fetchPopularContent();
  }, [period]);

  useEffect(() => {
    fetchTokenUsage();
  }, []);

  const fetchEngagement = async () => {
    setEngagementLoading(true);
    try {
      const res = await fetch(`/api/coach/analytics?days=${period}`);
      if (res.ok) {
        const data = await res.json();
        setEngagement(data);
      }
    } catch (error) {
      console.error("Failed to fetch engagement:", error);
    } finally {
      setEngagementLoading(false);
    }
  };

  const fetchPopularContent = async () => {
    setPopularLoading(true);
    try {
      const res = await fetch(`/api/coach/analytics/popular-content?days=${period}`);
      if (res.ok) {
        const data = await res.json();
        setPopularContent(data);
      }
    } catch (error) {
      console.error("Failed to fetch popular content:", error);
    } finally {
      setPopularLoading(false);
    }
  };

  const fetchTokenUsage = async () => {
    setTokenLoading(true);
    try {
      const res = await fetch("/api/coach/token-usage");
      if (res.ok) {
        const data = await res.json();
        setTokenUsage(data);
      }
    } catch (error) {
      console.error("Failed to fetch token usage:", error);
    } finally {
      setTokenLoading(false);
    }
  };

  const usagePercent = Math.min(
    ((tokenUsage.totalTokens || 0) /
      ((tokenUsage.subscriberCount || 1) *
        (tokenUsage.tokenLimit || 1000000))) *
      100,
    100,
  );

  return (
    <div className="flex-1 bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          View your coaching metrics and insights
        </p>
        <div className="flex gap-1 mt-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border border-b-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 border-gray-200"
                  : "bg-gray-50 text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">

          {/* ========== ENGAGEMENT TAB ========== */}
          {activeTab === "engagement" && (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Engagement</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Track client behavior and app usage
                  </p>
                </div>
                <select
                  value={period}
                  onChange={(e) => setPeriod(parseInt(e.target.value, 10))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white cursor-pointer"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Companion Section Usage */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Companion Section Usage
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Which parts of Companion get the most engagement?
                </p>

                {engagementLoading ? (
                  <div className="text-center py-12 text-gray-500">Loading engagement data...</div>
                ) : engagement?.sectionUsage ? (
                  <div className="space-y-6">
                    {engagement.sectionUsage.map((section) => (
                      <div key={section.key}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                              {SECTION_ICONS[section.key]}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">
                                {section.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {section.description}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {section.percent}%
                            </div>
                            <div className="text-xs text-gray-500">
                              of all actions
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full ${BAR_COLORS[section.key]} rounded-full transition-all duration-700 relative`}
                            style={{ width: `${section.percent}%`, minWidth: section.percent > 0 ? "2rem" : "0" }}
                          >
                            {section.percent > 0 && (
                              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">
                                {section.percent}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    No engagement data available yet.
                  </div>
                )}
              </div>

              {/* Popular Content */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Popular Content
                  </h3>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/coach/analytics/backfill", { method: "POST" });
                        if (res.ok) {
                          fetchPopularContent();
                        }
                      } catch (e) {
                        console.error("Backfill error:", e);
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    Rebuild data
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Most logged emotions, played audio, and viewed resources
                </p>

                {popularLoading ? (
                  <div className="text-center py-12 text-gray-500">Loading popular content...</div>
                ) : !popularContent ? (
                  <div className="text-center py-12 text-gray-400">
                    No data available yet. Click &quot;Rebuild data&quot; to backfill from existing records.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Top 20 Emotions */}
                    {popularContent.emotions?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                              <line x1="9" y1="9" x2="9.01" y2="9" />
                              <line x1="15" y1="9" x2="15.01" y2="9" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900">Top Emotions Logged</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {popularContent.emotions.map((emotion, idx) => {
                            const maxCount = popularContent.emotions[0]?.count || 1;
                            const opacity = Math.max(0.4, emotion.count / maxCount);
                            return (
                              <div
                                key={emotion.name}
                                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5"
                                style={{
                                  backgroundColor: `rgba(59, 130, 246, ${opacity * 0.15})`,
                                  borderColor: `rgba(59, 130, 246, ${opacity * 0.4})`,
                                }}
                              >
                                <span className="text-sm text-gray-800">{emotion.name}</span>
                                <span className="text-xs font-semibold text-blue-600">{emotion.count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Top 5 Audio */}
                    {popularContent.audio?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900">Top 5 Audio</h4>
                        </div>
                        <div className="space-y-2">
                          {popularContent.audio.map((item) => (
                            <div
                              key={item.path}
                              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-800">
                                  {(item.name || "Untitled").replace(/\.[^.]+$/, "")}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                  </svg>
                                  <span className="font-semibold text-gray-700">{item.plays}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#eab308" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                                  <span className="font-semibold text-gray-700">{item.favorites}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top 5 Resources */}
                    {popularContent.resources?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900">Top 5 Resources</h4>
                        </div>
                        <div className="space-y-2">
                          {popularContent.resources.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-800">
                                  {item.name || "Untitled"}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                  <span className="font-semibold text-gray-700">{item.views}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#eab308" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                                  <span className="font-semibold text-gray-700">{item.favorites}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!popularContent.emotions?.length && !popularContent.audio?.length && !popularContent.resources?.length) && (
                      <div className="text-center py-8 text-gray-400">
                        No popular content data yet. Click &quot;Rebuild data&quot; to backfill from existing records.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Habit Formation + Ongoing Engagement */}
              {engagement && !engagementLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Habit Formation */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Habit Formation
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                      How often users complete all 3 steps of Daily Focus
                    </p>
                    <div className="space-y-4">
                      {[
                        { label: "7+ days per week", value: engagement.habitFormation?.buckets?.high || 0, color: "bg-emerald-400" },
                        { label: "4-6 days per week", value: engagement.habitFormation?.buckets?.medium || 0, color: "bg-blue-400" },
                        { label: "1-3 days per week", value: engagement.habitFormation?.buckets?.low || 0, color: "bg-orange-400" },
                        { label: "Less than weekly", value: engagement.habitFormation?.buckets?.rare || 0, color: "bg-gray-400" },
                      ].map((bucket) => (
                        <div key={bucket.label}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm text-gray-700">{bucket.label}</span>
                            <span className="text-sm font-bold text-gray-900">{bucket.value}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full ${bucket.color} rounded-full transition-all duration-700`}
                              style={{ width: `${bucket.value}%`, minWidth: bucket.value > 0 ? "0.5rem" : "0" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 mt-5 pt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">Avg completion rate</span>
                      <span className="text-2xl font-bold text-gray-900">{engagement.habitFormation?.avgRate || "0"}/week</span>
                    </div>
                  </div>

                  {/* Ongoing Engagement */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Ongoing Engagement
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                      How often users take at least 1 action in Companion
                    </p>
                    <div className="space-y-4">
                      {[
                        { label: "Daily users", value: engagement.ongoingEngagement?.buckets?.high || 0, color: "bg-emerald-400" },
                        { label: "3-5x per week", value: engagement.ongoingEngagement?.buckets?.medium || 0, color: "bg-blue-400" },
                        { label: "1-2x per week", value: engagement.ongoingEngagement?.buckets?.low || 0, color: "bg-orange-400" },
                        { label: "Less than weekly", value: engagement.ongoingEngagement?.buckets?.rare || 0, color: "bg-gray-400" },
                      ].map((bucket) => (
                        <div key={bucket.label}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm text-gray-700">{bucket.label}</span>
                            <span className="text-sm font-bold text-gray-900">{bucket.value}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full ${bucket.color} rounded-full transition-all duration-700`}
                              style={{ width: `${bucket.value}%`, minWidth: bucket.value > 0 ? "0.5rem" : "0" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 mt-5 pt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">Avg active sessions</span>
                      <span className="text-2xl font-bold text-gray-900">{engagement.ongoingEngagement?.avgRate || "0"}/week</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== SUBSCRIPTIONS TAB ========== */}
          {activeTab === "subscriptions" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Subscriptions</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Track signups, conversions, and churn
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Coming Soon
                </h3>
                <p className="text-gray-600">
                  Subscription analytics with signup-to-paid conversion rates,
                  churn tracking, and revenue trends.
                </p>
              </div>
            </div>
          )}

          {/* ========== AI TAB ========== */}
          {activeTab === "ai" && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">AI Coach</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Monitor AI token usage across your subscribers
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Token Usage
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Monthly usage across all paid subscribers
                </p>

                {tokenLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Total tokens used this month
                      </span>
                      <span className="font-semibold text-gray-900">
                        {(tokenUsage.totalTokens || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-purple-500 to-purple-600 transition-all duration-500"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-500 mb-1">
                          Paid Subscribers
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {tokenUsage.subscriberCount || 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-500 mb-1">
                          Avg. per User
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {(tokenUsage.averagePerUser || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Each user has a limit of{" "}
                      {(tokenUsage.tokenLimit || 1000000).toLocaleString()} tokens
                      per month. Usage resets automatically at the beginning of each
                      month. Only users with a paid plan (Premium or higher) can use the
                      AI Coach.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
