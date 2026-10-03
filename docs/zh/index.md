---
layout: home

hero:
  name: Prism
  text: 身份认证，化繁为简。
  tagline: 基于 Cloudflare Workers 的自托管 OAuth 2.0 / OpenID Connect 平台。零服务器，全球边缘。
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/getting-started
    - theme: alt
      text: API 文档
      link: /zh/api
    - theme: alt
      text: GitHub
      link: https://github.com/siiway/prism
    - theme: alt
      text: 公开实例
      link: https://prism.siiway.org

features:
  - icon: 🔐
    title: OAuth 2.0 + OpenID Connect
    details: 完整授权码流（支持 PKCE）、OIDC Discovery、RS256 签名的 ID Token、令牌内省与撤销，以及符合规范的 UserInfo 端点。

  - icon: 🌐
    title: 社交与联邦登录
    details: GitHub、Google、Microsoft、Discord、Telegram、X，并通过 Generic OIDC / Generic OAuth 2 接入任意兼容 provider。同一类型可多源、可 GPG clearsign 登录、可按源绑定。

  - icon: 🛡️
    title: 多因素与步骤提升
    details: 单账号多 TOTP 认证器、Passkey（WebAuthn / FIDO2）、GPG 公钥，以及由服务端触发的步骤提升 2FA 与 sudo 宽限期，专为高风险操作设计。

  - icon: 👥
    title: 团队
    details: OAuth 应用与已验证域名的共享所有者；角色、邀请、所有权转移，以及站点级加入门槛（2FA / 已验证邮箱）。

  - icon: 🤖
    title: 机器人防护
    details: Cloudflare Turnstile、hCaptcha、reCAPTCHA v3，或由 Rust→WASM 驱动的内置工作量证明 — 不依赖第三方。验证码还能门禁 2FA 确认。

  - icon: 🏗️
    title: 应用注册与跨应用 Scope
    details: 用户自助注册 OAuth 应用。应用还可以发布命名权限 scope，其它应用通过标准同意页申请。

  - icon: 🔔
    title: 审核日志与通知
    details: 用户 / 团队 / 平台级审核日志（Transparent Control），带作用域化的 Discord / Telegram / 通用 Webhook、应用事件流（SSE / WebSocket），以及邮件 + Telegram 通知，支持规则引擎做精细路由。

  - icon: 🪪
    title: 公开资料
    details: 可选启用的 `/u/<username>` 与 `/t/<team-id>` 页，按字段控制可见性，GPG 公钥、从 GitHub 同步 README、联邦化 `.gpg` 查询一应俱全。

  - icon: 🔒
    title: 数据库加密
    details: 可还原密钥用 AES-GCM 信封加密（OAuth secret、验证码 key、SMTP/IMAP），bearer 类机密用 keyed HMAC-SHA256 哈希 — 全部根植于 Cloudflare Secrets Store 绑定。

  - icon: ⚡
    title: 边缘原生 + SSR
    details: Cloudflare Workers + D1 + KV + R2。React 19 SPA 由同一 Worker 服务端渲染，已登录用户不再有「未登录闪烁」。一句 `wrangler deploy` 全球上线。
---
