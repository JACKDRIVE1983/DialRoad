import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const params = url.searchParams;

  // Get all the auth parameters from the request URL
  const token = params.get("token") || "";
  const type = params.get("type") || "";

  const userAgent = req.headers.get("user-agent") || "";
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isMobile = isAndroid || isIOS || /Mobile/i.test(userAgent);

  // Targets
  const appScheme = "dialroad://";
  const webBase = "https://id-preview--06f106cb-9fa2-4cec-abad-afaaa638c89c.lovable.app";

  const appTarget = `${appScheme}reset-password?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
  const webTarget = `${webBase}/reset-password?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;

  // Android Chrome works best with intent:// links (they support a built-in browser fallback)
  // NOTE: keep package name in sync with your Android app id.
  const androidPackage = "com.dialroad.app";
  const androidIntent = `intent://reset-password?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}#Intent;scheme=dialroad;package=${androidPackage};S.browser_fallback_url=${encodeURIComponent(webTarget)};end`;

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
