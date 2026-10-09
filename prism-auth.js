// prism-auth.js / worker-auth-middleware.js

// =========================================================================
// 1. 加密与安全工具函数 (Web Crypto & Timing-Safe)
// =========================================================================

// 恒定时间字符串比对（防御时序侧信道攻击）
function timingSafeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
        return false;
    }
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

// 缓存 CryptoKey，避免高并发下每个请求重复 importKey 消耗 CPU
let _cachedSecret = null;
let _cachedKey = null;

async function getHmacKey(secret) {
    if (_cachedKey && _cachedSecret === secret) return _cachedKey;
    const enc = new TextEncoder();
    _cachedKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
    _cachedSecret = secret;
    return _cachedKey;
}

// 基于 Web Crypto 的 HMAC-SHA256 签名工具
async function hmacSign(data, secret) {
    const key = await getHmacKey(secret);
    const enc = new TextEncoder();
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacVerify(data, signature, secret) {
    const expected = await hmacSign(data, secret);
    return timingSafeEqual(expected, signature);
}

// UTF-8 安全的 Base64URL 编解码工具
function base64UrlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
        base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

// 健壮的 Cookie 解析方法（避免 split("=") 误切 base64 中的等于号）
function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    for (const item of cookieHeader.split(";")) {
        const idx = item.indexOf("=");
        if (idx !== -1) {
            const key = item.slice(0, idx).trim();
            const val = item.slice(idx + 1).trim();
            cookies[key] = val;
        }
    }
    return cookies;
}

// 防御开放重定向（Open Redirect）：强制要求单斜杠内部相对路径，禁止 // 或 /\ 外部协议伪造
function sanitizeRedirectPath(path) {
    if (!path || typeof path !== "string") return "/";
    if (path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\")) {
        return path;
    }
    return "/";
}

// =========================================================================
// 2. 鉴权基类 (PrismWorker)
// =========================================================================

export class PrismWorker {
    /**
     * 可选扩展：指定公开免登路径（如 /favicon.ico 或静态公共 API）
     * 子类可以重写此方法以自定义放行规则
     */
    isPublic(url, request) {
        return url.pathname === "/favicon.ico";
    }

    /**
     * Worker 入口：拦截未登录、OAuth 回调、登出并透传业务请求
     */
    async fetch(request, env, ctx) {
        env = env || (typeof globalThis !== "undefined" ? globalThis : {});
        const url = new URL(request.url);

        // 前置环境变量完整性检查
        if (!env.PRISM_URL || !env.PRISM_CLIENT_ID || !env.PRISM_CLIENT_SECRET) {
            return new Response("配置错误：缺少必要的环境变量 (PRISM_URL, PRISM_CLIENT_ID, PRISM_CLIENT_SECRET)", {
                status: 500,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
        }

        // 白名单路径直接放行
        if (this.isPublic(url, request)) {
            return this.handleRequest(request, env, ctx, null);
        }

        const cookies = parseCookies(request.headers.get("Cookie") || "");
        const prismBase = env.PRISM_URL.replace(/\/+$/, "");
        // 泛域名 Cookie 支持（例如 .b.cc.cd 或 .cc.cd，让多级子域名站点直接共享登录态）
        // 自动容错：去除前后空格，若未写前导点号自动补齐，输入 "b.cc.cd" 也会标准化为 ".b.cc.cd"
        let cookieDomain = (env.COOKIE_DOMAIN || "").trim();
        if (cookieDomain && !cookieDomain.startsWith(".")) {
            cookieDomain = "." + cookieDomain;
        }
        const domainAttr = cookieDomain ? `; Domain=${cookieDomain}` : "";

        // 【功能 1：主动登出】访问 /__logout 即可清理 Cookie 并登出
        if (url.pathname === "/__logout") {
            return new Response("已退出当前站点登录", {
                status: 302,
                headers: {
                    "Location": "/",
                    "Set-Cookie": `prism_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0${domainAttr}`,
                },
            });
        }

        // 【功能 2：OAuth 回调处理】拦截 Prism 登录完成后的跳回
        if (url.pathname === "/auth/callback") {
            const error = url.searchParams.get("error");
            if (error) {
                const desc = url.searchParams.get("error_description") || error;
                return new Response(`Prism 授权失败: ${desc}`, { status: 403 });
            }

            const code = url.searchParams.get("code");
            const rawState = url.searchParams.get("state");
            if (!code) return new Response("缺少授权码 (Code)", { status: 400 });

            // 校验 State：防范登录 CSRF 攻击与开放重定向
            let targetPath = "/";
            if (rawState && rawState.includes(".")) {
                const [statePayloadB64, stateSig] = rawState.split(".");
                if (await hmacVerify(statePayloadB64, stateSig, env.PRISM_CLIENT_SECRET)) {
                    try {
                        const parsed = JSON.parse(base64UrlDecode(statePayloadB64));
                        // 10 分钟有效期校验
                        if (parsed.exp && parsed.exp > Date.now()) {
                            targetPath = sanitizeRedirectPath(parsed.path);
                        }
                    } catch (e) { }
                }
            }

            // 向 Prism 请求换取 Token（标准端点为 /api/oauth/token）
            const tokenRes = await fetch(`${prismBase}/api/oauth/token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    client_id: env.PRISM_CLIENT_ID,
                    client_secret: env.PRISM_CLIENT_SECRET,
                    code,
                    redirect_uri: `${url.origin}/auth/callback`,
                }),
            });

            if (!tokenRes.ok) {
                const errText = await tokenRes.text();
                return new Response(`Prism 换取 Token 失败: ${errText}`, { status: 401 });
            }

            const tokenData = await tokenRes.json();
            let user = {};

            // 解析用户身份信息（优先从 OIDC id_token 解码，回退 userinfo 端点）
            if (tokenData.id_token) {
                try {
                    const idPayload = tokenData.id_token.split(".")[1];
                    user = JSON.parse(base64UrlDecode(idPayload));
                } catch (e) { }
            } else if (tokenData.access_token) {
                try {
                    const uRes = await fetch(`${prismBase}/api/oauth/userinfo`, {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` },
                    });
                    if (uRes.ok) user = await uRes.json();
                } catch (e) { }
            }

