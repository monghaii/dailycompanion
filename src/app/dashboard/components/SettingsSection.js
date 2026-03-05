"use client";

import { useState } from "react";
import CustomDomainWizard from "./CustomDomainWizard";

export default function SettingsSection({ checkAuthResponse, showToast }) {
  const [kitSettings, setKitSettings] = useState({
    enabled: false,
    apiKey: "",
    formId: "",
    tags: [],
    hasApiKey: false,
    lastSync: null,
    syncStatus: null,
    errorMessage: null,
  });
  const [kitTesting, setKitTesting] = useState(false);
  const [kitTestResult, setKitTestResult] = useState(null);
  const [kitSaving, setKitSaving] = useState(false);
  const [newTag, setNewTag] = useState("");

  return (
    <div className="flex-1 bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your custom domain and account settings
        </p>
      </div>
      <div style={{ padding: "32px" }}>
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "40px",
          }}
        >
          <CustomDomainWizard />

          {/* Kit (ConvertKit) Integration */}
          <div>
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      margin: 0,
                    }}
                  >
                    Kit (ConvertKit) Integration
                  </h2>
                  <p
                    style={{
                      color: "#6B7280",
                      fontSize: "16px",
                      marginTop: "8px",
                    }}
                  >
                    Automatically sync your subscribers to your Kit email
                    list
                  </p>
                </div>
                <label
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={kitSettings.enabled}
                    onChange={(e) =>
                      setKitSettings({
                        ...kitSettings,
                        enabled: e.target.checked,
                      })
                    }
                    style={{
                      position: "absolute",
                      opacity: 0,
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      width: "44px",
                      height: "24px",
                      backgroundColor: kitSettings.enabled
                        ? "#fbbf24"
                        : "#d1d5db",
                      borderRadius: "12px",
                      position: "relative",
                      transition: "background-color 0.2s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "2px",
                        left: kitSettings.enabled ? "22px" : "2px",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#fff",
                        borderRadius: "50%",
                        transition: "left 0.2s",
                      }}
                    />
                  </div>
                </label>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {/* API Key */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Kit API Key
                </label>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginBottom: "12px",
                  }}
                >
                  Find your API key in Kit under{" "}
                  <a
                    href="https://app.kit.com/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#f59e0b",
                      textDecoration: "underline",
                    }}
                  >
                    Settings → Developer
                  </a>
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="password"
                    value={kitSettings.apiKey}
                    onChange={(e) =>
                      setKitSettings({
                        ...kitSettings,
                        apiKey: e.target.value,
                      })
                    }
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    placeholder="Enter your Kit API key"
                  />
                  <button
                    onClick={async () => {
                      if (!kitSettings.apiKey) {
                        setKitTestResult({
                          success: false,
                          error: "Please enter an API key",
                        });
                        return;
                      }
                      setKitTesting(true);
                      setKitTestResult(null);
                      try {
                        const res = await fetch("/api/coach/kit/test", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            apiKey: kitSettings.apiKey,
                          }),
                        });
                        if (checkAuthResponse(res)) return;
                        const data = await res.json();
                        setKitTestResult(data);
                      } catch (error) {
                        setKitTestResult({
                          success: false,
                          error: error.message,
                        });
                      } finally {
                        setKitTesting(false);
                      }
                    }}
                    disabled={kitTesting}
                    style={{
                      padding: "10px 16px",
                      backgroundColor: kitTesting ? "#e5e7eb" : "#f3f4f6",
                      color: "#374151",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: kitTesting ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {kitTesting ? "Testing..." : "Test Connection"}
                  </button>
                </div>

                {/* Test Result */}
                {kitTestResult && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      backgroundColor: kitTestResult.success
                        ? "#f0fdf4"
                        : "#fef2f2",
                      color: kitTestResult.success
                        ? "#166534"
                        : "#991b1b",
                      border: `1px solid ${kitTestResult.success ? "#bbf7d0" : "#fecaca"}`,
                    }}
                  >
                    {kitTestResult.success ? (
                      <div>
                        <p style={{ fontWeight: "600" }}>
                          ✓ Connection successful!
                        </p>
                        {kitTestResult.account && (
                          <p
                            style={{ fontSize: "12px", marginTop: "4px" }}
                          >
                            Connected to: {kitTestResult.account.name} (
                            {kitTestResult.account.primary_email})
                          </p>
                        )}
                      </div>
                    ) : (
                      <p>
                        ✗ {kitTestResult.error || "Connection failed"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Form ID (Optional) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Form ID (Optional)
                </label>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginBottom: "12px",
                  }}
                >
                  Subscribe users to a specific form. Leave empty to add
                  as general subscribers.
                </p>
                <input
                  type="text"
                  value={kitSettings.formId}
                  onChange={(e) =>
                    setKitSettings({
                      ...kitSettings,
                      formId: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder="e.g., 1234567"
                />
              </div>

              {/* Tags */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Tags
                </label>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginBottom: "12px",
                  }}
                >
                  Tags to apply to new subscribers. We'll automatically
                  add status and coach tags.
                </p>

                {/* Existing Tags */}
                {kitSettings.tags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    {kitSettings.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 12px",
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          borderRadius: "16px",
                          fontSize: "14px",
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = kitSettings.tags.filter(
                              (_, i) => i !== index,
                            );
                            setKitSettings({
                              ...kitSettings,
                              tags: newTags,
                            });
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#92400e",
                            cursor: "pointer",
                            padding: "0 4px",
                            fontSize: "18px",
                            lineHeight: "1",
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Tag Input */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && newTag.trim()) {
                        e.preventDefault();
                        setKitSettings({
                          ...kitSettings,
                          tags: [...kitSettings.tags, newTag.trim()],
                        });
                        setNewTag("");
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    placeholder="Enter tag name"
                  />
                  <button
                    onClick={() => {
                      if (newTag.trim()) {
                        setKitSettings({
                          ...kitSettings,
                          tags: [...kitSettings.tags, newTag.trim()],
                        });
                        setNewTag("");
                      }
                    }}
                    style={{
                      padding: "10px 16px",
                      backgroundColor: "#fef3c7",
                      color: "#92400e",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Add Tag
                  </button>
                </div>
              </div>

              {/* Sync Status */}
              {kitSettings.syncStatus && (
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Sync Status
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "14px",
                    }}
                  >
                    <p>
                      <span style={{ color: "#6b7280" }}>Status:</span>{" "}
                      <span
                        style={{
                          fontWeight: "500",
                          color:
                            kitSettings.syncStatus === "success"
                              ? "#059669"
                              : kitSettings.syncStatus === "error"
                                ? "#dc2626"
                                : "#6b7280",
                        }}
                      >
                        {kitSettings.syncStatus}
                      </span>
                    </p>
                    {kitSettings.lastSync && (
                      <p>
                        <span style={{ color: "#6b7280" }}>
                          Last Sync:
                        </span>{" "}
                        {new Date(kitSettings.lastSync).toLocaleString()}
                      </p>
                    )}
                    {kitSettings.errorMessage && (
                      <p
                        style={{
                          color: "#dc2626",
                          fontSize: "12px",
                          marginTop: "8px",
                        }}
                      >
                        {kitSettings.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  paddingTop: "16px",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <button
                  onClick={async () => {
                    setKitSaving(true);
                    try {
                      const res = await fetch("/api/coach/kit/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          kitApiKey: kitSettings.apiKey,
                          kitEnabled: kitSettings.enabled,
                          kitFormId: kitSettings.formId,
                          kitTags: kitSettings.tags,
                        }),
                      });
                      if (checkAuthResponse(res)) return;

                      const data = await res.json();

                      if (data.success) {
                        showToast("Kit settings saved successfully!");
                      } else {
                        showToast("Failed to save Kit settings");
                      }
                    } catch (error) {
                      showToast("Error saving Kit settings");
                    } finally {
                      setKitSaving(false);
                    }
                  }}
                  disabled={kitSaving}
                  style={{
                    padding: "10px 24px",
                    backgroundColor: kitSaving ? "#e5e7eb" : "#fbbf24",
                    color: "#000",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: kitSaving ? "not-allowed" : "pointer",
                    opacity: kitSaving ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!kitSaving)
                      e.currentTarget.style.backgroundColor = "#f59e0b";
                  }}
                  onMouseLeave={(e) => {
                    if (!kitSaving)
                      e.currentTarget.style.backgroundColor = "#fbbf24";
                  }}
                >
                  {kitSaving ? "Saving..." : "Save Kit Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
