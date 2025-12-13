'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!res.ok || !data.user) {
        router.push('/login');
        return;
      }

      if (data.user.role === 'coach') {
        router.push('/dashboard');
        return;
      }

      setUser(data.user);
    } catch (error) {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/user/dashboard" className="text-xl font-semibold">
            <span className="text-blue-600">daily</span>companion
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.full_name}</span>
            <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.full_name}</p>
        </div>

        <div className="max-w-2xl">
          <div className="p-12 rounded-xl bg-white border border-gray-200 text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-2xl font-bold mb-4">No subscriptions yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't subscribed to any coaches yet. Find a coach to start your journey.
            </p>
            <p className="text-sm text-gray-500">
              If you have a coach's link, visit their page directly to subscribe.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
