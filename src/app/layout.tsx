import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IAD Capital - el nuevo crowdfunding inmobiliario",
  description: "Crowdfunding web app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IAD Capital",
  },
};

export const viewport: Viewport = {
  themeColor: "#002539",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
