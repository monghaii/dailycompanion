import { PostHog } from "posthog-node";

let posthogClient = null;

export function getPostHogClient() {
  if (!posthogClient && process.env.POSTHOG_API_KEY) {
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
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
