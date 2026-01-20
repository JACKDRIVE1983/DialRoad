import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type DebugState = {
  lastDeepLinkUrl: string;
  lastDeepLinkAt: string;
  lastDeepLinkParsed: string;
  lastLaunchUrl: string;
  lastLaunchAt: string;
};

function readDebugState(): DebugState {
  const safeGet = (k: string) => {
    try {
      return localStorage.getItem(k) || "";
    } catch {
      return "";
    }
  };

  return {
    lastDeepLinkUrl: safeGet("last_deeplink_url"),
    lastDeepLinkAt: safeGet("last_deeplink_at"),
    lastDeepLinkParsed: safeGet("last_deeplink_parsed"),
    lastLaunchUrl: safeGet("last_launch_url"),
    lastLaunchAt: safeGet("last_launch_at"),
  };
}

export default function DebugDeepLinks() {
  const [state, setState] = useState<DebugState>(() => readDebugState());

  useEffect(() => {
    const id = window.setInterval(() => setState(readDebugState()), 500);
    return () => window.clearInterval(id);
  }, []);

  const clear = () => {
    try {
      [
        "last_deeplink_url",
        "last_deeplink_at",
        "last_deeplink_parsed",
        "last_launch_url",
        "last_launch_at",
      ].forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    setState(readDebugState());
  };

  return (
    <main className="min-h-screen bg-background p-4">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-foreground">Debug Deep Links</h1>
        <p className="text-sm text-muted-foreground">
          Se qui vedi <code>lastLaunchUrl</code> vuoto su avvio da link, allora il sistema operativo non sta passando
          l’URL all’app (problema di configurazione intent/app links).
        </p>
      </header>

      <section className="space-y-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-sm text-muted-foreground">lastLaunchAt</div>
          <div className="text-sm text-foreground break-all">{state.lastLaunchAt || "(empty)"}</div>
          <div className="mt-2 text-sm text-muted-foreground">lastLaunchUrl</div>
          <div className="text-sm text-foreground break-all">{state.lastLaunchUrl || "(empty)"}</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-sm text-muted-foreground">lastDeepLinkAt</div>
          <div className="text-sm text-foreground break-all">{state.lastDeepLinkAt || "(empty)"}</div>
          <div className="mt-2 text-sm text-muted-foreground">lastDeepLinkUrl</div>
          <div className="text-sm text-foreground break-all">{state.lastDeepLinkUrl || "(empty)"}</div>
          <div className="mt-2 text-sm text-muted-foreground">lastDeepLinkParsed</div>
          <pre className="mt-1 text-xs text-foreground whitespace-pre-wrap break-words">
            {state.lastDeepLinkParsed || "(empty)"}
          </pre>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setState(readDebugState())}>
            Aggiorna
          </Button>
          <Button variant="destructive" onClick={clear}>
            Pulisci
          </Button>
        </div>
      </section>
    </main>
  );
}
