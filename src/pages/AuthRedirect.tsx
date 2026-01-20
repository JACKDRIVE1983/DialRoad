import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function isAndroidUA(ua: string) {
  return /Android/i.test(ua);
}

function isIOSUA(ua: string) {
  return /iPhone|iPad|iPod/i.test(ua);
}

function mergeParams(search: string, hash: string) {
  const params = new URLSearchParams(search);
  if (hash?.startsWith("#")) {
    const hp = new URLSearchParams(hash.slice(1));
    for (const [k, v] of hp.entries()) {
      if (!params.has(k)) params.set(k, v);
    }
  }
  return params;
}

export default function AuthRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const params = mergeParams(window.location.search, window.location.hash);

    // Normalize param names for our ResetPassword page
    const normalized = new URLSearchParams();
    const type = params.get("type") || "recovery";
    const tokenHash = params.get("token_hash") || params.get("token") || "";
    const code = params.get("code") || "";
    const accessToken = params.get("access_token") || "";
    const refreshToken = params.get("refresh_token") || "";

    if (type) normalized.set("type", type);
    if (tokenHash) normalized.set("token_hash", tokenHash);
    if (code) normalized.set("code", code);
    if (accessToken) normalized.set("access_token", accessToken);
    if (refreshToken) normalized.set("refresh_token", refreshToken);

    // If we didn't get anything useful, go straight to reset page (it will show error)
    const hasAny = tokenHash || code || accessToken || refreshToken;

    const webFallback = `/reset-password?${normalized.toString()}`;
    const appSchemeUrl = `dialroad://reset-password?${normalized.toString()}`;
    const androidPackage = "com.dialroad.map";
    const androidIntentUrl = `intent://reset-password?${normalized.toString()}#Intent;scheme=dialroad;package=${androidPackage};end`;

    // Tryorei: open native app on mobile, otherwise go to web reset
    if (isAndroidUA(ua)) {
      if (hasAny) window.location.href = androidIntentUrl;
      setTimeout(() => navigate(webFallback, { replace: true }), 600);
      return;
    }

    if (isIOSUA(ua)) {
      if (hasAny) window.location.href = appSchemeUrl;
      setTimeout(() => navigate(webFallback, { replace: true }), 600);
      return;
    }

    navigate(webFallback, { replace: true });
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-semibold text-foreground">Apertura in corso…</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Se l’app non si apre automaticamente, verrai reindirizzato alla pagina di reset nel browser.
        </p>
      </div>
    </main>
  );
}
