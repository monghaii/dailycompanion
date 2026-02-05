/**
 * Kit (ConvertKit) API Integration
 * Handles subscriber management for each coach's Kit account
 */

/**
 * Add a subscriber to Kit
 * @param {string} apiKey - Coach's Kit API key
 * @param {object} subscriber - Subscriber data
 * @param {string} subscriber.email - Subscriber email (required)
 * @param {string} subscriber.first_name - First name
 * @param {string} subscriber.last_name - Last name
 * @param {array} tags - Array of tag names to apply
 * @param {string} formId - Optional form ID to subscribe to
 * @returns {Promise<object>} Kit API response
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
    // Kit API endpoint
    const endpoint = formId
      ? `https://api.convertkit.com/v3/forms/${formId}/subscribe`
      : "https://api.convertkit.com/v3/subscribers";

    const payload = {
      api_key: apiKey,
      email: email,
    };

    // Add first name if provided
    if (firstName) {
      payload.first_name = firstName;
    }

    // Add tags if provided
    if (tags && tags.length > 0) {
      payload.tags = tags;
    }

    // Add custom fields if not using form endpoint
    if (!formId && (firstName || lastName)) {
      payload.fields = {};
      if (firstName) payload.fields.first_name = firstName;
      if (lastName) payload.fields.last_name = lastName;
    }

    console.log("[Kit] Adding subscriber:", { email, tags, formId });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Kit] Error response:", data);
      throw new Error(data.message || "Failed to add subscriber to Kit");
    }

    console.log("[Kit] Subscriber added successfully");
    return data;
  } catch (error) {
    console.error("[Kit] Error adding subscriber:", error);
    throw error;
  }
}

/**
 * Test Kit API connection
 * @param {string} apiKey - Kit API key to test
 * @returns {Promise<object>} Result with success status
 */
export async function testKitConnection(apiKey) {
  if (!apiKey) {
    return { success: false, error: "API key is required" };
  }

  try {
    // Use the account endpoint to verify the API key
    const response = await fetch(
      `https://api.convertkit.com/v3/account?api_key=${apiKey}`,
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Invalid API key",
      };
    }

    return {
      success: true,
      account: {
        name: data.name,
        primary_email: data.primary_email_address,
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
 * Tag a subscriber in Kit
 * @param {string} apiKey - Coach's Kit API key
 * @param {string} email - Subscriber email
 * @param {array} tags - Array of tag names
 * @returns {Promise<object>} Kit API response
 */
export async function tagSubscriber({ apiKey, email, tags }) {
  if (!apiKey || !email || !tags || tags.length === 0) {
    throw new Error("API key, email, and tags are required");
  }

  try {
    const promises = tags.map(async (tagName) => {
      const response = await fetch(`https://api.convertkit.com/v3/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          tag: { name: tagName },
          email: email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to tag with: ${tagName}`);
      }

      return response.json();
    });

    await Promise.all(promises);
    console.log("[Kit] Subscriber tagged successfully");
    return { success: true };
  } catch (error) {
    console.error("[Kit] Error tagging subscriber:", error);
    throw error;
  }
}

/**
 * Unsubscribe a subscriber from Kit
 * @param {string} apiKey - Coach's Kit API key
 * @param {string} email - Subscriber email
 * @returns {Promise<object>} Kit API response
 */
export async function unsubscribeFromKit({ apiKey, email }) {
  if (!apiKey || !email) {
    throw new Error("API key and email are required");
  }

  try {
    const response = await fetch("https://api.convertkit.com/v3/unsubscribe", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        email: email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to unsubscribe from Kit");
    }

    console.log("[Kit] Subscriber unsubscribed");
    return data;
  } catch (error) {
    console.error("[Kit] Error unsubscribing:", error);
    throw error;
  }
}
