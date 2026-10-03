---
layout: home

hero:
  name: Prism
  text: Identity. Simplified.
  tagline: Self-hosted OAuth 2.0 / OpenID Connect platform on Cloudflare Workers. Zero servers, global edge.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: API Reference
      link: /api
    - theme: alt
      text: GitHub
      link: https://github.com/siiway/prism
    - theme: alt
      text: Public Instance
      link: https://prism.siiway.org

features:
  - icon: 🔐
    title: OAuth 2.0 + OpenID Connect
    details: Full authorization code flow with PKCE, OIDC Discovery, RS256-signed ID tokens, token introspection and revocation, and a compliant UserInfo endpoint.

  - icon: 🌐
    title: Social & Federated Login
    details: GitHub, Google, Microsoft, Discord, Telegram, X, plus Generic OIDC and Generic OAuth 2 sources for any compliant provider. Multiple sources of the same type, signed-in via GPG clearsign, and per-source linking.

  - icon: 🛡️
    title: Multi-Factor & Step-Up
    details: Multiple TOTP authenticators per account, passkeys (WebAuthn / FIDO2), GPG keys, and server-initiated step-up 2FA with sudo grace windows for sensitive actions.

  - icon: 👥
    title: Teams
    details: Shared ownership of OAuth apps and verified domains. Roles, invites, transfer of ownership, and site-floor join requirements (2FA / verified email).

  - icon: 🤖
    title: Bot Protection
    details: Cloudflare Turnstile, hCaptcha, reCAPTCHA v3, or a self-contained Rust→WASM proof-of-work — no third-party service required. Captcha can also gate 2FA confirmations.

  - icon: 🏗️
    title: App Registry & Cross-App Scopes
    details: Users register and manage their own OAuth apps. Apps can publish named permission scopes that other apps request via the standard consent screen.

  - icon: 🔔
    title: Audit Logs & Notifications
    details: Per-user, per-team, and platform audit logs (Transparent Control) with scoped Discord / Telegram / General webhooks, app event streams (SSE / WebSocket), plus per-event email and Telegram notifications with a rule-engine for fine-grained routing.

  - icon: 🪪
    title: Public Profiles
    details: Opt-in `/u/<username>` and `/t/<team-id>` pages with per-field visibility controls, GPG keys, README sync from GitHub, and federated `.gpg` lookups.

  - icon: 🔒
    title: Encrypted at Rest
    details: AES-GCM envelope encryption for reversible secrets (OAuth client secrets, captcha keys, SMTP/IMAP) and keyed HMAC-SHA256 hashing for bearer tokens — all rooted in a Cloudflare Secrets Store binding.

  - icon: ⚡
    title: Edge-Native, SSR
    details: Cloudflare Workers + D1 + KV + R2. Server-side rendered React 19 SPA so logged-in users skip the loading flash. One `wrangler deploy` ships everything globally.
---
