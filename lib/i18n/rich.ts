import { Fragment, createElement, type ReactNode } from "react";

// Splits a translated message on the tags its component supplies, rendering
// each tagged chunk with that tag's function. Text outside a tag, and a tag the
// component did not supply, stays text.
export function richText(text: string, tags: Record<string, (chunk: string) => ReactNode>): ReactNode {
  const names = Object.keys(tags).join("|");
  if (!names) return text;
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(new RegExp(`<(${names})>([\\s\\S]*?)</\\1>`, "g"))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(createElement(Fragment, { key: parts.length }, tags[match[1]](match[2])));
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
