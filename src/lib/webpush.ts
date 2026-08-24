import webpush from "web-push";

// Configured lazily, on first use, not at module import time — otherwise
// Next.js crashes during the build's "collect page data" step (which imports
// this route) if VAPID_* env vars aren't available at build time. Same
// reasoning as the lazy DB proxy in src/lib/db.ts.
let configured = false;

function getWebpush() {
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    configured = true;
  }
  return webpush;
}

export default getWebpush;
