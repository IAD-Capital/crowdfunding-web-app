# Push notifications: opt-in + real admin broadcast + subscriber stats

Visitors and investors can enable browser push notifications on their
device (desktop or mobile). A superadmin can then compose and broadcast a
real message from **/admin/notifications** — not a test-only button — and
see how many devices/users are subscribed.

## Architecture

| Piece | File |
|---|---|
| DB tables | [`src/db/schema.sql`](../src/db/schema.sql) — `push_subscriptions`, `push_notifications`; also created idempotently by [`/api/admin/migrate`](../src/app/api/admin/migrate/route.ts) |
| VAPID config | [`src/lib/webpush.ts`](../src/lib/webpush.ts) |
| Service worker | [`public/sw.js`](../public/sw.js) — `push` + `notificationclick` only, no `fetch` handler (Next's own asset hashing handles cache-busting; a caching SW here would risk serving stale bundles after deploys) |
| SW registration | [`src/components/ServiceWorkerRegistrar.tsx`](../src/components/ServiceWorkerRegistrar.tsx), mounted in [`src/app/[lang]/layout.tsx`](../src/app/%5Blang%5D/layout.tsx) — applies to every page, public and admin |
| Client opt-in banner | [`src/components/InstallAppPrompt.tsx`](../src/components/InstallAppPrompt.tsx) — same fixed-bottom banner used for the "Add to Home Screen" prompt; once that's resolved (installed, dismissed, or not applicable) it offers "Activar notificaciones" |
| Save a subscription | [`src/app/api/push/subscribe/route.ts`](../src/app/api/push/subscribe/route.ts) — public, upserts by `endpoint`, attaches `user_id` when logged in |
| Admin broadcast | [`src/app/api/admin/push/send/route.ts`](../src/app/api/admin/push/send/route.ts) — `requireSuperAdmin`, sends via `web-push` to every row in `push_subscriptions`, deletes rows that come back `404`/`410` (dead subscription), logs the send to `push_notifications` |
| Admin UI | [`src/app/[lang]/admin/notifications/page.tsx`](../src/app/%5Blang%5D/admin/notifications/page.tsx) (stats + history) + [`src/components/admin/PushNotificationForm.tsx`](../src/components/admin/PushNotificationForm.tsx) (compose form) |

## Environment variables

| Variable | Where | Notes |
|---|---|---|
| `VAPID_PUBLIC_KEY` | server | Public half of the VAPID key pair |
| `VAPID_PRIVATE_KEY` | server only | **Never expose client-side or commit to the repo.** |
| `VAPID_SUBJECT` | server | `mailto:` address the push services can contact if they need to reach you about your usage |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | client + server | Same value as `VAPID_PUBLIC_KEY` — needs the `NEXT_PUBLIC_` prefix so `pushManager.subscribe()` can read it in the browser |

Generate a key pair once per environment:

```bash
npx web-push generate-vapid-keys
```

Use the **same pair** for `VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — a mismatch here fails subscription silently (browser rejects the key). Rotating the key pair invalidates every existing subscription (users have to opt in again).

## How the client opt-in works

1. `ServiceWorkerRegistrar` registers `/sw.js` on every page load.
2. `InstallAppPrompt` shows **one** banner at a time: the install prompt first (if eligible), then — once that's resolved — the notification opt-in, unless already decided (`Notification.permission !== "default"`) or dismissed in the last 14 days (separate `localStorage` keys for each: `pwa-install-dismissed-at`, `push-opt-in-dismissed-at`).
3. On iOS Safari, push only works from an **installed** PWA (`display-mode: standalone`) on iOS 16.4+ — the opt-in is hidden until the app is actually installed.
4. Clicking "Activar" → `Notification.requestPermission()` → `pushManager.subscribe()` → `POST /api/push/subscribe`.

## Sending a broadcast (admin)

**/admin/notifications** (superadmin only):
- Stats card: total devices subscribed, how many are tied to a logged-in user, how many are anonymous visitors.
- Compose form: title, message, optional link — sends to **every** subscribed device.
- History table: last 20 sends with delivered/failed counts and who sent it.

## Manual testing checklist

Push requires a real, browser-granted notification permission — this can't be exercised from an automated/sandboxed browser (permission is pre-denied there by policy). Test with a real browser:

1. **Local setup**: `.env.local` has `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` set, and the `push_subscriptions` / `push_notifications` tables exist (via `npm run db:migrate`, or hit `/api/admin/migrate?secret=<MIGRATE_SECRET>` against a remote DB).
2. Open the site in a real Chrome/Edge window (`http://localhost:3000` counts as a secure context, no HTTPS needed locally).
3. Confirm the SW registered: DevTools → Application → Service Workers.
4. Wait for the banner (install prompt first if eligible, or the notification opt-in directly), click **Activar**, grant the permission when the browser prompts.
5. Confirm a row landed in `push_subscriptions` for your device.
6. Log in as superadmin → **/admin/notifications** → confirm the stats card shows your device → send a real message.
7. Confirm the OS-level notification appears — with the tab open, and again after closing it.
8. Click the notification → confirms `notificationclick` opens/focuses the right URL.
9. iOS: install the PWA first ("Compartir" → "Agregar a inicio"), then repeat from step 4 inside the installed app — this needs a physical device, the iOS Simulator does not deliver real web push.

## Known gotchas

- A subscription's `endpoint` can rotate on its own (rare) — the old row becomes a harmless orphan, cleaned up automatically the next time a send to it 404s/410s.
- `web-push` needs Node's `crypto`, so `src/app/api/admin/push/send/route.ts` pins `export const runtime = "nodejs"` defensively.
- Push payloads are capped at 4KB by the push services (FCM/Mozilla autopush) — a title+body+url JSON payload is nowhere near that.
