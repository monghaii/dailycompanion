import { getCoachLandingData } from "@/lib/coach-landing";

export async function generateMetadata({ params }) {
  const { coachSlug } = await params;

  if (!coachSlug) {
    return {
      title: "Daily Companion",
      description: "Build a thriving online coaching practice.",
    };
  }

  const coachData = await getCoachLandingData(coachSlug);
  const coach = coachData?.coach;
  const config = coachData?.config;

  const title = coach?.business_name
    ? `${coach.business_name} | Daily Companion`
    : "Daily Companion";
  const description =
    config?.meta_description ||
    coach?.tagline ||
    "Daily practices and awareness tools designed to quiet internal noise and build habits that support calm, focus, and steady growth.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default function CoachLayout({ children }) {
  return children;
}
