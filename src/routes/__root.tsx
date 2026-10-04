import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Home, FileText, BarChart3, UserCheck, Tractor } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerAppServiceWorker } from "../lib/pwa-register";
import { useSyncEngine } from "../lib/sync";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kopi — Coffee Leaf Checker" },
      {
        name: "description",
        content:
          "Offline-first coffee leaf diagnosis for smallholder farmers. Photograph a leaf, get trusted agronomist-checked advice — no signal needed.",
      },
      { property: "og:title", content: "Kopi — Coffee Leaf Checker" },
      {
        property: "og:description",
        content:
          "Offline-first coffee leaf diagnosis for smallholder farmers. Photograph a leaf, get trusted advice — no signal needed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#5b8def" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "My farm", icon: Tractor },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/market", label: "Market", icon: BarChart3 },
  { to: "/officer", label: "Officer", icon: UserCheck },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    void registerAppServiceWorker();
  }, []);
  useSyncEngine();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-dvh overflow-hidden bg-background">
        {/* Ambient drifting light blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand/25 blur-3xl animate-drift" />
        <div
          className="pointer-events-none absolute top-10 right-0 h-96 w-96 rounded-full bg-violet/25 blur-3xl animate-drift"
          style={{ animationDuration: "18s" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-teal/20 blur-3xl animate-drift"
          style={{ animationDuration: "14s" }}
        />

        <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pt-4">
          <Outlet />
        </div>

        {/* Bottom navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-center border-t border-white/50 bg-white/50 px-4 pb-4 pt-3 backdrop-blur-xl">
          <div className="grid w-full max-w-md grid-cols-5">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium text-muted-foreground"
                activeProps={{ className: "flex flex-col items-center gap-1 py-1.5 text-[11px] font-semibold text-primary" }}
              >
                <Icon className="size-5" strokeWidth={2} />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </QueryClientProvider>
  );
}
