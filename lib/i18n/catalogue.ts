type Value = string | Readonly<Partial<Record<Intl.LDMLPluralRule, string>>>;
type Groups = Readonly<Record<string, Readonly<Record<string, Value>>>>;
type Keys<G extends Groups> = { [N in keyof G]: `${N & string}.${keyof G[N] & string}` }[keyof G];
type Catalogue<G extends Groups> = {
  readonly [K in Keys<G>]: K extends `${infer N}.${infer S}`
    ? N extends keyof G ? S extends keyof G[N] ? G[N][S] : never : never : never;
};

// Trusted, bundled catalogues group their keys by namespace so each prefix is
// shipped once. Expand to the existing public keys before registration; retain
// literal key/value types, including plural forms, for every translation call.
export function catalogue<const G extends Groups>(groups: G): Catalogue<G> {
  return Object.fromEntries(Object.entries(groups).flatMap(([namespace, entries]) =>
    Object.entries(entries).map(([key, value]) => [`${namespace}.${key}`, value]))) as Catalogue<G>;
}
