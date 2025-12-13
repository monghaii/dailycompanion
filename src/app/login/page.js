'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function UserLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coachSlug = searchParams.get('coach');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      if (data.profile.role === 'coach') {
        router.push('/dashboard');
      } else if (coachSlug) {
        router.push(`/coach/${coachSlug}/dashboard`);
      } else {
        router.push('/user/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#111827',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ fontSize: '20px', fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
            <span style={{ color: '#2563eb' }}>daily</span>companion
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginTop: '24px', marginBottom: '8px', color: '#111827' }}>
            Welcome back
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 500,
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link href={coachSlug ? `/signup?coach=${coachSlug}` : '/signup'} style={{ color: '#2563eb', textDecoration: 'none' }}>Sign up</Link>
          </p>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
              Are you a coach?{' '}
              <Link href="/coach/login" style={{ color: '#2563eb', textDecoration: 'none' }}>Coach login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
