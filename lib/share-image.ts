import type { ShareCard } from "./advanced-game.ts";
import { translate, type Locale } from "./i18n/index.ts";
import { say } from "./i18n/message.ts";

// The result as an image, drawn on the device: a paper result form on the dark
// desk, in the form face. Nothing is sent anywhere, and it is drawn only from
// the share card, which names no technique, in the player's language.
export async function drawShareCard(card: ShareCard, origin: string, locale: Locale): Promise<Blob> {
  const width = 1200, height = 630;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  await document.fonts?.ready;
  const face = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "sans-serif";
  // i18n: maintainer English. A CSS font list, not words.
  const font = (weight: number, size: number) => `${weight} ${size}px ${face}, "Arial Narrow", sans-serif`;
  const ink = "#1d1b18", rule = "#1d1b18", soft = "#5b564d";

  context.fillStyle = "#111417";
  context.fillRect(0, 0, width, height);
  const x = 80, y = 60, w = width - 160, h = height - 120;
  context.fillStyle = "#efe9dc";
  context.fillRect(x, y, w, h);

  context.fillStyle = soft;
  context.font = font(600, 22);
  context.fillText(say(card.form, locale), x + 48, y + 64);
  context.fillStyle = ink;
  context.font = font(600, 56);
  context.fillText(fit(context, card.title, w - 96), x + 48, y + 136);
  context.fillStyle = soft;
  context.font = font(500, 24);
  context.fillText(fit(context, say(card.meta, locale), w - 96), x + 48, y + 178);

  // The result as a row of form cells sharing their borders.
  const cells: [string, string][] = [[translate(locale, "ending.imageResult"), say(card.result, locale)], [translate(locale, "ending.imageScore"), say(card.score, locale)]];
  const top = y + 214, cellHeight = 110, columns = [0.64, 0.36];
  context.strokeStyle = rule;
  context.lineWidth = 2;
  let left = x + 48;
  for (const [index, [label, value]] of cells.entries()) {
    const cellWidth = (w - 96) * columns[index];
    context.strokeRect(left, top, cellWidth, cellHeight);
    context.fillStyle = soft;
    context.font = font(500, 18);
    context.fillText(label, left + 16, top + 30);
    context.fillStyle = ink;
    context.font = font(600, index === 1 ? 40 : 30);
    context.fillText(fit(context, value, cellWidth - 32), left + 16, top + 82);
    left += cellWidth;
  }

  context.fillStyle = ink;
  context.font = font(500, 26);
  context.fillText(fit(context, say(card.stages, locale), w - 96), x + 48, top + cellHeight + 52);
  context.font = font(600, 26);
  const foot = card.code ? translate(locale, "ending.imageReplay", { code: card.code }) : translate(locale, "ending.imageCampaign");
  context.fillText(fit(context, foot, w - 96), x + 48, top + cellHeight + 98);
  context.fillStyle = soft;
  context.font = font(500, 22);
  context.fillText(fit(context, translate(locale, card.expert ? "ending.imageSiteExpert" : "ending.imageSite", { site: origin.replace(/^https?:\/\//, "") }), w - 96), x + 48, top + cellHeight + 140);

  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("No image")), "image/png"));
}

function fit(context: CanvasRenderingContext2D, text: string, room: number) {
  if (context.measureText(text).width <= room) return text;
  let cut = text;
  while (cut.length > 1 && context.measureText(`${cut}…`).width > room) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}
