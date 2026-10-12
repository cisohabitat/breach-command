import type { SpecialistId } from "@/lib/command-systems";
import { DecorativeImage } from "./decorative-image";

export { evidenceArtFor } from "@/lib/art";

// Decorative illustrations accompany the real, accessible game record. Plain
// images of local WebP files: next/image would add its script for nothing.
export function SpecialistPortrait({ specialist }: { specialist: SpecialistId }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="specialist-portrait" src={`/art/portraits/${specialist}.webp`} alt="" width={256} height={256} loading="lazy" decoding="async" />;
}

export function StoryArt({ kind, name }: { kind: "campaign" | "endings" | "evidence" | "adversaries"; name: string }) {
  const scene = kind === "campaign" || kind === "endings";
  const width = kind === "adversaries" ? 256 : kind === "evidence" ? 480 : 960;
  const height = kind === "adversaries" ? 256 : kind === "evidence" ? 320 : 480;
  return <DecorativeImage key={`${kind}/${name}`} className={`story-art story-art-${kind}`} src={`/art/${kind}/${name}.webp`}
    srcSet={scene ? `/art/${kind}/${name}-480.webp 480w, /art/${kind}/${name}.webp 960w` : undefined}
    sizes={scene ? "(max-width: 600px) calc(100vw - 48px), (max-width: 1100px) 480px, 640px" : undefined}
    width={width} height={height}
  />;
}
