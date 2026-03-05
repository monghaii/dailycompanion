import fs from "fs";
import path from "path";
import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy | Daily Companion",
};

export default function PrivacyPage() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "public/legal/privacy.html"),
    "utf-8",
  );
  return <LegalPage html={html} />;
}
