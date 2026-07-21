import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IAD Capital - el nuevo crowdfunding inmobiliario",
  description: "Crowdfunding web app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
