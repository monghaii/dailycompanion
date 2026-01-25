'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CoachSignup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    businessName: '',
    slug: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'businessName') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'coach' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // After successful signup, redirect to Stripe checkout
      if (data.requiresSubscription) {
        // Create checkout session and redirect to Stripe
        const checkoutRes = await fetch('/api/stripe/coach-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const checkoutData = await checkoutRes.json();

        if (checkoutRes.ok && checkoutData.url) {
          // Redirect to Stripe checkout
          window.location.href = checkoutData.url;
        } else {
          // Fallback to dashboard if checkout creation fails
          router.push('/dashboard?subscription=pending');
        }
      } else {
        router.push('/dashboard?welcome=true');
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
            Start your coaching journey
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Create your coach account and launch your platform
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Jane Smith"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="jane@example.com"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Business Name</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Jane's Fitness Coaching"
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Your URL</label>
            <div style={{ display: 'flex' }}>
              <span style={{
                padding: '12px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
                fontSize: '14px',
                color: '#6b7280',
                whiteSpace: 'nowrap'
              }}>
                dailycompanion.com/coach/
              </span>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                style={{ ...inputStyle, borderRadius: '0 8px 8px 0' }}
                placeholder="jane-fitness"
                pattern="[a-z0-9-]+"
                required
              />
            </div>
            <p style={{ marginTop: '6px', fontSize: '12px', color: '#9ca3af' }}>
              Only lowercase letters, numbers, and hyphens
            </p>
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
            {isLoading ? 'Creating Account...' : 'Create Coach Account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
            Already have an account?{' '}
            <Link href="/coach/login" style={{ color: '#2563eb', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
          By signing up, you agree to our Terms of Service and Privacy Policy.
          <br />
          After signup, you'll be asked to subscribe ($50/mo or $500/yr).
        </p>
      </div>
    </div>
  );
}
