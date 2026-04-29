export type TonePreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export const tonePresets: TonePreset[] = [
  {
    id: "degen",
    label: "Degen",
    description: "Fast, loud, meme-native.",
    prompt: "degen internet energy, sharp humor, market-aware, irreverent but polished"
  },
  {
    id: "bullish",
    label: "Bullish",
    description: "Confident launch momentum.",
    prompt: "bullish conviction, high momentum, optimistic, high-signal launch energy"
  },
  {
    id: "premium",
    label: "Premium",
    description: "Institutional and crisp.",
    prompt: "premium crypto brand language, confident, refined, credible, minimal"
  },
  {
    id: "chaos",
    label: "Chaos",
    description: "Volatile and viral.",
    prompt: "chaotic market energy, surreal meme tension, urgent, highly shareable"
  }
];

export function getTonePreset(id: string): TonePreset {
  return tonePresets.find((tone) => tone.id === id) ?? tonePresets[0];
}
