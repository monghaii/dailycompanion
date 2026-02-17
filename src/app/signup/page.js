import { getCoachLandingData } from "@/lib/coach-landing";
import SignupClient from "./SignupClient";
import { headers } from "next/headers";

export default async function SignupPage({ searchParams }) {
  const sp = await searchParams;
  const coachSlugParam = sp?.coach;

  // Also check headers for custom domain slug (set by middleware)
  const headersList = await headers();
  const customDomainSlug = headersList.get("X-Coach-Slug");

  const coachSlug = coachSlugParam || customDomainSlug;

  let coachData = null;

  if (coachSlug) {
    coachData = await getCoachLandingData(coachSlug);
  }

  return <SignupClient coachSlug={coachSlug} initialCoachData={coachData} />;
}
