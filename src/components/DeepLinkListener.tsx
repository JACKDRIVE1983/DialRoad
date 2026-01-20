import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function recordLaunchUrl(url: string) {
  safeSet("last_launch_url", url);
  safeSet("last_launch_at", new Date().toISOString());
}

function recordDeepLinkUrl(url: string) {
  safeSet("last_deeplink_url", url);
  safeSet("last_deeplink_at", new Date().toISOString());
  try {
    const parsed = new URL(url);
    safeSet(
      "last_deeplink_parsed",
      JSON.stringify(
        {
          href: parsed.href,
          protocol: parsed.protocol,
          host: parsed.host,
          pathname: parsed.pathname,
          search: parsed.search,
          hash: parsed.hash,
          params: Object.fromEntries(parsed.searchParams.entries()),
        },
        null,
        2,
      ),
    );
  } catch {
    safeSet("last_deeplink_parsed", "(failed to parse URL)");
  }
}

async function tryExchangeOAuthCode(url: string) {
  // For Supabase OAuth with PKCE, the callback contains ?code=...
  let code = "";
  try {
    code = new URL(url).searchParams.get("code") || "";
  } catch {
    code = "";
  }
  if (!code) return;

  // Do NOT call Supabase inside the onAuthStateChange callback.
  // Here we're in a deeplink handler, so it's safe.
  await supabase.auth.exchangeCodeForSession(code);
}

/**
 * Listens for native deep links (dialroad://...) and routes inside the SPA.
 * Also exchanges OAuth code for a session when returning from Google login.
 */
export function DeepLinkListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Cold start URL
    App.getLaunchUrl()
      .then((res) => {
        if (res?.url) recordLaunchUrl(res.url);
      })
      .catch(() => {
        // ignore
      });

    let handle: PluginListenerHandle | null = null;

    App.addListener("appUrlOpen", (event) => {
      const url = event?.url || "";
      if (!url) return;

      recordDeepLinkUrl(url);

      // Defer async work to avoid blocking the native listener thread.
      window.setTimeout(() => {
        (async () => {
          try {
            await tryExchangeOAuthCode(url);
          } catch {
            // ignore here; Auth page will show errors if needed
          }

          // Route mapping
          // - dialroad://auth?code=... -> complete login and go home
          // - dialroad://debug-deeplinks -> open debug page
          try {
            const parsed = new URL(url);
            const hostOrPath = (parsed.host || parsed.pathname || "").replace(/^\//, "");
            if (hostOrPath === "debug-deeplinks") {
              navigate("/debug-deeplinks", { replace: true });
              return;
            }
          } catch {
            // ignore
          }

          navigate("/", { replace: true });
        })();
      }, 0);
    }).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, [navigate]);

  return null;
}
