import { DecorativeImage } from "./decorative-image";

// Setting only: the accompanying sector name and briefing carry the meaning.
// A plain image of the precompressed local asset, so it works in the offline
// cache; next/image would add its script for nothing, since nothing is resized.
export function SectorIllustration({ scenarioId }: { scenarioId: string }) {
  return <DecorativeImage key={scenarioId} className="sector-illustration" src={`/art/sectors/${scenarioId}.webp`}
    srcSet={`/art/sectors/${scenarioId}-480.webp 480w, /art/sectors/${scenarioId}.webp 960w`}
    sizes="(max-width: 600px) calc(100vw - 48px), (max-width: 1100px) 480px, 640px"
    width={960} height={640}
  />;
}
