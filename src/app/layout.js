import "./globals.css";
import SiteBanner from "@/components/SiteBanner";

export const metadata = {
  title: "Daily Companion — Coaching Platform",
  description: "Build a thriving online coaching practice. Share content, connect with clients, and grow your revenue.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteBanner />
        {children}
      </body>
    </html>
  );
}
