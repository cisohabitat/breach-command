import Image from "next/image";
import type { SpecialistId } from "@/lib/command-systems";

// Decorative illustrations accompany the real, accessible game record.
export function SpecialistPortrait({ specialist }: { specialist: SpecialistId }) {
  return <Image className="specialist-portrait" src={`/art/portraits/${specialist}.webp`} alt="" width={256} height={256} unoptimized loading="lazy" />;
}

export function StoryArt({ kind, name }: { kind: "campaign" | "endings" | "evidence"; name: string }) {
  return <Image className={`story-art story-art-${kind}`} src={`/art/${kind}/${name}.webp`} alt="" width={kind === "evidence" ? 480 : 960} height={kind === "evidence" ? 320 : 480} unoptimized loading="lazy" />;
}
