import { type Metadata, Viewport } from "next";

import { getTranslations } from "next-intl/server";
import React from "react";

export async function generateMetadata({
  params: { locale },
}: Readonly<{
  params: { locale: string };
}>) {
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL("https://latentbox.com"),
    title: {
      template: t("title.template"),
      default: t("title.default"),
    },
    description: t("description"),
    keywords: [
      t("keywords.0"),
      t("keywords.1"),
      t("keywords.2"),
      t("keywords.3"),
      t("keywords.4"),
      t("keywords.5"),
      t("keywords.6"),
      t("keywords.7"),
      t("keywords.8"),
      t("keywords.9"),
    ],
    openGraph: {
      images:
        "/assets/resources/latentbox-hero.jpg",
    },
    icons: {
      icon: [
        { url: "/datadog.svg?v=3", type: "image/svg+xml", sizes: "any" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      ],
      shortcut: [
        { url: "/datadog.svg?v=3", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180" },
      ],
      other: [
        { rel: "mask-icon", url: "/datadog.svg?v=3", color: "#000000" as any },
      ],
    },
  } satisfies Metadata;
}

export const layoutViewport: Viewport = {
  themeColor: "black",
  width: "device-width",
  height: "device-height",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
};

export function LayoutHead() {
  return (
    <head>
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" sizes="any" type="image/svg+xml" href="/datadog.svg?v=3" />
      <link rel="shortcut icon" type="image/svg+xml" href="/datadog.svg?v=3" />
      <link rel="mask-icon" href="/datadog.svg?v=3" color="#000000" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      {/* 移除 ico 回退，避免覆盖 SVG 显示 */}
      <meta content="yes" name="apple-mobile-web-app-capable" />
      <meta name="theme-color" content="#000000" />
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5528400803664104"
        crossOrigin="anonymous"
      >

      </script>
    </head>
  );
}
