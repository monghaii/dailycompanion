import { getCoachLandingData } from "@/lib/coach-landing";
import SignupClient from "./SignupClient";
import { headers } from "next/headers";

async function getCoachDataForPage() {
  const headersList = await headers();
  const customDomainSlug = headersList.get("X-Coach-Slug");
  return { customDomainSlug };
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const coachSlugParam = sp?.coach;

  const { customDomainSlug } = await getCoachDataForPage();
  const coachSlug = coachSlugParam || customDomainSlug;

  if (!coachSlug) {
    return {
      title: "Sign Up | Daily Companion",
      description: "Sign up for Daily Companion to start your coaching journey.",
    };
  }

  const coachData = await getCoachLandingData(coachSlug);
  const coach = coachData?.coach;
  const config = coachData?.config;

  const title = coach?.business_name
    ? `Sign Up - ${coach.business_name} | Daily Companion`
    : "Sign Up | Daily Companion";
  const description =
    config?.meta_description ||
    coach?.tagline ||
    `Sign up for ${coach?.business_name || "Daily Companion"} to start your coaching journey.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function SignupPage({ searchParams }) {
  const sp = await searchParams;
  const coachSlugParam = sp?.coach;

  const headersList = await headers();
  const customDomainSlug = headersList.get("X-Coach-Slug");

  const coachSlug = coachSlugParam || customDomainSlug;

  let coachData = null;

  if (coachSlug) {
    coachData = await getCoachLandingData(coachSlug);
  }

  return <SignupClient coachSlug={coachSlug} initialCoachData={coachData} />;
}
