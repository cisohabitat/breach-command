// Setting only: the accompanying sector name and briefing carry the meaning.
// A plain image of the precompressed local asset, so it works in the offline
// cache; next/image would add its script for nothing, since nothing is resized.
export function SectorIllustration({ scenarioId }: { scenarioId: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="sector-illustration" src={`/art/sectors/${scenarioId}.webp`} alt="" width={960} height={640} decoding="async" />;
}
