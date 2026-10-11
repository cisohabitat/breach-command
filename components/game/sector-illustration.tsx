import Image from "next/image";

// Setting only: the accompanying sector name and briefing carry the meaning.
// Serve the precompressed local asset directly so it works in the offline cache.
export function SectorIllustration({ scenarioId }: { scenarioId: string }) {
  return <Image className="sector-illustration" src={`/art/sectors/${scenarioId}.webp`} alt="" width={960} height={640} unoptimized />;
}
