# Respawn [WIPE] — Squad Community Website

Website for the **Respawn [WIPE]** Squad gaming clan/community. Built with [Astro](https://astro.build) in **SSR mode**, so the "Server & Events" page and header/footer telemetry show **live** game server stats (players online, current map, team names) queried directly from the Squad dedicated server on every request.

Live site: https://respawnwipe.de

## What this project is

- Marketing/community site: home page, guides, roster & recruitment info, server status & event calendar.
- Live Squad server query via [`gamedig`](https://www.npmjs.com/package/gamedig) in [src/services/wls_server_stats.service.ts](src/services/wls_server_stats.service.ts) — polls the server over UDP and caches the result for 5 seconds to avoid hammering it.
- Rendered with Astro's Node adapter (`output: 'server'`, `@astrojs/node` standalone mode) — **not** a static site, because the server stats need to be fresh on every page load.

## Project structure

```
src/
  components/
    home/       Hero, comms features, social hub (landing page sections)
    roster/     Department grid, recruitment CTA, requirements/benefits, roster table
    server/     Server monitor header, server list, ops calendar
    guides/     Guide grid, telemetry table
    shared/     Header, Footer, CTA banner, wipe button
  layouts/
    Layout.astro   head boilerplate, SEO/Open Graph meta tags, fonts
  pages/
    index.astro         Home
    guides.astro        Guides
    recruitment.astro   Roster & recruitment
    server.astro        Server & events
  services/
    wls_server_stats.service.ts   Live Squad server query (GameDig)
```

## Updating the site content

Everything is plain `.astro` components — no CMS. To change content, edit the relevant file and it takes effect on the next deploy:

- **Text/copy** (hero headline, rules, recruitment blurb, etc.): edit directly inside the component's markup in `src/components/**`.
- **Navigation links**: `navLinks` array in [src/components/shared/Footer.astro](src/components/shared/Footer.astro) and the equivalent in [src/components/shared/Header.astro](src/components/shared/Header.astro).
- **Discord invite link**: search for `discord.gg` across `src/components` and update all occurrences.
- **Squad server address/port**: change the constructor args of `squadService` at the bottom of [src/services/wls_server_stats.service.ts](src/services/wls_server_stats.service.ts) (`host`, `queryPort`).
- **Icons**: uses [astro-icon](https://www.astro-icon.dev/) with the `mdi`/`bi` icon sets — use `<Icon name="mdi:icon-name" />` in any component.
- **Favicons/OG image**: static files in [public/](public).

Run locally to preview changes before deploying:
```sh
npm install
npm run dev
```
Opens at `http://localhost:4321`. Note: SSR means every reload re-queries the real Squad server, so you'll see genuine live data even in dev.

## Deployment

Hosted on a Strato VPS (Ubuntu) running Docker, behind a shared **Caddy** reverse proxy that also fronts another project (`estimation-tool-server` on `api.rpo-estimation-tool.com`). Caddy handles TLS (Let's Encrypt) automatically for all domains.

```
/opt/infra/deploy/                        Shared Caddy reverse proxy (docker-compose.yml + Caddyfile)
/opt/infra/deploy/RespawnWIPE_Website/    This project (cloned/copied here)
```

### One-time server setup
1. Docker installed (`curl -fsSL https://get.docker.com | sh`).
2. Shared network created: `docker network create web`.
3. Caddy stack running from `/opt/infra/deploy` (see [deploy/docker-compose.yml](deploy/docker-compose.yml) and [deploy/Caddyfile](deploy/Caddyfile) in this repo — copy these to the server if not already there).
4. DNS: `respawnwipe.de` and `www.respawnwipe.de` A records point at the VPS's public IP (configured in Strato's domain DNS panel).

### Deploying a new version of this site
From your machine, copy the changed files to the VPS (e.g. via `pscp`/`scp`/`git pull` on the server), then on the VPS:
```sh
cd /opt/infra/deploy/RespawnWIPE_Website
docker compose build --no-cache beneficial-belt
docker compose up -d --force-recreate
docker logs beneficial-belt --tail 50   # verify it started cleanly
```
The container joins the external `web` Docker network; Caddy proxies `respawnwipe.de` to `beneficial-belt:4321` (see [deploy/Caddyfile](deploy/Caddyfile)). No ports are published to the host directly.

### Changing the reverse proxy config
Edit [deploy/Caddyfile](deploy/Caddyfile), copy it to `/opt/infra/deploy/Caddyfile` on the server, then reload without downtime:
```sh
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### Gotcha: production dependencies
The Docker image installs only `dependencies` (not `devDependencies`) in its runtime stage (`npm ci --omit=dev`). Anything imported by server-rendered pages at runtime (e.g. `astro-icon`, used by the `<Icon>` component) **must** live in `dependencies` in [package.json](package.json), not `devDependencies` — otherwise the site 500s in production with `ERR_MODULE_NOT_FOUND`.

### Troubleshooting checklist
```sh
docker ps                                  # are both caddy & beneficial-belt Up?
docker logs caddy --tail 50                # TLS/ACME issues, routing errors
docker logs beneficial-belt --tail 50      # app runtime errors
docker exec caddy wget -qO- http://beneficial-belt:4321   # can Caddy reach the app internally?
nslookup respawnwipe.de                    # DNS pointing at the right IP?
curl -I https://respawnwipe.de             # end-to-end check
```
