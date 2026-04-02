"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Auth gate ────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid password");
      } else {
        onLogin();
      }
    } catch {
      setError("Failed to authenticate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Coaches tab ──────────────────────────────────────────────────────────────

function CoachesTab() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coaches", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoaches(data.coaches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(coachSlug, action) {
    setActionLoading(coachSlug);
    try {
      const res = await fetch("/api/admin/coaches/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ coachSlug, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoaches((prev) =>
        prev.map((c) =>
          c.slug === coachSlug
            ? {
                ...c,
                platform_subscription_status: data.coach.newStatus,
                is_active: action === "activate",
              }
            : c,
        ),
      );
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = coaches.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.slug?.toLowerCase().includes(q) ||
      c.business_name?.toLowerCase().includes(q) ||
      c.profiles?.email?.toLowerCase().includes(q)
    );
  });

  if (loading) return <TableSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{coaches.length} coaches total</p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-56"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Business</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Platform Status</th>
              <th className="px-4 py-3 text-left font-medium">Test Mode</th>
              <th className="px-4 py-3 text-left font-medium">Setup Fee</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No coaches found
                </td>
              </tr>
            )}
            {filtered.map((coach) => {
              const isActive = coach.is_active;
              const busy = actionLoading === coach.slug;
              return (
                <tr key={coach.id} className={`hover:bg-gray-50 ${isActive ? "" : "opacity-60"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {coach.slug}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {coach.business_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {coach.profiles?.email}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      active={isActive}
                      label={coach.platform_subscription_status}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Test active
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Not in test</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${coach.setup_fee_paid ? "text-green-600" : "text-gray-400"}`}
                    >
                      {coach.setup_fee_paid ? "Paid" : "Not paid"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => runAction(coach.slug, "activate")}
                        disabled={busy || isActive}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
                      >
                        {busy ? "..." : "Enable test"}
                      </button>
                      <button
                        onClick={() => runAction(coach.slug, "deactivate")}
                        disabled={busy || !isActive}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
                      >
                        {busy ? "..." : "Disable test"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(userId, action) {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, isTestPremium: data.user.isTestPremium }
            : u,
        ),
      );
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q)
    );
  });

  if (loading) return <TableSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{users.length} users total</p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-56"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Test Mode</th>
              <th className="px-4 py-3 text-left font-medium">Subscription</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            )}
            {filtered.map((user) => {
              const busy = actionLoading === user.id;
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{user.email}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {user.fullName || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {user.isTestPremium ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Test user
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Not in test</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {user.subscription ? (
                      <span>
                        {user.subscription.status} &middot; Tier {user.subscription.tier || 2}
                        {user.subscription.canceledAt ? " (canceling)" : ""}
                      </span>
                    ) : (
                      <span className="text-gray-400">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => runAction(user.id, "upgrade")}
                        disabled={busy || user.isTestPremium}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
                      >
                        {busy ? "..." : "Make test user"}
                      </button>
                      <button
                        onClick={() => runAction(user.id, "downgrade")}
                        disabled={busy || !user.isTestPremium}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-default cursor-pointer transition-colors"
                      >
                        {busy ? "..." : "Remove test"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatusBadge({ active, label }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {label}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
      <p className="text-sm text-red-600">{message}</p>
      <button
        onClick={onRetry}
        className="text-sm text-red-700 underline cursor-pointer"
      >
        Retry
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("coaches");

  // Check if already authed via cookie on mount
  useEffect(() => {
    fetch("/api/admin/coaches", { credentials: "include" })
      .then((r) => {
        if (r.ok) setAuthed(true);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/auth", {
      method: "DELETE",
      credentials: "include",
    });
    setAuthed(false);
  }

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              DailyCompanion internal tools
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {["coaches", "users"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer capitalize ${
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "coaches" ? <CoachesTab /> : <UsersTab />}
      </div>
    </div>
  );
}
