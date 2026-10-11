import type { SpecialistId } from "@/lib/command-systems";

// Decorative illustrations accompany the real, accessible game record. Plain
// images of local WebP files: next/image would add its script for nothing.
export function SpecialistPortrait({ specialist }: { specialist: SpecialistId }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="specialist-portrait" src={`/art/portraits/${specialist}.webp`} alt="" width={256} height={256} loading="lazy" decoding="async" />;
}

export function StoryArt({ kind, name }: { kind: "campaign" | "endings" | "evidence"; name: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`story-art story-art-${kind}`} src={`/art/${kind}/${name}.webp`} alt="" width={kind === "evidence" ? 480 : 960} height={kind === "evidence" ? 320 : 480} loading="lazy" decoding="async" />;
}
