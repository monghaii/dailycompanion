import fs from "fs";
import path from "path";
import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Terms of Use | Daily Companion",
};

export default function TermsPage() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "public/legal/terms.html"),
    "utf-8",
  );
  return <LegalPage html={html} />;
}
