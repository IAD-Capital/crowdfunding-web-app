# IAD Capital — Crowdfunding Web App

## Running the app

```bash
docker compose up
```

The app runs on `http://localhost:3000` by default.

---

## Custom local domain (`http://iadcapital.local`)

If you want to access the app at `http://iadcapital.local` instead of `http://localhost:3000`, follow these steps once per machine.

### 1. Install Caddy

```bash
brew install caddy
```

### 2. Add the hostname to `/etc/hosts`

```bash
sudo sh -c 'echo "127.0.0.1 iadcapital.local" >> /etc/hosts'
```

You only need to do this once. To verify it worked:

```bash
grep iadcapital.local /etc/hosts
```

### 3. Start Caddy

From the project root (where `Caddyfile` lives):

```bash
caddy run
```

Caddy reads the `Caddyfile` and proxies `http://iadcapital.local` → `http://localhost:3000`.

### 4. Start the app as usual

```bash
docker compose up
```

Then open `http://iadcapital.local`.

---

## Reverting to `localhost:3000`

Just stop Caddy (`Ctrl+C`) and open `http://localhost:3000` as normal.  
The `Caddyfile` and `/etc/hosts` entry do no harm when Caddy is not running — you can leave them in place.

To permanently remove the custom domain:

```bash
# Remove the /etc/hosts entry
sudo sed -i '' '/iadcapital.local/d' /etc/hosts
```

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values before running.

---

## Deploying to production (Vercel + Supabase)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full checklist: required
env vars, Supabase pooler vs. direct connection, image upload storage
strategy, schema setup/reset scripts, and the investment tiers feature.

---

## Push notifications

See [docs/PUSH_NOTIFICATIONS.md](docs/PUSH_NOTIFICATIONS.md) for the
architecture, required VAPID env vars, how the client opt-in and admin
broadcast work, and a manual testing checklist.
