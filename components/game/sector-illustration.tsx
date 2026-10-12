import { DecorativeImage } from "./decorative-image";

// Setting only: the accompanying sector name and briefing carry the meaning.
// A plain image of the precompressed local asset, so it works in the offline
// cache; next/image would add its script for nothing, since nothing is resized.
// The sizes are the widths it is shown at, measured on the assignment: about
// 250 to 520 px on a phone, 680 at tablet width and 550 to 600 on a desk.
export function SectorIllustration({ scenarioId }: { scenarioId: string }) {
  return <DecorativeImage key={scenarioId} className="sector-illustration" src={`/art/sectors/${scenarioId}.webp`}
    srcSet={`/art/sectors/${scenarioId}-480.webp 480w, /art/sectors/${scenarioId}.webp 960w`}
    sizes="(max-width: 600px) calc(100vw - 72px), (max-width: 900px) 680px, 600px"
    width={960} height={640}
  />;
}