            // 生成带签名的 Session Cookie（绑定 client_id，默认有效期 7 天）
            const expireAt = Date.now() + 7 * 86400 * 1000;
            const sessionPayload = {
                aud: env.PRISM_CLIENT_ID,
                exp: expireAt,
                user,
            };
            const payloadStr = JSON.stringify(sessionPayload);
            const encodedPayload = base64UrlEncode(payloadStr);
            const signature = await hmacSign(encodedPayload, env.PRISM_CLIENT_SECRET);
            const sessionValue = `${encodedPayload}.${signature}`;

            return new Response(null, {
                status: 302,
                headers: {
                    "Location": targetPath,
                    "Set-Cookie": `prism_session=${sessionValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800${domainAttr}`,
                },
            });
        }

        // 【功能 3：校验本地登录态】
        const sessionCookie = cookies["prism_session"];
        let user = null;

        if (sessionCookie && sessionCookie.includes(".")) {
            const [encodedPayload, signature] = sessionCookie.split(".");
            if (encodedPayload && signature) {
                const isValid = await hmacVerify(encodedPayload, signature, env.PRISM_CLIENT_SECRET);
                if (isValid) {
                    try {
                        const sessionData = JSON.parse(base64UrlDecode(encodedPayload));
                        // 校验有效期与 Client ID 归属
                        if (
                            Number(sessionData.exp) > Date.now() &&
                            sessionData.aud === env.PRISM_CLIENT_ID
                        ) {
                            user = sessionData.user || { authenticated: true };
                        }
                    } catch (e) { }
                }
            }
        }

        // 【功能 4：未登录拦截】
        if (!user) {
            // 对 API 或 Ajax 请求返回 401 JSON，避免前端 302 跟随重定向导致 CORS 跨域报错
            const isApi = url.pathname.startsWith("/api/") ||
                request.headers.get("Accept")?.includes("application/json") ||
                request.headers.get("X-Requested-With") === "XMLHttpRequest";

            if (isApi) {
                return new Response(
                    JSON.stringify({ error: "Unauthorized", message: "未登录或登录已过期" }),
                    {
                        status: 401,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }

            // 生成带签名与防篡改的 State（有效期 10 分钟）
            const stateData = JSON.stringify({
                path: url.pathname + url.search,
                exp: Date.now() + 600 * 1000,
            });
            const stateB64 = base64UrlEncode(stateData);
            const stateSig = await hmacSign(stateB64, env.PRISM_CLIENT_SECRET);
            const stateToken = `${stateB64}.${stateSig}`;

            // 网页端未登录：重定向至 Prism 登录（直接使用前端页面路由，省去一次 302 重定向套娃）
            const authUrl = new URL(`${prismBase}/oauth/authorize`);
            authUrl.searchParams.set("client_id", env.PRISM_CLIENT_ID);
            authUrl.searchParams.set("redirect_uri", `${url.origin}/auth/callback`);
            authUrl.searchParams.set("response_type", "code");
            // scope 默认包含 openid profile email（按需通过 PRISM_SCOPE 覆盖）
            authUrl.searchParams.set("scope", env.PRISM_SCOPE || "openid profile email");
            authUrl.searchParams.set("state", stateToken);

            return Response.redirect(authUrl.toString(), 302);
        }

        // 鉴权通过：把 user 挂载到 request 并透传给业务逻辑
        request.user = user;
        return this.handleRequest(request, env, ctx, user);
    }

    /**
     * 子类重写的业务方法（增加第 4 个参数 user，获取当前登录用户信息）
     */
    async handleRequest(request, env, ctx, user) {
        return new Response("请在子类中重写 handleRequest 方法", { status: 404 });
    }
}

