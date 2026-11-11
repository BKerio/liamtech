import type { Metadata, Viewport } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Suspense } from "react";
import Toasts from "@/components/Toasts";
import ScrollToTop from "@/components/ScrollToTop";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: `${SITE.name} — ${SITE.tagline}. Genuine auto parts in Kenya.`,
  icons: [{ rel: "icon", type: "image/svg+xml", url: "/static/img/favicon.svg" }],
  openGraph: { title: SITE.name, description: SITE.tagline, type: "website", siteName: SITE.name },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 0.25,
  maximumScale: 1.6,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css?family=Raleway:400,700&display=swap" rel="stylesheet" />
        {/* The original compiled theme (Bootstrap 4 + Regulus/Oscar theme) served verbatim from /public */}
        <link type="text/css" href="/static/webpack_bundles/main.css" rel="stylesheet" />
        <link type="text/css" href="/static/app.css" rel="stylesheet" />
      </head>
      <body id="default">
        <div className="page">
          <Header />
          <main className="page-main">{children}</main>
          <Footer />
        </div>
        <Toasts />
        <Suspense>
          <ScrollToTop />
        </Suspense>
      </body>
    </html>
  );
}
