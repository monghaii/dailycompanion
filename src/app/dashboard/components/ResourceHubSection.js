"use client";

import { useState, useEffect } from "react";
import posthog from "posthog-js";

export default function ResourceHubSection({ checkAuthResponse, showToast, profileConfig, setActiveSection }) {
  const [rhCollections, setRhCollections] = useState([]);
  const [rhContentItems, setRhContentItems] = useState([]);
  const [rhLoading, setRhLoading] = useState(false);
  const [rhEditing, setRhEditing] = useState(null);
  const [rhEditCollection, setRhEditCollection] = useState(null);
  const [rhEditItems, setRhEditItems] = useState([]);
  const [rhContentFilter, setRhContentFilter] = useState("");
  const [rhContentTypeFilter, setRhContentTypeFilter] = useState("all");
  const [rhShowAddContent, setRhShowAddContent] = useState(false);
  const [rhSaving, setRhSaving] = useState(false);
  const [rhDragItem, setRhDragItem] = useState(null);
  const [rhDragOverIndex, setRhDragOverIndex] = useState(null);
  const [rhUploadingContent, setRhUploadingContent] = useState(false);
  const [rhIconPickerOpen, setRhIconPickerOpen] = useState(false);

  const COLLECTION_ICONS = {
    folder: {
      label: "Folder",
      path: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
    },
    book: {
      label: "Book",
      path: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 004 17V5a2 2 0 012-2h14v14H6.5",
    },
    "book-open": {
      label: "Book Open",
      paths: [
        "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z",
        "M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
      ],
    },
    lightbulb: {
      label: "Lightbulb",
      paths: [
        "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 006 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
        "M9 18h6",
        "M10 22h4",
      ],
    },
    star: {
      label: "Star",
      path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    },
    heart: {
      label: "Heart",
      path: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    },
    compass: {
      label: "Compass",
      paths: [
        "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
        "M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z",
      ],
    },
    target: {
      label: "Target",
      paths: [
        "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
        "M12 18a6 6 0 100-12 6 6 0 000 12z",
        "M12 14a2 2 0 100-4 2 2 0 000 4z",
      ],
    },
    zap: { label: "Energy", path: "M13 2L3 14h9l-1 10 10-12h-9l1-10z" },
    flame: {
      label: "Flame",
      path: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z",
    },
    brain: {
      label: "Brain",
      paths: [
        "M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 011.98-3L9.5 2z",
        "M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-1.98-3L14.5 2z",
      ],
    },
    trophy: {
      label: "Trophy",
      paths: [
        "M6 9H4.5a2.5 2.5 0 010-5H6",
        "M18 9h1.5a2.5 2.5 0 000-5H18",
        "M4 22h16",
        "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22",
        "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22",
        "M18 2H6v7a6 6 0 0012 0V2z",
      ],
    },
    award: {
      label: "Award",
      paths: [
        "M12 15a7 7 0 100-14 7 7 0 000 14z",
        "M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
      ],
    },
    music: {
      label: "Music",
      paths: [
        "M9 18V5l12-2v13",
        "M9 18a3 3 0 11-6 0 3 3 0 016 0z",
        "M21 16a3 3 0 11-6 0 3 3 0 016 0z",
      ],
    },
    headphones: {
      label: "Headphones",
      paths: [
        "M3 18v-6a9 9 0 0118 0v6",
        "M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z",
        "M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z",
      ],
    },
    video: {
      label: "Video",
      paths: [
        "M23 7l-7 5 7 5V7z",
        "M1 5a2 2 0 012-2h11a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5z",
      ],
    },
    "file-text": {
      label: "Document",
      paths: [
        "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z",
        "M14 2v6h6",
        "M16 13H8",
        "M16 17H8",
        "M10 9H8",
      ],
    },
    "clipboard-list": {
      label: "Checklist",
      paths: [
        "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2",
        "M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z",
        "M12 11h4",
        "M12 16h4",
        "M8 11h.01",
        "M8 16h.01",
      ],
    },
    sun: {
      label: "Sun",
      paths: [
        "M12 16a4 4 0 100-8 4 4 0 000 8z",
        "M12 2v2",
        "M12 20v2",
        "M4.93 4.93l1.41 1.41",
        "M17.66 17.66l1.41 1.41",
        "M2 12h2",
        "M20 12h2",
        "M6.34 17.66l-1.41 1.41",
        "M19.07 4.93l-1.41 1.41",
      ],
    },
    moon: {
      label: "Moon",
      path: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    },
    cloud: {
      label: "Cloud",
      path: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z",
    },
    mountain: { label: "Mountain", paths: ["M8 3l4 8 5-5 5 15H2L8 3z"] },
    leaf: {
      label: "Leaf",
      paths: [
        "M11 20A7 7 0 019.8 6.9C15.5 4.9 20 1 20 1s-4 5.5-2 11.1A7 7 0 0111 20z",
        "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",
      ],
    },
    dumbbell: {
      label: "Fitness",
      paths: [
        "M14.4 14.4L9.6 9.6",
        "M18.657 21.485l2.828-2.828-3.535-3.536-2.829 2.829",
        "M2.515 5.343L5.343 2.515l3.536 3.535-2.829 2.829",
        "M7.757 16.243l2.829-2.829 5.656 5.657-2.828 2.828",
        "M16.243 7.757l2.829-2.829-5.657-5.656-2.828 2.828",
      ],
    },
    sparkles: {
      label: "Sparkles",
      paths: [
        "M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.963 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.581a.5.5 0 010 .964L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.963 0z",
        "M20 3v4",
        "M22 5h-4",
        "M4 17v2",
        "M5 18H3",
      ],
    },
    rocket: {
      label: "Rocket",
      paths: [
        "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z",
        "M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z",
        "M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0",
        "M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3",
      ],
    },
    users: {
      label: "Community",
      paths: [
        "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2",
        "M9 11a4 4 0 100-8 4 4 0 000 8z",
        "M23 21v-2a4 4 0 00-3-3.87",
        "M16 3.13a4 4 0 010 7.75",
      ],
    },
    "message-circle": {
      label: "Discussion",
      path: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
    },
    palette: {
      label: "Creative",
      paths: [
        "M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10c0 .926-.126 1.821-.361 2.671A4 4 0 0115 18H13a2 2 0 00-1 3.75A10 10 0 0012 22z",
        "M8.5 9.5v.01",
        "M12 7.5v.01",
        "M15.5 9.5v.01",
        "M7.5 13v.01",
      ],
    },
    lock: {
      label: "Private",
      paths: [
        "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z",
        "M7 11V7a5 5 0 0110 0v4",
      ],
    },
    globe: {
      label: "Global",
      paths: [
        "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
        "M2 12h20",
        "M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
      ],
    },
    calendar: {
      label: "Schedule",
      paths: [
        "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z",
        "M16 2v4",
        "M8 2v4",
        "M3 10h18",
      ],
    },
    clock: {
      label: "Timed",
      paths: [
        "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
        "M12 6v6l4 2",
      ],
    },
    "shield-check": {
      label: "Wellness",
      paths: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M9 12l2 2 4-4"],
    },
    gem: {
      label: "Premium",
      paths: [
        "M6 3h12l4 6-10 13L2 9z",
        "M11 3l1 10",
        "M2 9h20",
        "M6.5 3L11 9.5",
        "M17.5 3L13 9.5",
      ],
    },
  };

  const renderCollectionIcon = (iconKey, size = 24, color = "#6b7280") => {
    const icon = COLLECTION_ICONS[iconKey];
    if (!icon)
      return <span style={{ fontSize: size, lineHeight: 1 }}>{iconKey}</span>;
    const pathData = icon.paths || (icon.path ? [icon.path] : []);
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {pathData.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  };

  const CONTENT_TYPE_ICONS = {
    video: {
      paths: [
        "M23 7l-7 5 7 5V7z",
        "M1 5a2 2 0 012-2h11a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5z",
      ],
    },
    audio: {
      paths: [
        "M3 18v-6a9 9 0 0118 0v6",
        "M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z",
        "M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z",
      ],
    },
    pdf: {
      paths: [
        "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z",
        "M14 2v6h6",
        "M16 13H8",
        "M16 17H8",
        "M10 9H8",
      ],
    },
  };

  const renderContentTypeIcon = (type, size = 18, color) => {
    const colors = { video: "#2563eb", audio: "#be185d", pdf: "#92400e" };
    const c = color || colors[type] || "#6b7280";
    const icon = CONTENT_TYPE_ICONS[type];
    if (!icon) return null;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  };

  const getContentTypeIcon = (type) => renderContentTypeIcon(type, 20);

  const getContentTypeBadgeColor = (type) => {
    switch (type) {
      case "video":
        return { bg: "#dbeafe", text: "#1d4ed8" };
      case "audio":
        return { bg: "#fce7f3", text: "#be185d" };
      case "pdf":
        return { bg: "#fef3c7", text: "#92400e" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const fetchRhCollections = async () => {
    try {
      const res = await fetch("/api/resource-hub/collections");
      if (checkAuthResponse(res)) return;
      if (res.ok) {
        const data = await res.json();
        setRhCollections(data.collections || []);
      }
    } catch (e) {
      console.error("Failed to fetch collections:", e);
    }
  };

  const fetchRhContent = async () => {
    try {
      const res = await fetch("/api/resource-hub/content");
      if (checkAuthResponse(res)) return;
      if (res.ok) {
        const data = await res.json();
        setRhContentItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch content:", e);
    }
  };

  const loadResourceHub = async () => {
    setRhLoading(true);
    await Promise.all([fetchRhCollections(), fetchRhContent()]);
    setRhLoading(false);
  };

  useEffect(() => {
    loadResourceHub();
  }, []);

  const openCollectionEditor = async (collectionId) => {
    setRhEditing(collectionId);
    try {
      const res = await fetch(`/api/resource-hub/collections/${collectionId}`);
      if (checkAuthResponse(res)) return;
      if (res.ok) {
        const data = await res.json();
        setRhEditCollection(data.collection);
        setRhEditItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to load collection:", e);
    }
  };

  const handleCreateCollection = async () => {
    try {
      const res = await fetch("/api/resource-hub/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Collection" }),
      });
      if (checkAuthResponse(res)) return;
      if (res.ok) {
        const data = await res.json();
        await fetchRhCollections();
        openCollectionEditor(data.collection.id);
      }
    } catch (e) {
      console.error("Failed to create collection:", e);
    }
  };

  const handleDeleteCollection = async (id) => {
    if (!confirm("Delete this collection? This cannot be undone.")) return;
    try {
      const delRes = await fetch(`/api/resource-hub/collections/${id}`, {
        method: "DELETE",
      });
      if (checkAuthResponse(delRes)) return;
      setRhCollections((prev) => prev.filter((c) => c.id !== id));
      if (rhEditing === id) {
        setRhEditing(null);
        setRhEditCollection(null);
        setRhEditItems([]);
      }
    } catch (e) {
      console.error("Failed to delete collection:", e);
    }
  };

  const handleSaveCollection = async () => {
    if (!rhEditCollection) return;
    setRhSaving(true);
    try {
      const title =
        document.getElementById("rh-col-title")?.value ||
        rhEditCollection.title;
      const description = document.getElementById("rh-col-desc")?.value || "";
      const icon = rhEditCollection.icon || "folder";

      const metaRes = await fetch(
        `/api/resource-hub/collections/${rhEditCollection.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            icon,
            delivery_mode: rhEditCollection.delivery_mode,
            is_published: rhEditCollection.is_published,
          }),
        },
      );

      if (checkAuthResponse(metaRes)) return;

      setRhEditCollection((prev) => ({ ...prev, title, description, icon }));

      const itemsPayload = rhEditItems.map((item) => ({
        item_type: item.item_type,
        content_item_id:
          item.item_type === "content"
            ? item.content_item_id || item.content_item?.id
            : null,
        pause_days: item.item_type === "pause" ? item.pause_days || 1 : null,
      }));

      const res = await fetch(
        `/api/resource-hub/collections/${rhEditCollection.id}/items`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsPayload }),
        },
      );

      if (checkAuthResponse(res)) return;

      if (res.ok) {
        const data = await res.json();
        setRhEditItems(data.items || []);
      }

      await fetchRhCollections();
      showToast("Collection saved!");
      posthog.capture("coach_collection_saved", {
        collection_id: rhEditCollection.id,
        item_count: rhEditItems.length,
      });
    } catch (e) {
      console.error("Failed to save collection:", e);
    }
    setRhSaving(false);
  };

  const handleAddContentItem = async (formData) => {
    setRhUploadingContent(true);
    try {
      let fileUrl = null;
      let fileSize = null;

      if (formData.link_url) {
        // Link mode — no file upload needed
      } else if (formData.file) {
        const uploadForm = new FormData();
        uploadForm.append("file", formData.file);
        uploadForm.append(
          "type",
          formData.type === "pdf"
            ? "pdf"
            : formData.type === "video"
              ? "video"
              : "audio",
        );

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (checkAuthResponse(uploadRes)) return;
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          alert("Upload failed: " + (err.error || "Unknown error"));
          setRhUploadingContent(false);
          return;
        }
        const uploadData = await uploadRes.json();
        fileUrl = uploadData.url;
        fileSize = formData.file.size;
      }

      const res = await fetch("/api/resource-hub/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          description: formData.description || null,
          duration: formData.duration || null,
          file_url: fileUrl,
          file_size: fileSize,
          link_url: formData.link_url || null,
        }),
      });

      if (checkAuthResponse(res)) return;

      if (res.ok) {
        await fetchRhContent();
        setRhShowAddContent(false);
        showToast("Content added!");
        posthog.capture("coach_content_added", {
          content_type: formData.type,
          is_external_link: !!formData.link_url,
        });
      }
    } catch (e) {
      console.error("Failed to add content:", e);
      alert("Failed to add content");
    }
    setRhUploadingContent(false);
  };

  const handleDeleteContentItem = async (id) => {
    if (!confirm("Delete this content item?")) return;
    try {
      const delRes = await fetch(`/api/resource-hub/content/${id}`, {
        method: "DELETE",
      });
      if (checkAuthResponse(delRes)) return;
      setRhContentItems((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Failed to delete content:", e);
    }
  };

  const rhFilteredContent = rhContentItems.filter((item) => {
    const matchesSearch =
      !rhContentFilter ||
      item.title.toLowerCase().includes(rhContentFilter.toLowerCase());
    const matchesType =
      rhContentTypeFilter === "all" || item.type === rhContentTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
          <>
            {rhEditing ? (
              /* ── Collection Editor ── */
              <div
                key={rhEditing}
                className="flex h-full"
                style={{ minHeight: "calc(100vh - 64px)" }}
              >
                {/* Left: Collection items */}
                <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden">
                  {/* Editor Header */}
                  <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => {
                          setRhEditing(null);
                          setRhEditCollection(null);
                          setRhEditItems([]);
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <div className="flex-1">
                        <input
                          id="rh-col-title"
                          type="text"
                          defaultValue={rhEditCollection?.title || ""}
                          className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none w-full"
                          placeholder="Collection Title"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 relative">
                        <label className="text-sm text-gray-500">Icon</label>
                        <button
                          type="button"
                          onClick={() => setRhIconPickerOpen((v) => !v)}
                          className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:border-amber-400 transition-colors bg-white"
                        >
                          {renderCollectionIcon(
                            rhEditCollection?.icon || "folder",
                            22,
                            "#374151",
                          )}
                        </button>
                        {rhIconPickerOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setRhIconPickerOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 w-72 max-h-64 overflow-y-auto">
                              <div className="grid grid-cols-6 gap-1">
                                {Object.entries(COLLECTION_ICONS).map(
                                  ([key, icon]) => (
                                    <button
                                      key={key}
                                      type="button"
                                      title={icon.label}
                                      onClick={() => {
                                        setRhEditCollection((prev) => ({
                                          ...prev,
                                          icon: key,
                                        }));
                                        setRhIconPickerOpen(false);
                                      }}
                                      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${rhEditCollection?.icon === key ? "bg-amber-100 border border-amber-400" : "hover:bg-gray-100"}`}
                                    >
                                      {renderCollectionIcon(
                                        key,
                                        20,
                                        rhEditCollection?.icon === key
                                          ? "#d97706"
                                          : "#4b5563",
                                      )}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500">
                          Description
                        </label>
                        <input
                          id="rh-col-desc"
                          type="text"
                          defaultValue={rhEditCollection?.description || ""}
                          className="text-sm text-gray-700 bg-transparent border border-gray-200 rounded-lg px-3 py-1.5 w-64 outline-none focus:border-amber-400"
                          placeholder="Short description..."
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-gray-500">
                          Self-Paced
                        </span>
                        <button
                          onClick={() =>
                            setRhEditCollection((prev) => ({
                              ...prev,
                              delivery_mode:
                                prev.delivery_mode === "self_paced"
                                  ? "drip"
                                  : "self_paced",
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rhEditCollection?.delivery_mode === "drip" ? "bg-amber-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${rhEditCollection?.delivery_mode === "drip" ? "translate-x-6" : "translate-x-1"}`}
                          />
                        </button>
                        <span className="text-sm text-gray-500">Drip</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                        <button
                          onClick={() =>
                            setRhEditCollection((prev) => ({
                              ...prev,
                              is_published: !prev.is_published,
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rhEditCollection?.is_published ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${rhEditCollection?.is_published ? "translate-x-6" : "translate-x-1"}`}
                          />
                        </button>
                        <span
                          className={`text-sm font-medium ${rhEditCollection?.is_published ? "text-green-600" : "text-gray-400"}`}
                        >
                          {rhEditCollection?.is_published
                            ? "Published"
                            : "Draft"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {rhEditItems.length === 0 ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "copy";
                          setRhDragOverIndex(0);
                        }}
                        onDragLeave={() => setRhDragOverIndex(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setRhDragOverIndex(null);
                          if (rhDragItem && rhDragItem.source === "library") {
                            setRhEditItems([
                              {
                                id: `temp-${Date.now()}`,
                                item_type: "content",
                                content_item_id: rhDragItem.item.id,
                                content_item: rhDragItem.item,
                                sort_order: 0,
                              },
                            ]);
                            setRhDragItem(null);
                          }
                        }}
                        className={`flex flex-col items-center justify-center h-full rounded-xl border-2 border-dashed transition-all ${rhDragOverIndex === 0 ? "border-purple-400 bg-purple-50 text-purple-500" : "border-transparent text-gray-400"}`}
                      >
                        <svg
                          className="w-16 h-16 mb-4 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        <p className="text-lg font-medium">
                          {rhDragOverIndex === 0
                            ? "Drop here!"
                            : "No items yet"}
                        </p>
                        <p className="text-sm mt-1">
                          Drag content from the library on the right
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rhEditItems.map((item, index) => (
                          <div key={item.id || `new-${index}`}>
                            {/* Drop zone above item */}
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "copy";
                                setRhDragOverIndex(index);
                              }}
                              onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget))
                                  setRhDragOverIndex(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                setRhDragOverIndex(null);
                                if (rhDragItem) {
                                  if (rhDragItem.source === "library") {
                                    const newItem = {
                                      id: `temp-${Date.now()}`,
                                      item_type: "content",
                                      content_item_id: rhDragItem.item.id,
                                      content_item: rhDragItem.item,
                                      sort_order: index,
                                    };
                                    setRhEditItems((prev) => {
                                      const next = [...prev];
                                      next.splice(index, 0, newItem);
                                      return next;
                                    });
                                  } else if (rhDragItem.source === "reorder") {
                                    setRhEditItems((prev) => {
                                      const next = [...prev];
                                      const [moved] = next.splice(
                                        rhDragItem.fromIndex,
                                        1,
                                      );
                                      const targetIndex =
                                        rhDragItem.fromIndex < index
                                          ? index - 1
                                          : index;
                                      next.splice(targetIndex, 0, moved);
                                      return next;
                                    });
                                  }
                                  setRhDragItem(null);
                                }
                              }}
                              style={{
                                minHeight:
                                  rhDragOverIndex === index ? "48px" : "8px",
                              }}
                              className={`rounded transition-all flex items-center justify-center ${rhDragOverIndex === index ? "bg-purple-100 border-2 border-dashed border-purple-400" : rhDragItem ? "border-2 border-dashed border-transparent hover:border-purple-300 hover:bg-purple-50" : ""}`}
                            >
                              {rhDragOverIndex === index && (
                                <span className="text-xs text-purple-500 font-medium">
                                  Drop here
                                </span>
                              )}
                            </div>

                            {item.item_type === "pause" ? (
                              /* Pause marker */
                              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                                <svg
                                  className="w-5 h-5 text-amber-500 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="text-sm font-medium text-amber-700">
                                  Wait
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.pause_days || 1}
                                  onChange={(e) => {
                                    const days = parseInt(e.target.value) || 1;
                                    setRhEditItems((prev) =>
                                      prev.map((it, i) =>
                                        i === index
                                          ? { ...it, pause_days: days }
                                          : it,
                                      ),
                                    );
                                  }}
                                  className="w-16 text-center border border-amber-300 rounded px-2 py-1 text-sm bg-white"
                                />
                                <span className="text-sm text-amber-700">
                                  day{(item.pause_days || 1) !== 1 ? "s" : ""}{" "}
                                  before next content
                                </span>
                                <button
                                  onClick={() =>
                                    setRhEditItems((prev) =>
                                      prev.filter((_, i) => i !== index),
                                    )
                                  }
                                  className="ml-auto p-1 text-amber-400 hover:text-red-500 transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              /* Content item */
                              <div
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData(
                                    "text/plain",
                                    index.toString(),
                                  );
                                  e.dataTransfer.effectAllowed = "move";
                                  setRhDragItem({
                                    source: "reorder",
                                    fromIndex: index,
                                  });
                                }}
                                onDragEnd={() => {
                                  setRhDragItem(null);
                                  setRhDragOverIndex(null);
                                }}
                                className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:shadow-sm transition-shadow cursor-grab active:cursor-grabbing"
                              >
                                <svg
                                  className="w-5 h-5 text-gray-300 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 8h16M4 16h16"
                                  />
                                </svg>
                                <span className="text-lg flex-shrink-0">
                                  {getContentTypeIcon(item.content_item?.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {item.content_item?.title || "Unknown"}
                                  </p>
                                  {item.content_item?.duration && (
                                    <p className="text-xs text-gray-500">
                                      {item.content_item.duration}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor: getContentTypeBadgeColor(
                                      item.content_item?.type,
                                    ).bg,
                                    color: getContentTypeBadgeColor(
                                      item.content_item?.type,
                                    ).text,
                                  }}
                                >
                                  {item.content_item?.type}
                                </span>
                                <button
                                  onClick={() =>
                                    setRhEditItems((prev) =>
                                      prev.filter((_, i) => i !== index),
                                    )
                                  }
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Final drop zone */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "copy";
                            setRhDragOverIndex(rhEditItems.length);
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget))
                              setRhDragOverIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setRhDragOverIndex(null);
                            if (rhDragItem) {
                              if (rhDragItem.source === "library") {
                                const newItem = {
                                  id: `temp-${Date.now()}`,
                                  item_type: "content",
                                  content_item_id: rhDragItem.item.id,
                                  content_item: rhDragItem.item,
                                  sort_order: rhEditItems.length,
                                };
                                setRhEditItems((prev) => [...prev, newItem]);
                              } else if (rhDragItem.source === "reorder") {
                                setRhEditItems((prev) => {
                                  const next = [...prev];
                                  const [moved] = next.splice(
                                    rhDragItem.fromIndex,
                                    1,
                                  );
                                  next.push(moved);
                                  return next;
                                });
                              }
                              setRhDragItem(null);
                            }
                          }}
                          style={{
                            minHeight:
                              rhDragOverIndex === rhEditItems.length
                                ? "48px"
                                : "32px",
                          }}
                          className={`rounded transition-all flex items-center justify-center ${rhDragOverIndex === rhEditItems.length ? "bg-purple-100 border-2 border-dashed border-purple-400" : rhDragItem ? "border-2 border-dashed border-transparent hover:border-purple-300 hover:bg-purple-50" : ""}`}
                        >
                          {rhDragOverIndex === rhEditItems.length && (
                            <span className="text-xs text-purple-500 font-medium">
                              Drop here
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Add Pause button (drip mode only) */}
                    {rhEditCollection?.delivery_mode === "drip" &&
                      rhEditItems.length > 0 && (
                        <button
                          onClick={() => {
                            setRhEditItems((prev) => [
                              ...prev,
                              {
                                id: `pause-${Date.now()}`,
                                item_type: "pause",
                                pause_days: 1,
                                sort_order: prev.length,
                              },
                            ]);
                          }}
                          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Add Day Pause
                        </button>
                      )}
                  </div>

                  {/* Editor footer */}
                  <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                    <button
                      onClick={() =>
                        handleDeleteCollection(rhEditCollection?.id)
                      }
                      className="text-sm text-red-500 hover:text-red-700 transition-colors"
                      disabled={rhSaving}
                    >
                      Delete Collection
                    </button>
                    <button
                      onClick={handleSaveCollection}
                      disabled={rhSaving}
                      className="px-6 py-2 text-sm font-semibold text-black bg-[#fbbf24] rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rhSaving ? "Saving..." : "Save Collection"}
                    </button>
                  </div>
                </div>

                {/* Right: Content Library Panel */}
                <div className="w-80 flex flex-col bg-white overflow-hidden">
                  <div className="px-4 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Content Library
                      </h3>
                      <button
                        onClick={() => setRhShowAddContent(true)}
                        className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        + Add New
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Search content..."
                      value={rhContentFilter}
                      onChange={(e) => setRhContentFilter(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mb-2 outline-none focus:border-amber-400"
                    />
                    <select
                      value={rhContentTypeFilter}
                      onChange={(e) => setRhContentTypeFilter(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-amber-400 bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {rhFilteredContent.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">
                        {rhContentItems.length === 0
                          ? "No content yet. Add some!"
                          : "No matches found."}
                      </p>
                    ) : (
                      rhFilteredContent.map((item) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", item.id);
                            e.dataTransfer.effectAllowed = "copy";
                            setRhDragItem({ source: "library", item });
                          }}
                          onDragEnd={() => {
                            setRhDragItem(null);
                            setRhDragOverIndex(null);
                          }}
                          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-amber-300 hover:bg-amber-50 transition-colors"
                        >
                          <span className="text-base flex-shrink-0">
                            {getContentTypeIcon(item.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2">
                              {item.duration && (
                                <p className="text-xs text-gray-400">
                                  {item.duration}
                                </p>
                              )}
                              {item.link_url && (
                                <span className="text-xs text-blue-500">
                                  Link
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContentItem(item.id);
                            }}
                            className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                            title="Delete content"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Collections List View ── */
              <>
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                  {!profileConfig.tier3_enabled && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-4 flex items-center gap-3">
                      <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-sm text-amber-800">
                        <span className="font-medium">Resource Hub is not live for clients yet.</span>{" "}
                        Enable Tier 3 in{" "}
                        <button onClick={() => setActiveSection("finance")} className="underline font-medium cursor-pointer bg-transparent border-none text-amber-800 p-0">Finance Settings</button>
                        {" "}to make it accessible.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Resource Hub
                      </h1>
                      <p className="text-gray-600 mt-1">
                        Organize your content into themed collections
                      </p>
                    </div>
                    <button
                      onClick={handleCreateCollection}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black bg-[#fbbf24] rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Collection
                    </button>
                  </div>
                </div>

                <div className="px-8 pt-4">
                  <div className="max-w-4xl mx-auto bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800">
                      Content here is exclusive to your <span className="font-semibold">Tier 3 subscribers</span> only — your highest-paying members. Use this to deliver premium videos, audio, and PDFs.
                    </p>
                  </div>
                </div>

                <div className="p-8">
                  <div className="max-w-4xl mx-auto">
                    {rhLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : rhCollections.length === 0 ? (
                      <div className="text-center py-20">
                        <svg
                          className="w-16 h-16 mx-auto mb-4 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">
                          No collections yet
                        </p>
                        <p className="text-gray-400 mt-1">
                          Click &quot;Add Collection&quot; to create your first
                          themed resource collection.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rhCollections.map((col) => (
                          <div
                            key={col.id}
                            onClick={() => openCollectionEditor(col.id)}
                            className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-6 py-4 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer"
                          >
                            <span className="flex-shrink-0">
                              {renderCollectionIcon(col.icon, 28, "#6b7280")}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900">
                                {col.title}
                              </h3>
                              {col.description && (
                                <p className="text-sm text-gray-500 truncate">
                                  {col.description}
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full ${col.delivery_mode === "drip" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
                            >
                              {col.delivery_mode === "drip"
                                ? "Drip"
                                : "Self-Paced"}
                            </span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                            >
                              {col.is_published ? "Live" : "Draft"}
                            </span>
                            <span className="text-sm text-gray-400">
                              {col.item_count} items
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCollection(col.id);
                              }}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Add Content Modal */}
            {rhShowAddContent && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Add New Content
                    </h3>
                    <button
                      onClick={() => setRhShowAddContent(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target;
                      const linkUrl = form.elements["rh-link"]?.value?.trim();
                      const file = form.elements["rh-file"]?.files?.[0];
                      if (!linkUrl && !file) {
                        alert("Provide a link or upload a file");
                        return;
                      }
                      handleAddContentItem({
                        type: form.elements["rh-type"].value,
                        title: form.elements["rh-title"].value,
                        description: form.elements["rh-description"].value,
                        duration: form.elements["rh-duration"].value,
                        file: linkUrl ? null : file,
                        link_url: linkUrl || null,
                      });
                    }}
                    className="p-6 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        name="rh-type"
                        defaultValue="audio"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white"
                      >
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="pdf">PDF</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        name="rh-title"
                        type="text"
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                        placeholder="e.g. Morning Meditation Guide"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        name="rh-description"
                        rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none"
                        placeholder="Brief description..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (optional)
                      </label>
                      <input
                        name="rh-duration"
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                        placeholder="e.g. 15 min"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link (opens in new tab)
                      </label>
                      <input
                        name="rh-link"
                        type="url"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                        placeholder="https://..."
                        onChange={(e) => {
                          const fileInput = e.target.form.elements["rh-file"];
                          if (e.target.value.trim()) {
                            fileInput.disabled = true;
                            fileInput.value = "";
                          } else {
                            fileInput.disabled = false;
                          }
                        }}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        If a link is provided, file upload is skipped and the
                        link opens in a new tab for the user.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Or Upload File
                      </label>
                      <input
                        name="rh-file"
                        type="file"
                        accept="video/*,audio/*,.pdf"
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 disabled:opacity-40"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setRhShowAddContent(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={rhUploadingContent}
                        className="px-4 py-2 text-sm font-semibold text-black bg-[#fbbf24] rounded-lg hover:bg-[#f59e0b] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rhUploadingContent ? "Uploading..." : "Add Content"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
  );
}
