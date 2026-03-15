"use client";

import { useState, useRef, useEffect } from "react";
import CustomDomainWizard from "./CustomDomainWizard";

function AccountSection({ user, checkAuthResponse, showToast, onUserUpdated }) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setAvatarUrl(user.avatar_url || null);
    }
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file");
      return;
    }

    if (file.size > 4.5 * 1024 * 1024) {
      showToast("Image must be under 4.5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (checkAuthResponse(uploadRes)) return;
      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        showToast(uploadData.error || "Failed to upload image");
        return;
      }

      const saveRes = await fetch("/api/coach/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: uploadData.url }),
      });
      if (checkAuthResponse(saveRes)) return;
      const saveData = await saveRes.json();

      if (saveData.success) {
        setAvatarUrl(uploadData.url);
        showToast("Profile picture updated");
        onUserUpdated?.();
      } else {
        showToast(saveData.error || "Failed to save profile picture");
      }
    } catch (err) {
      showToast("Error uploading image");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      showToast("Name cannot be empty");
      return;
    }

    setSavingProfile(true);
    try {
      const updates = {};
      if (fullName.trim() !== user?.full_name) updates.full_name = fullName.trim();
      if (email.trim().toLowerCase() !== user?.email) updates.email = email.trim();

      if (Object.keys(updates).length === 0) {
        showToast("No changes to save");
        setSavingProfile(false);
        return;
      }

      const res = await fetch("/api/coach/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (checkAuthResponse(res)) return;
      const data = await res.json();

      if (data.success) {
        showToast("Profile updated");
        onUserUpdated?.();
      } else {
        showToast(data.error || "Failed to update profile");
      }
    } catch (err) {
      showToast("Error updating profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showToast("Enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/coach/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (checkAuthResponse(res)) return;
      const data = await res.json();

      if (data.success) {
        showToast("Password updated");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.error || "Failed to update password");
      }
    } catch (err) {
      showToast("Error updating password");
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (fullName || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Update your personal information and credentials
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full overflow-hidden relative shrink-0 bg-blue-100 flex items-center justify-center group"
            style={{ cursor: uploadingAvatar ? "wait" : "pointer" }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-blue-700">{initials}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:cursor-not-allowed cursor-pointer"
              >
                {uploadingAvatar ? "Uploading..." : "Change photo"}
              </button>
              {avatarUrl && (
                <button
                  onClick={async () => {
                    setUploadingAvatar(true);
                    try {
                      const res = await fetch("/api/coach/account", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ avatar_url: null }),
                      });
                      if (checkAuthResponse(res)) return;
                      const data = await res.json();
                      if (data.success) {
                        setAvatarUrl(null);
                        showToast("Profile picture removed");
                        onUserUpdated?.();
                      }
                    } catch {
                      showToast("Error removing photo");
                    } finally {
                      setUploadingAvatar(false);
                    }
                  }}
                  disabled={uploadingAvatar}
                  className="px-3 py-1.5 text-red-600 text-sm font-medium hover:text-red-700 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, or GIF. Max 4.5MB.</p>
          </div>
        </div>

        {/* Name */}
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            placeholder="Your name"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="px-5 py-2 bg-amber-400 text-gray-900 rounded-lg text-sm font-semibold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Change Password */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Change Password</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="Repeat new password"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="px-5 py-2 bg-amber-400 text-gray-900 rounded-lg text-sm font-semibold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsSection({ user, checkAuthResponse, showToast, onUserUpdated }) {
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
          Manage your account, custom domain, and integrations
        </p>
      </div>

      <div className="p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <AccountSection
            user={user}
            checkAuthResponse={checkAuthResponse}
            showToast={showToast}
            onUserUpdated={onUserUpdated}
          />

          <CustomDomainWizard />

          {/* Kit (ConvertKit) Integration */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Kit (ConvertKit) Integration</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Automatically sync your subscribers to your Kit email list
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={kitSettings.enabled}
                  onChange={(e) => setKitSettings({ ...kitSettings, enabled: e.target.checked })}
                  className="absolute opacity-0 pointer-events-none"
                />
                <div
                  className={`w-11 h-6 rounded-full relative transition-colors ${kitSettings.enabled ? "bg-amber-400" : "bg-gray-300"}`}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-[left]"
                    style={{ left: kitSettings.enabled ? "22px" : "2px" }}
                  />
                </div>
              </label>
            </div>

            <div className="p-6 space-y-5">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kit API Key</label>
                <p className="text-xs text-gray-500 mb-2">
                  Find your API key in Kit under{" "}
                  <a
                    href="https://app.kit.com/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 underline hover:text-amber-700"
                  >
                    Settings &rarr; Developer
                  </a>
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={kitSettings.apiKey}
                    onChange={(e) => setKitSettings({ ...kitSettings, apiKey: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="Enter your Kit API key"
                  />
                  <button
                    onClick={async () => {
                      if (!kitSettings.apiKey) {
                        setKitTestResult({ success: false, error: "Please enter an API key" });
                        return;
                      }
                      setKitTesting(true);
                      setKitTestResult(null);
                      try {
                        const res = await fetch("/api/coach/kit/test", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ apiKey: kitSettings.apiKey }),
                        });
                        if (checkAuthResponse(res)) return;
                        const data = await res.json();
                        setKitTestResult(data);
                      } catch (error) {
                        setKitTestResult({ success: false, error: error.message });
                      } finally {
                        setKitTesting(false);
                      }
                    }}
                    disabled={kitTesting}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:cursor-not-allowed whitespace-nowrap transition-colors cursor-pointer"
                  >
                    {kitTesting ? "Testing..." : "Test Connection"}
                  </button>
                </div>

                {kitTestResult && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-sm border ${
                      kitTestResult.success
                        ? "bg-green-50 text-green-800 border-green-200"
                        : "bg-red-50 text-red-800 border-red-200"
                    }`}
                  >
                    {kitTestResult.success ? (
                      <div>
                        <p className="font-semibold">Connection successful</p>
                        {kitTestResult.account && (
                          <p className="text-xs mt-1">
                            Connected to: {kitTestResult.account.name} ({kitTestResult.account.primary_email})
                          </p>
                        )}
                      </div>
                    ) : (
                      <p>{kitTestResult.error || "Connection failed"}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Form ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form ID (Optional)</label>
                <p className="text-xs text-gray-500 mb-2">
                  Subscribe users to a specific form. Leave empty to add as general subscribers.
                </p>
                <input
                  type="text"
                  value={kitSettings.formId}
                  onChange={(e) => setKitSettings({ ...kitSettings, formId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="e.g., 1234567"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <p className="text-xs text-gray-500 mb-2">
                  Tags to apply to new subscribers. Status and coach tags are added automatically.
                </p>

                {kitSettings.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {kitSettings.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = kitSettings.tags.filter((_, i) => i !== index);
                            setKitSettings({ ...kitSettings, tags: newTags });
                          }}
                          className="text-amber-800 hover:text-amber-900 text-base leading-none cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && newTag.trim()) {
                        e.preventDefault();
                        setKitSettings({ ...kitSettings, tags: [...kitSettings.tags, newTag.trim()] });
                        setNewTag("");
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="Enter tag name"
                  />
                  <button
                    onClick={() => {
                      if (newTag.trim()) {
                        setKitSettings({ ...kitSettings, tags: [...kitSettings.tags, newTag.trim()] });
                        setNewTag("");
                      }
                    }}
                    className="px-3 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-200 whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Add Tag
                  </button>
                </div>
              </div>

              {/* Sync Status */}
              {kitSettings.syncStatus && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Sync Status</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">Status:</span>{" "}
                      <span
                        className={`font-medium ${
                          kitSettings.syncStatus === "success"
                            ? "text-green-600"
                            : kitSettings.syncStatus === "error"
                              ? "text-red-600"
                              : "text-gray-500"
                        }`}
                      >
                        {kitSettings.syncStatus}
                      </span>
                    </p>
                    {kitSettings.lastSync && (
                      <p>
                        <span className="text-gray-500">Last Sync:</span>{" "}
                        {new Date(kitSettings.lastSync).toLocaleString()}
                      </p>
                    )}
                    {kitSettings.errorMessage && (
                      <p className="text-red-600 text-xs mt-2">{kitSettings.errorMessage}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Save */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
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
                  className="px-5 py-2 bg-amber-400 text-gray-900 rounded-lg text-sm font-semibold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
