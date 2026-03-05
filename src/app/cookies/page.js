import fs from "fs";
import path from "path";
import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Cookie Policy | Daily Companion",
};

export default function CookiesPage() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "public/legal/cookies.html"),
    "utf-8",
  );
  return <LegalPage html={html} />;
}
