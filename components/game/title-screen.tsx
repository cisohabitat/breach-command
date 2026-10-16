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
      <picture className="title-art">
        <source media="(max-aspect-ratio: 1/1)" srcSet="/art/title/portrait.jpg" />
        {/* Preserve the supplied posters' full composition. Picture requests
            only the image matching the viewport; the heading names the game. */}
        <img src="/art/title/landscape.jpg" width="1280" height="960" alt="" fetchPriority="high" />
      </picture>
      <div className="title-entry">
        <a className="title-start" href={locale === "en" ? "/play" : `/play?locale=${locale}`}>{t("titleScreen.start")}</a>
        <p>{t("titleScreen.description")}</p>
      </div>
    </main>
  );
}
