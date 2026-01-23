'use client';

import { useState, useEffect } from 'react';

export default function CustomDomainWizard() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDomains();
  }, []);

  async function fetchDomains() {
    try {
      const res = await fetch('/api/domains');
      const data = await res.json();
      if (res.ok) {
        setDomains(data.domains);
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDomain() {
    if (!newDomain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/domains/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add domain');
        return;
      }

      setSuccess('Domain added! Follow the instructions below to verify.');
      setNewDomain('');
      setShowAddModal(false);
      fetchDomains();
    } catch (err) {
      setError('Failed to add domain');
    } finally {
      setAdding(false);
    }
  }

  async function handleVerifyDomain(domainId) {
    setVerifying(domainId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      const data = await res.json();

      if (data.verified) {
        setSuccess(data.message);
        fetchDomains();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to verify domain');
    } finally {
      setVerifying(null);
    }
  }

  async function handleRemoveDomain(domainId) {
    if (!confirm('Are you sure you want to remove this domain?')) {
      return;
    }

    try {
      const res = await fetch('/api/domains/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      if (res.ok) {
        setSuccess('Domain removed successfully');
        fetchDomains();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to remove domain');
      }
    } catch (err) {
      setError('Failed to remove domain');
    }
  }

  function getStatusBadge(status, sslStatus) {
    const badges = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'Pending Setup' },
      verifying: { bg: '#DBEAFE', color: '#1E40AF', text: 'Verifying...' },
      verified: { bg: '#D1FAE5', color: '#065F46', text: 'Verified ✓' },
      failed: { bg: '#FEE2E2', color: '#991B1B', text: 'Failed' },
      disabled: { bg: '#F3F4F6', color: '#6B7280', text: 'Disabled' },
    };

    const badge = badges[status] || badges.pending;
    
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: badge.bg,
            color: badge.color,
          }}
        >
          {badge.text}
        </span>
        {status === 'verified' && (
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: sslStatus === 'active' ? '#D1FAE5' : '#FEF3C7',
              color: sslStatus === 'active' ? '#065F46' : '#92400E',
            }}
          >
            {sslStatus === 'active' ? 'SSL Active 🔒' : 'SSL Pending'}
          </span>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px' }}>Loading domains...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Custom Domain
          </h2>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>
            Connect your own domain to serve your coaching landing page and user experience.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              padding: '16px',
              marginBottom: '24px',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              borderRadius: '8px',
              border: '1px solid #FCA5A5',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '16px',
              marginBottom: '24px',
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              borderRadius: '8px',
              border: '1px solid #6EE7B7',
            }}
          >
            {success}
          </div>
        )}

        {/* Add Domain Button */}
        {domains.length === 0 ? (
          <div
            style={{
              padding: '60px',
              textAlign: 'center',
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              border: '2px dashed #D1D5DB',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              No custom domain configured
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '24px' }}>
              Add your custom domain to get started
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              + Add Custom Domain
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '24px',
              }}
            >
              + Add Another Domain
            </button>

            {/* Domains List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  style={{
                    padding: '24px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                        {domain.full_domain}
                      </h3>
                      {getStatusBadge(domain.status, domain.ssl_status)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {domain.status === 'pending' || domain.status === 'failed' ? (
                        <button
                          onClick={() => handleVerifyDomain(domain.id)}
                          disabled={verifying === domain.id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: verifying === domain.id ? '#9CA3AF' : '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: verifying === domain.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {verifying === domain.id ? 'Verifying...' : 'Verify'}
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleRemoveDomain(domain.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {domain.status === 'pending' || domain.status === 'failed' ? (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: '#F3F4F6',
                        borderRadius: '8px',
                        marginTop: '16px',
                      }}
                    >
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                        📋 DNS Configuration Instructions
                      </h4>
                      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
                        Add the following DNS record to your domain provider:
                      </p>
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: '#1F2937',
                          color: '#10B981',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                        }}
                      >
                        <div>Type: <span style={{ color: 'white' }}>A</span></div>
                        <div>Name: <span style={{ color: 'white' }}>{domain.subdomain || '@'}</span></div>
                        <div>Value: <span style={{ color: 'white' }}>{domain.expected_a_record}</span></div>
                        <div>TTL: <span style={{ color: 'white' }}>3600</span></div>
                      </div>
                      <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px' }}>
                        ⏱️ DNS propagation can take up to 48 hours. Click "Verify" to check status.
                      </p>
                      {domain.failed_reason && (
                        <div
                          style={{
                            marginTop: '12px',
                            padding: '12px',
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            borderRadius: '6px',
                            fontSize: '14px',
                          }}
                        >
                          ❌ {domain.failed_reason}
                        </div>
                      )}
                    </div>
                  ) : domain.status === 'verified' ? (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: '#ECFDF5',
                        borderRadius: '8px',
                        marginTop: '16px',
                      }}
                    >
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#065F46' }}>
                        ✅ Domain Active!
                      </h4>
                      <p style={{ fontSize: '14px', color: '#047857' }}>
                        Your landing page is now accessible at{' '}
                        <a
                          href={`https://${domain.full_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: '600', textDecoration: 'underline' }}
                        >
                          {domain.full_domain}
                        </a>
                      </p>
                      {domain.ssl_status === 'pending' && (
                        <p style={{ fontSize: '12px', color: '#047857', marginTop: '8px' }}>
                          🔒 SSL certificate is being issued. This may take a few minutes.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Domain Modal */}
        {showAddModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                Add Custom Domain
              </h3>
              <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                Enter your domain name (e.g., mycoach.com or coaching.mycompany.com)
              </p>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                placeholder="mycoach.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDomain}
                  disabled={adding}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: adding ? '#9CA3AF' : '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: adding ? 'not-allowed' : 'pointer',
                  }}
                >
                  {adding ? 'Adding...' : 'Add Domain'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
