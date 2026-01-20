import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const params = url.searchParams;

  // Get all the auth parameters from the request URL
  // Supabase can send different params depending on auth flow.
  // Most common for recovery: token_hash + type=recovery
  // Sometimes: token + type, or PKCE: code, or legacy: access_token/refresh_token
  const type = params.get("type") || "";
  const tokenHash = params.get("token_hash") || params.get("token") || "";
  const code = params.get("code") || "";
  const accessToken = params.get("access_token") || "";
  const refreshToken = params.get("refresh_token") || "";

  console.log("[auth-redirect] incoming", {
    type,
    has_token_hash: !!tokenHash,
    has_code: !!code,
    has_access_token: !!accessToken,
    has_refresh_token: !!refreshToken,
    ua: (req.headers.get("user-agent") || "").slice(0, 80),
  });

  const userAgent = req.headers.get("user-agent") || "";
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isMobile = isAndroid || isIOS || /Mobile/i.test(userAgent);

  // Targets
  const appScheme = "dialroad://";
  const webBase = "https://id-preview--06f106cb-9fa2-4cec-abad-afaaa638c89c.lovable.app";

  // Forward *all* relevant params so the app can complete whichever flow it receives.
  const forward = new URLSearchParams();
  if (type) forward.set("type", type);
  if (tokenHash) forward.set("token_hash", tokenHash);
  if (code) forward.set("code", code);
  if (accessToken) forward.set("access_token", accessToken);
  if (refreshToken) forward.set("refresh_token", refreshToken);

  const appTarget = `${appScheme}reset-password?${forward.toString()}`;
  const webTarget = `${webBase}/reset-password?${forward.toString()}`;

  // Android Chrome works best with intent:// links (they support a built-in browser fallback)
  // NOTE: keep package name in sync with your Android app id.
  const androidPackage = "com.dialroad.map";
  const androidIntent = `intent://reset-password?${forward.toString()}#Intent;scheme=dialroad;package=${androidPackage};S.browser_fallback_url=${encodeURIComponent(webTarget)};end`;

  // For mobile we redirect immediately (no HTML page) so the browser can trigger the deep link.
  if (isMobile) {
    const location = isAndroid ? androidIntent : appTarget;
    return new Response(null, {
      status: 302,
      headers: {
        location,
        "cache-control": "no-store",
      },
    });
  }

  // Desktop -> web
  return new Response(null, {
    status: 302,
    headers: {
      location: webTarget,
      "cache-control": "no-store",
    },
  });
});
