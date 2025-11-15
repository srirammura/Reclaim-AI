import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { CopilotKit } from "@copilotkit/react-core";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reclaim AI - Purpose over Purchase",
  description: "An autonomous anti-consumerism agent that helps you make mindful purchasing decisions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY}
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
