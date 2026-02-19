/**
 * Kit API V4 Integration
 * https://developers.kit.com/v4
 *
 * Auth: X-Kit-Api-Key header
 * Base URL: https://api.kit.com/v4
 */

const KIT_BASE = "https://api.kit.com/v4";

function kitHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    "X-Kit-Api-Key": apiKey,
  };
}

/**
 * Test Kit API connection
 */
export async function testKitConnection(apiKey) {
  if (!apiKey) {
    return { success: false, error: "API key is required" };
  }

  try {
    const response = await fetch(`${KIT_BASE}/account`, {
      headers: kitHeaders(apiKey),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        error: data.errors?.[0] || "API Key not valid",
      };
    }

    const data = await response.json();

    return {
      success: true,
      account: {
        name: data.user?.name || data.name,
        primary_email: data.user?.email_address || data.primary_email_address,
      },
    };
  } catch (error) {
    console.error("[Kit] Connection test error:", error);
    return {
      success: false,
      error: error.message || "Failed to connect to Kit",
    };
  }
}

/**
 * Add a subscriber to Kit (creates or updates)
 */
export async function addSubscriberToKit({
  apiKey,
  email,
  firstName,
  lastName,
  tags = [],
  formId = null,
}) {
  if (!apiKey || !email) {
    throw new Error("API key and email are required");
  }

  try {
    const payload = {
      email_address: email,
    };

    if (firstName) {
      payload.first_name = firstName;
    }

    if (lastName) {
      payload.fields = { "Last name": lastName };
    }

    console.log("[Kit] Adding subscriber:", { email, formId });

    const response = await fetch(`${KIT_BASE}/subscribers`, {
      method: "POST",
      headers: kitHeaders(apiKey),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Kit] Error creating subscriber:", data);
      throw new Error(data.errors?.[0] || "Failed to add subscriber to Kit");
    }

    const subscriberId = data.subscriber?.id;

    // If a form ID is provided, add subscriber to that form
    if (formId && subscriberId) {
      await addSubscriberToForm({ apiKey, formId, email });
    }

    // Apply tags by name (create-or-find each tag, then tag the subscriber)
    if (tags.length > 0 && subscriberId) {
      await tagSubscriberByNames({ apiKey, subscriberId, email, tagNames: tags });
    }

    console.log("[Kit] Subscriber added successfully");
    return data;
  } catch (error) {
    console.error("[Kit] Error adding subscriber:", error);
    throw error;
  }
}

/**
 * Add subscriber to a form by email
 */
async function addSubscriberToForm({ apiKey, formId, email }) {
  try {
    const response = await fetch(
      `${KIT_BASE}/forms/${formId}/subscribers`,
      {
        method: "POST",
        headers: kitHeaders(apiKey),
        body: JSON.stringify({ email_address: email }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error("[Kit] Error adding to form:", data);
    }
  } catch (error) {
    console.error("[Kit] Error adding subscriber to form:", error);
  }
}

/**
 * List existing tags to find IDs by name
 */
async function listTags(apiKey) {
  try {
    const response = await fetch(`${KIT_BASE}/tags`, {
      headers: kitHeaders(apiKey),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.tags || [];
  } catch {
    return [];
  }
}

/**
 * Create a tag and return its ID
 */
async function createTag(apiKey, name) {
  const response = await fetch(`${KIT_BASE}/tags`, {
    method: "POST",
    headers: kitHeaders(apiKey),
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.errors?.[0] || `Failed to create tag: ${name}`);
  }

  const data = await response.json();
  return data.tag?.id;
}

/**
 * Tag a subscriber using tag names (resolves names to IDs first)
 */
async function tagSubscriberByNames({ apiKey, subscriberId, email, tagNames }) {
  try {
    const existingTags = await listTags(apiKey);
    const tagMap = {};
    for (const t of existingTags) {
      tagMap[t.name.toLowerCase()] = t.id;
    }

    for (const name of tagNames) {
      let tagId = tagMap[name.toLowerCase()];

      if (!tagId) {
        try {
          tagId = await createTag(apiKey, name);
        } catch (err) {
          console.error(`[Kit] Failed to create tag "${name}":`, err.message);
          continue;
        }
      }

      if (!tagId) continue;

      // Tag subscriber by email
      const res = await fetch(
        `${KIT_BASE}/tags/${tagId}/subscribers`,
        {
          method: "POST",
          headers: kitHeaders(apiKey),
          body: JSON.stringify({ email_address: email }),
        },
      );

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        console.error(`[Kit] Error tagging with "${name}":`, d);
      }
    }
  } catch (error) {
    console.error("[Kit] Error tagging subscriber:", error);
  }
}

/**
 * Tag a subscriber in Kit (public API)
 */
export async function tagSubscriber({ apiKey, email, tags }) {
  if (!apiKey || !email || !tags || tags.length === 0) {
    throw new Error("API key, email, and tags are required");
  }

  // We need the subscriber ID. Look up by email first.
  const listRes = await fetch(
    `${KIT_BASE}/subscribers?email_address=${encodeURIComponent(email)}`,
    { headers: kitHeaders(apiKey) },
  );

  if (!listRes.ok) {
    throw new Error("Failed to look up subscriber");
  }

  const listData = await listRes.json();
  const subscriber = listData.subscribers?.[0];

  if (!subscriber) {
    throw new Error("Subscriber not found in Kit");
  }

  await tagSubscriberByNames({
    apiKey,
    subscriberId: subscriber.id,
    email,
    tagNames: tags,
  });

  return { success: true };
}

/**
 * Unsubscribe a subscriber from Kit
 * V4 requires subscriber ID: POST /v4/subscribers/:id/unsubscribe
 */
export async function unsubscribeFromKit({ apiKey, email }) {
  if (!apiKey || !email) {
    throw new Error("API key and email are required");
  }

  try {
    // Look up subscriber by email
    const listRes = await fetch(
      `${KIT_BASE}/subscribers?email_address=${encodeURIComponent(email)}`,
      { headers: kitHeaders(apiKey) },
    );

    if (!listRes.ok) {
      throw new Error("Failed to look up subscriber");
    }

    const listData = await listRes.json();
    const subscriber = listData.subscribers?.[0];

    if (!subscriber) {
      console.log("[Kit] Subscriber not found, nothing to unsubscribe");
      return { success: true };
    }

    const response = await fetch(
      `${KIT_BASE}/subscribers/${subscriber.id}/unsubscribe`,
      {
        method: "POST",
        headers: kitHeaders(apiKey),
      },
    );

    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.errors?.[0] || "Failed to unsubscribe from Kit");
    }

    console.log("[Kit] Subscriber unsubscribed");
    return { success: true };
  } catch (error) {
    console.error("[Kit] Error unsubscribing:", error);
    throw error;
  }
}
