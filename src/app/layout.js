import "./globals.css";

export const metadata = {
  title: "Daily Companion — Coaching Platform",
  description: "Build a thriving online coaching practice. Share content, connect with clients, and grow your revenue.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
