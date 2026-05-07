import {
  getConsistencyPreset,
  getModificationPreset
} from "@/lib/registries/modifications";
import { getStylePreset } from "@/lib/registries/styles";
import type { BuiltPrompt, GenerationRequest, GenerationResult } from "@/lib/types";

type MockInput = {
  input: GenerationRequest;
  builtPrompt: BuiltPrompt;
  model: string;
  seed: string;
};

export async function generateMockCreative({
  input,
  builtPrompt,
  model,
  seed
}: MockInput): Promise<GenerationResult> {
  const imageUrl = makeMockImage(input, seed);
  const videoPrompt =
    input.type === "video"
      ? [
          builtPrompt.prompt,
          "Shot plan: 0-1s character hook, 1-3s market signal, 3-5s narrative reveal, 5-7s final SLAPR lockup.",
          "Motion: preserve the uploaded character silhouette across every cut, punchy transitions, clean end card."
        ].join("\n\n")
      : undefined;

  return {
    imageUrl,
    prompt: builtPrompt.prompt,
    videoPrompt,
    provider: "slapr-local",
    model,
    modelId: input.modelId,
    type: input.type,
    seed,
    sourceImageUrl: input.sourceImage?.dataUrl,
    aspectRatio: input.aspectRatio,
    status: "ready",
    notes: input.sourceImage
      ? ["Local preview keeps the uploaded image visible as the identity anchor."]
      : ["Upload a PFP or NFT to enable character-lock previews."]
  };
}

function makeMockImage(input: GenerationRequest, seed: string): string {
  const style = getStylePreset(input.styleId);
  const modification = getModificationPreset(input.modificationId);
  const consistency = getConsistencyPreset(input.consistencyId);
  const palette = style.swatch;
  const accent = "#FF2D2D";
  const warn = palette[2] ?? "#F8D35A";
  const cool = palette[1] && palette[1] !== accent ? palette[1] : "#7DD3FC";
  const hue = hash(seed + input.token + input.modelId) % 360;
  const token = escapeXml(input.token.trim().slice(0, 28) || "SLAPR");
  const character = escapeXml(input.characterName?.trim().slice(0, 28) || "PFP");
  const label = escapeXml(modification.label.toUpperCase());
  const lock = escapeXml(consistency.label.toUpperCase());
  const mode = input.type === "video" ? "VIDEO PROMPT" : "IMAGE EDIT";
  const lines = wrapText(input.narrative.trim() || "Market narrative goes here", 32, 3).map(escapeXml);
  const chart = makeChartPoints(seed);
  const sourceImage = input.sourceImage?.dataUrl;
  const sourceMarkup = sourceImage
    ? `<image href="${escapeXml(sourceImage)}" x="418" y="270" width="364" height="364" preserveAspectRatio="xMidYMid slice" clip-path="url(#pfpClip)"/>
       <rect x="418" y="270" width="364" height="364" rx="42" fill="none" stroke="${accent}" stroke-width="8"/>
       <rect x="438" y="650" width="324" height="48" rx="14" fill="#101113" stroke="#FFFFFF" stroke-opacity="0.16"/>
       <text x="600" y="681" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="900" fill="#FFFFFF">${character} LOCKED</text>`
    : `<rect x="418" y="270" width="364" height="364" rx="42" fill="#191B1F" stroke="${accent}" stroke-width="8"/>
       <text x="600" y="462" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="132" font-weight="950" fill="${accent}">S</text>
       <text x="600" y="542" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF">DROP IMAGE</text>`;
  const variant = input.modelId === "mock-remix-board" ? "REMIX BOARD" : "CHARACTER LOCK";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0A0B0D"/>
      <stop offset="0.46" stop-color="#17191D"/>
      <stop offset="1" stop-color="hsl(${hue}, 48%, 14%)"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
    <clipPath id="pfpClip">
      <rect x="418" y="270" width="364" height="364" rx="42"/>
    </clipPath>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1200" height="1200" fill="url(#bg)"/>
  <rect width="1200" height="1200" fill="url(#grid)"/>
  <path d="M104 780 C250 650 370 748 508 624 C662 486 775 548 1096 292" fill="none" stroke="${accent}" stroke-width="30" stroke-linecap="round" opacity="0.24"/>
  <polyline points="${chart}" fill="none" stroke="${warn}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="url(#softGlow)"/>
  <rect x="72" y="76" width="1056" height="1048" rx="34" fill="none" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="2"/>
  <rect x="114" y="118" width="302" height="56" rx="12" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-opacity="0.52"/>
  <text x="144" y="154" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" fill="${accent}">SLAPR.AI</text>
  <text x="930" y="153" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#FFFFFF" fill-opacity="0.76">${mode}</text>
  <text x="120" y="248" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="950" fill="#FFFFFF">${token}</text>
  ${sourceMarkup}
  <g transform="translate(120 724)">
    <rect width="960" height="116" rx="22" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.13"/>
    <text x="30" y="44" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900" fill="${cool}">${variant}</text>
    <text x="30" y="86" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="950" fill="#FFFFFF">${label} / ${lock}</text>
  </g>
  <g font-family="Inter, Arial, sans-serif" font-size="45" font-weight="900" fill="#FFFFFF">
    ${lines.map((line, index) => `<text x="120" y="${924 + index * 58}">${line}</text>`).join("")}
  </g>
  <g transform="translate(810 270)">
    <rect width="270" height="132" rx="18" fill="#101113" fill-opacity="0.78" stroke="${accent}" stroke-opacity="0.5"/>
    <text x="28" y="48" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF" fill-opacity="0.62">SEED</text>
    <text x="28" y="96" font-family="Inter, Arial, sans-serif" font-size="35" font-weight="950" fill="${warn}">${escapeXml(seed.slice(0, 8).toUpperCase())}</text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result << 5) - result + value.charCodeAt(index);
    result |= 0;
  }
  return Math.abs(result);
}

function makeChartPoints(seed: string): string {
  const base = hash(seed);
  const points = Array.from({ length: 9 }, (_, index) => {
    const x = 126 + index * 116;
    const y = 700 - ((base >> (index % 8)) & 120) - index * 24 + (index % 2) * 40;
    return `${x},${Math.max(250, Math.min(735, y))}`;
  });
  return points.join(" ");
}

function wrapText(value: string, width: number, maxLines: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }

    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines.length > 0 ? lines : ["Crypto narrative"];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