// 兼容纯函数式习惯的导出包装器
export function withPrismAuth(handler, options = {}) {
    const instance = new (class extends PrismWorker {
        isPublic(url, req) {
            return options.isPublic ? options.isPublic(url, req) : super.isPublic(url, req);
        }
        async handleRequest(req, env, ctx, user) {
            return handler(req, env, ctx, user);
        }
    })();
    return (req, env, ctx) => instance.fetch(req, env, ctx);
}

// 兼容旧版 Service Worker (addEventListener("fetch")) 模式
export function registerServiceWorker(handleRequest, options = {}) {
    const worker = new (class extends PrismWorker {
        isPublic(url, req) {
            return options.isPublic ? options.isPublic(url, req) : super.isPublic(url, req);
        }
        async handleRequest(request, env, ctx, user) {
            // 构造兼容旧版代码的 event 对象
            const fakeEvent = {
                request,
                respondWith: () => { },
                waitUntil: (p) => (ctx && ctx.waitUntil ? ctx.waitUntil(p) : p),
                user,
            };
            return handleRequest(fakeEvent, user);
        }
    })();

    addEventListener("fetch", (event) => {
        event.respondWith(worker.fetch(event.request, globalThis, event));
    });
}

// ==========================================
// 小网站的 index.js 接入示例（以下为使用参考）
// ==========================================

/*
// ------------------------------------------
// 接入方式一：基类继承方式（推荐导出实例化对象）
// ------------------------------------------
import { PrismWorker } from "./prism-auth.js";

export default new class extends PrismWorker {
    // 【可选】自定义无需鉴权的公开路径
    // isPublic(url, request) {
    //     return url.pathname.startsWith("/public/") || url.pathname === "/favicon.ico";
    // }

    async handleRequest(request, env, ctx, user) {
        // 1. 这里写你网站原来的所有正常业务代码
        // 2. 只有在 Prism 登录认证通过后才会进入此方法
        // 3. user 包含当前登录人信息（例如 user.email, user.name 等）
        const email = user?.email || "已认证用户";

        // 【可选】如果某个私密小工具只允许指定管理员访问：
        // if (email !== "your-admin@example.com") {
        //     return new Response("无权访问此私密工具", { status: 403 });
        // }

        return new Response(`Hello! 只有 Prism 登录后的人才能看到我。当前用户: ${email}`);
    }
};

// ------------------------------------------
// 接入方式二：函数式包装器方式
// ------------------------------------------
// import { withPrismAuth } from "./prism-auth.js";
//
// export default {
//     fetch: withPrismAuth(async (request, env, ctx, user) => {
//         return new Response(`欢迎访问，登录用户：${user.email}`);
//     })
// };

// ==========================================
// wrangler.toml 配置说明（特别针对多级子域名 a.b.cc.cd）
// ==========================================
// [vars]
// PRISM_URL = "https://cf.cc.cd"
// PRISM_CLIENT_ID = "workers-apps-id"
// PRISM_CLIENT_SECRET = "workers-apps-secret"
//
// # 【多级域名 COOKIE_DOMAIN 填写规则】：
// # 假设你的网站是 a.b.cc.cd, x.b.cc.cd
// # 1. 如果只想让 *.b.cc.cd 下的所有子站共享登录态：
// #    COOKIE_DOMAIN = ".b.cc.cd"  （或者写 "b.cc.cd"，代码会自动标准化）
// # 2. 如果想让整个根域名 *.cc.cd 下无论几级域名全都共享登录态：
// #    COOKIE_DOMAIN = ".cc.cd"
// # 3. 如果每个小网站完全独立，不要互相共享 Cookie：
// #    留空或不配置此项即可。

PRISM_URL=https://cf.cc.cd
PRISM_CLIENT_ID=
PRISM_CLIENT_SECRET=

*/