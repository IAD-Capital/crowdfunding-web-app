import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export default function LangLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* https://nextjs.org/docs/messages/next-script-for-ga */}
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID || ""} />
      <VercelAnalytics />
      <SpeedInsights />
      <ServiceWorkerRegistrar />
    </>
  );
}
