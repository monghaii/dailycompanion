"use client";

import { useState, useEffect } from "react";

export default function CustomDomainWizard() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationData, setVerificationData] = useState(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  // Auto-refresh SSL status for domains with pending SSL
  useEffect(() => {
    const pendingSSLDomains = domains.filter(
      (d) => d.status === "verified" && d.ssl_status === "pending",
    );

    if (pendingSSLDomains.length === 0) return;

    // Check every 60 seconds for SSL updates
    const interval = setInterval(async () => {
      console.log("[CustomDomain] Auto-checking SSL status...");

      // Check SSL for all pending domains
      for (const domain of pendingSSLDomains) {
        try {
          const res = await fetch("/api/domains/check-ssl", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domainId: domain.id }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.updated && data.ssl_status === "active") {
              console.log(
                "[CustomDomain] SSL is now active for",
                domain.full_domain,
              );
              setSuccess(
                "SSL certificate is now active. Your domain is fully ready.",
              );
            }
          }
        } catch (error) {
          console.error("[CustomDomain] SSL check error:", error);
        }
      }

      // Refresh the full list
      fetchDomains();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [domains]);

  async function fetchDomains() {
    try {
      const res = await fetch("/api/domains");
      const data = await res.json();
      if (res.ok) {
        setDomains(data.domains);
      }
    } catch (err) {
      console.error("Failed to fetch domains:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDomain() {
    if (!newDomain.trim()) {
      setError("Please enter a domain");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/domains/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add domain");
        return;
      }

      // Show success message
      if (data.message) {
        setSuccess(data.message);
      } else {
        setSuccess("Domain added! Follow the instructions below to verify.");
      }

      setNewDomain("");
      setShowAddModal(false);

      // Refresh the domains list
      await fetchDomains();
    } catch (err) {
      setError("Failed to add domain");
    } finally {
      setAdding(false);
    }
  }

  async function handleVerifyDomain(domainId) {
    setVerifying(domainId);
    setError("");
    setSuccess("");
    setVerificationData(null);

    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });

      const data = await res.json();

      if (data.verified) {
        setSuccess(
          data.message +
            (data.ssl_status === "pending"
              ? " SSL certificate is being issued..."
              : ""),
        );
        fetchDomains();
      } else {
        setError(data.message);
        if (data.verification_needed) {
          setVerificationData(data.verification_needed);
        }
        // Refresh domains to get updated verification_method and txt_verification_code
        fetchDomains();
      }
    } catch (err) {
      setError("Failed to verify domain");
    } finally {
      setVerifying(null);
    }
  }

  async function handleRefreshStatus(domainId) {
    setVerifying(domainId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/domains/check-ssl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.ssl_status === "active") {
          setSuccess(
            "SSL certificate is now active. Your domain is fully ready.",
          );
        } else {
          setSuccess(
            "Domain is verified. SSL certificate is still being issued...",
          );
        }
        fetchDomains();
      } else {
        setError(data.error || "Failed to check SSL status");
      }
    } catch (err) {
      setError("Failed to refresh status");
    } finally {
      setVerifying(null);
    }
  }

  async function handleRemoveDomain(domainId) {
    if (!confirm("Are you sure you want to remove this domain?")) {
      return;
    }

    try {
      const res = await fetch("/api/domains/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });

      if (res.ok) {
        setSuccess("Domain removed successfully");
        fetchDomains();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to remove domain");
      }
    } catch (err) {
      setError("Failed to remove domain");
    }
  }

  function getStatusBadge(status, sslStatus) {
    const badgeClasses = {
      pending: "bg-amber-100 text-amber-800",
      verifying: "bg-blue-100 text-blue-800",
      verified: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      disabled: "bg-gray-100 text-gray-500",
    };
    const badgeLabels = {
      pending: "Pending Setup",
      verifying: "Verifying...",
      verified: "Verified",
      failed: "Failed",
      disabled: "Disabled",
    };

    const cls = badgeClasses[status] || badgeClasses.pending;
    const label = badgeLabels[status] || badgeLabels.pending;

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
          {label}
        </span>
        {status === "verified" && (
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              sslStatus === "active" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {sslStatus === "active" ? "SSL Active" : "SSL Pending"}
          </span>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
        <p className="text-sm text-gray-500">Loading domains...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Custom Domain</h2>
          {domains.some((d) => d.status === "verified" && d.ssl_status === "pending") && (
            <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              Auto-checking SSL status...
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect your own domain to serve your coaching landing page and user experience.
        </p>
      </div>

      <div className="p-6">
        {/* Alerts */}
        {error && (
          <div className="p-3 mb-4 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 mb-4 bg-green-50 text-green-800 rounded-lg border border-green-200 text-sm">
            {success}
          </div>
        )}

        {domains.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <h3 className="text-base font-semibold text-gray-900 mb-1">No custom domain configured</h3>
            <p className="text-sm text-gray-500 mb-5">Add your custom domain to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2 bg-amber-400 text-gray-900 rounded-lg text-sm font-semibold hover:bg-amber-500 transition-colors cursor-pointer"
            >
              + Add Custom Domain
            </button>
          </div>
        ) : (
          <div>
            <div className="p-3 mb-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
              Only one custom domain is allowed per coach account.
            </div>

            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{domain.full_domain}</h3>
                      {getStatusBadge(domain.status, domain.ssl_status)}
                    </div>
                    <div className="flex gap-2 items-start">
                      {domain.status === "pending" || domain.status === "failed" ? (
                        <button
                          onClick={() => handleVerifyDomain(domain.id)}
                          disabled={verifying === domain.id}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {verifying === domain.id ? "Verifying..." : "Verify"}
                        </button>
                      ) : domain.status === "verified" && domain.ssl_status === "pending" ? (
                        <button
                          onClick={() => handleRefreshStatus(domain.id)}
                          disabled={verifying === domain.id}
                          className="px-3 py-1.5 bg-amber-400 text-gray-900 rounded-lg text-sm font-semibold hover:bg-amber-500 disabled:bg-gray-400 disabled:text-white disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {verifying === domain.id ? "Checking..." : "Check SSL Status"}
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleRemoveDomain(domain.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {domain.status === "pending" || domain.status === "failed" ? (
                    <div className="p-4 bg-white rounded-lg mt-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">DNS Configuration Instructions</h4>
                      <p className="text-sm text-gray-500 mb-3">
                        Add the following DNS record to your domain provider:
                      </p>
                      <div className="p-3 bg-gray-900 text-green-400 rounded-md font-mono text-sm space-y-0.5">
                        <div>Type: <span className="text-white">A</span></div>
                        <div>Name: <span className="text-white">{domain.subdomain || "@"}</span></div>
                        <div>Value: <span className="text-white">{domain.expected_a_record}</span></div>
                        <div>TTL: <span className="text-white">3600</span></div>
                      </div>

                      {domain.verification_method === "txt" && domain.txt_verification_code && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-red-800 mb-1.5">Ownership Verification Required</p>
                          <p className="text-sm text-gray-500 mb-2">
                            This domain is currently linked to another Vercel account. Please add this TXT record to verify ownership:
                          </p>
                          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md font-mono text-sm space-y-0.5">
                            <div>Type: <strong>TXT</strong></div>
                            <div>Name: <strong>_vercel</strong></div>
                            <div className="mt-1 break-all">Value: <strong>{domain.txt_verification_code}</strong></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            After adding both the A record and TXT record, click "Verify" to complete the setup.
                          </p>
                        </div>
                      )}

                      {verificationData && !domain.txt_verification_code && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-red-800 mb-1.5">Ownership Verification Required</p>
                          <p className="text-sm text-gray-500 mb-2">
                            This domain is currently linked to another provider. Please add this TXT record to verify ownership:
                          </p>
                          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md font-mono text-sm space-y-0.5">
                            <div>Type: <strong>{verificationData.type}</strong></div>
                            <div>Name: <strong>{verificationData.name}</strong></div>
                            <div className="mt-1 break-all">Value: <strong>{verificationData.value}</strong></div>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-3">
                        DNS propagation can take up to 48 hours. Click "Verify" to check status.
                      </p>
                      {domain.failed_reason && (
                        <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-md text-sm border border-red-200">
                          {domain.failed_reason}
                        </div>
                      )}
                    </div>
                  ) : domain.status === "verified" ? (
                    <div className="p-4 bg-green-50 rounded-lg mt-3">
                      <h4 className="text-sm font-semibold text-green-800 mb-1">Domain Active</h4>
                      <p className="text-sm text-green-700">
                        Your landing page is now accessible at{" "}
                        <a
                          href={`https://${domain.full_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold underline"
                        >
                          {domain.full_domain}
                        </a>
                      </p>
                      {domain.ssl_status === "pending" && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-md">
                          <p className="text-xs font-semibold text-amber-800 mb-1">SSL Certificate Pending</p>
                          <p className="text-xs text-amber-700 mb-1">
                            Your domain is verified, but the SSL certificate is still being issued by Vercel. This typically takes 5-30 minutes.
                          </p>
                          <p className="text-xs text-amber-700 italic">
                            Tip: This page auto-refreshes every 60 seconds, or click "Check SSL Status" above to check manually.
                          </p>
                        </div>
                      )}
                      {domain.ssl_status === "active" && (
                        <p className="text-xs text-green-700 mt-2">
                          SSL certificate is active. Your domain is fully secured with HTTPS.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-[90%] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Custom Domain</h3>
            <p className="text-sm text-gray-500 mb-5">
              Enter your domain name (e.g., mycoach.com or coaching.mycompany.com)
            </p>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
              placeholder="mycoach.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-5 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                disabled={adding}
                className="px-4 py-2 bg-amber-400 text-gray-900 rounded-lg text-sm font-semibold hover:bg-amber-500 disabled:bg-gray-400 disabled:text-white disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {adding ? "Adding..." : "Add Domain"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
