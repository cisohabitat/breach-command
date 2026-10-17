"use client";

import { useMessages } from "@/hooks/use-messages";
import { register } from "@/lib/i18n";
import { titleScreenMessages } from "@/lib/i18n/en/title-screen";

register(titleScreenMessages);

export function TitleScreen() {
  const { t, locale } = useMessages();
  return (
    <main className="title-screen">
      <h1 className="sr-only">{t("titleScreen.title")}</h1>
      <div className="title-stage">
        <picture className="title-art">
          <source media="(max-aspect-ratio: 1/1)" srcSet="/art/title/portrait.jpg" />
          {/* Fill the viewport with the matching poster, cropping its edges.
              Picture requests one image; the heading names the game. */}
          <img src="/art/title/landscape.jpg" width="1280" height="960" alt="" fetchPriority="high" />
        </picture>
        <p className="title-build build-version">{t("titleScreen.build", { version: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown", build: process.env.NEXT_PUBLIC_BUILD_ID ?? "local" })}</p>
        <div className="title-entry">
          <a className="title-start" aria-describedby="title-description" href={locale === "en" ? "/play" : `/play?locale=${locale}`}>{t("titleScreen.start")}</a>
          <p id="title-description" className="sr-only">{t("titleScreen.description")}</p>
        </div>
      </div>
    </main>
  );
}
