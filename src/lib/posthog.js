import { PostHog } from "posthog-node";

let posthogClient = null;

const BLACKLISTED_EMAILS = [
  "testuseriv@test.com",
  "matt@twinleaf.studio",
  "hello@twinleaf.studio",
];

function isDisabled() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  return appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
}

export function isBlacklistedEmail(email) {
  return email && BLACKLISTED_EMAILS.includes(email.toLowerCase());
}

export function getPostHogClient() {
  if (isDisabled()) return null;
  if (!posthogClient && process.env.POSTHOG_API_KEY) {
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
      host: "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

export function trackServerEvent(distinctId, event, properties = {}) {
  const client = getPostHogClient();
  if (!client || !distinctId) return;

  client.capture({
    distinctId,
    event,
    properties,
  });
}

export function identifyUser(distinctId, properties = {}) {
  const client = getPostHogClient();
  if (!client || !distinctId) return;
  if (isBlacklistedEmail(properties.email)) return;

  client.identify({
    distinctId,
    properties,
  });
}

export function setPersonProperties(distinctId, setProps = {}, setOnceProps = {}) {
  const client = getPostHogClient();
  if (!client || !distinctId) return;

  client.capture({
    distinctId,
    event: "$set",
    $set: setProps,
    $set_once: setOnceProps,
  });
}
