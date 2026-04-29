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
  const imageUrl = makeMockImage(input, builtPrompt, seed);
  const videoPrompt =
    input.type === "video"
      ? [
          builtPrompt.prompt,
          "Shot plan: 0-1s ticker impact frame, 1-3s liquidity sweep, 3-5s narrative reveal, 5-7s final brand lockup.",
          "Motion: punchy cuts, chart-line transitions, subtle camera push, clean end card."
        ].join("\n\n")
      : undefined;

  return {
    imageUrl,
    prompt: builtPrompt.prompt,
    videoPrompt,
    provider: "mock",
    model,
    type: input.type,
    seed
  };
}

function makeMockImage(input: GenerationRequest, builtPrompt: BuiltPrompt, seed: string): string {
  const style = getStylePreset(input.styleId);
  const palette = style.swatch;
  const accent = palette[1] ?? "#63F1B5";
  const warn = palette[2] ?? "#F8D35A";
  const hue = hash(seed + input.token) % 360;
  const token = escapeXml(input.token.trim().slice(0, 28) || "SLAPR");
  const label = escapeXml(builtPrompt.metadata.style.toUpperCase());
  const mode = input.type === "video" ? "VIDEO PROMPT" : "IMAGE DROP";
  const lines = wrapText(input.narrative.trim() || "Market narrative goes here", 34, 3).map(escapeXml);
  const chart = makeChartPoints(seed);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#101113"/>
      <stop offset="0.48" stop-color="#191B1F"/>
      <stop offset="1" stop-color="hsl(${hue}, 45%, 14%)"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
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
  <path d="M120 778 C274 648 359 771 497 626 C641 475 771 545 1080 305" fill="none" stroke="${accent}" stroke-width="26" stroke-linecap="round" opacity="0.26"/>
  <polyline points="${chart}" fill="none" stroke="${warn}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="url(#softGlow)"/>
  <circle cx="914" cy="312" r="152" fill="${accent}" opacity="0.14"/>
  <circle cx="914" cy="312" r="94" fill="none" stroke="${accent}" stroke-width="4" opacity="0.75"/>
  <circle cx="914" cy="312" r="55" fill="#101113" stroke="${warn}" stroke-width="6"/>
  <text x="914" y="331" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="800" fill="${warn}">$</text>
  <rect x="72" y="76" width="1056" height="1048" rx="34" fill="none" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="2"/>
  <rect x="116" y="118" width="294" height="54" rx="12" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.12"/>
  <text x="144" y="153" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="${accent}">SLAPR.AI</text>
  <text x="930" y="153" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF" fill-opacity="0.72">${mode}</text>
  <text x="116" y="322" font-family="Inter, Arial, sans-serif" font-size="122" font-weight="900" letter-spacing="0" fill="#FFFFFF">${token}</text>
  <rect x="120" y="382" width="210" height="42" rx="8" fill="${warn}" fill-opacity="0.95"/>
  <text x="144" y="410" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900" fill="#101113">${label}</text>
  <g font-family="Inter, Arial, sans-serif" font-size="48" font-weight="800" fill="#FFFFFF">
    ${lines.map((line, index) => `<text x="120" y="${535 + index * 64}">${line}</text>`).join("")}
  </g>
  <g transform="translate(120 836)">
    <rect width="418" height="126" rx="16" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.11"/>
    <text x="30" y="47" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF" fill-opacity="0.58">SIGNAL</text>
    <text x="30" y="94" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="900" fill="${accent}">VIRAL READY</text>
  </g>
  <g transform="translate(592 836)">
    <rect width="488" height="126" rx="16" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.11"/>
    <text x="30" y="47" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF" fill-opacity="0.58">SEED</text>
    <text x="30" y="94" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="900" fill="${warn}">${escapeXml(seed.slice(0, 12).toUpperCase())}</text>
  </g>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
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
    const y = 740 - ((base >> (index % 8)) & 120) - index * 26 + (index % 2) * 42;
    return `${x},${Math.max(260, Math.min(760, y))}`;
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
