export type StylePreset = {
  id: string;
  label: string;
  description: string;
  swatch: string[];
  prompt: string;
};

export const stylePresets: StylePreset[] = [
  {
    id: "meme-terminal",
    label: "Meme Terminal",
    description: "Terminal UI, ticks, warnings, punchline-ready.",
    swatch: ["#101113", "#63F1B5", "#F8D35A"],
    prompt:
      "crypto terminal dashboard composition, candlestick fragments, memetic warning labels, crisp UI overlays, social square poster"
  },
  {
    id: "token-card",
    label: "Token Card",
    description: "Collectible coin card for launches.",
    swatch: ["#18181B", "#7DD3FC", "#E879F9"],
    prompt:
      "collectible token trading card, metallic coin centerpiece, rarity details, clean badge system, high contrast product render"
  },
  {
    id: "chart-myth",
    label: "Chart Myth",
    description: "Cinematic chart lore.",
    swatch: ["#0C0F14", "#FF6D7A", "#F8D35A"],
    prompt:
      "cinematic crypto myth poster, dramatic chart architecture, glowing liquidity trails, epic scale, sharp social media finish"
  },
  {
    id: "pixel-floor",
    label: "Pixel Floor",
    description: "Retro on-chain arcade.",
    swatch: ["#111827", "#34D399", "#F472B6"],
    prompt:
      "pixel-art crypto arcade scene, on-chain floor price board, compact character silhouettes, clean readable social composition"
  },
  {
    id: "listing-day",
    label: "Listing Day",
    description: "Exchange-grade launch visual.",
    swatch: ["#121212", "#FFFFFF", "#63F1B5"],
    prompt:
      "exchange listing announcement poster, clean ticker typography, liquidity map backdrop, premium launch campaign visual"
  }
];

export function getStylePreset(id: string): StylePreset {
  return stylePresets.find((style) => style.id === id) ?? stylePresets[0];
}
