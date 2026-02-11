import type { Metadata } from "next";
import { authClient } from "@/lib/auth/client";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeDrift Tracker",
  description:
    "Track your AI-assisted development vibe drift. Stay focused, ship better.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <NeonAuthUIProvider
          authClient={authClient}
          redirectTo="/dashboard"
          emailOTP
        >
          {children}
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
