import { useCallback, useEffect, useMemo } from "react";
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

  const { isAndroid, isIOS, hasAny, webFallback, appSchemeUrl, androidIntentUrl } = useMemo(() => {
    const ua = navigator.userAgent || "";
    const params = mergeParams(window.location.search, window.location.hash);

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

    const has = !!(tokenHash || code || accessToken || refreshToken);
    const fallback = `/reset-password?${normalized.toString()}`;
    const appUrl = `dialroad://reset-password?${normalized.toString()}`;
    const androidPackage = "com.dialroad.map";
    const intentUrl = `intent://reset-password?${normalized.toString()}#Intent;scheme=dialroad;package=${androidPackage};end`;

    return {
      isAndroid: isAndroidUA(ua),
      isIOS: isIOSUA(ua),
      hasAny: has,
      webFallback: fallback,
      appSchemeUrl: appUrl,
      androidIntentUrl: intentUrl,
    };
  }, []);

  const openNative = useCallback(() => {
    if (!hasAny) return;
    if (isAndroid) {
      window.location.href = androidIntentUrl;
      return;
    }
    if (isIOS) {
      window.location.href = appSchemeUrl;
    }
  }, [androidIntentUrl, appSchemeUrl, hasAny, isAndroid, isIOS]);

  useEffect(() => {
    // Some Android browsers block automatic intent:// navigation without user gesture.
    // We still try once, then fall back to the web reset page.
    if (isAndroid || isIOS) {
      openNative();
      setTimeout(() => navigate(webFallback, { replace: true }), 900);
      return;
    }
    navigate(webFallback, { replace: true });
  }, [isAndroid, isIOS, navigate, openNative, webFallback]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-semibold text-foreground">Apertura in corso…</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Se l’app non si apre automaticamente, verrai reindirizzato alla pagina di reset nel browser.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {(isAndroid || isIOS) && (
            <button
              type="button"
              onClick={openNative}
              className="h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              disabled={!hasAny}
            >
              Apri l’app
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(webFallback, { replace: true })}
            className="h-11 rounded-md border border-border bg-background text-foreground text-sm font-medium"
          >
            Continua nel browser
          </button>
        </div>
      </div>
    </main>
  );
}
