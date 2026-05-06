export type ModificationPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export type ConsistencyPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export const modificationPresets: ModificationPreset[] = [
  {
    id: "pfp-remix",
    label: "PFP Remix",
    description: "Fresh profile image while keeping the character intact.",
    prompt:
      "create a polished profile-picture remix with the same main character centered, sharper crypto-native styling, and a clean background"
  },
  {
    id: "meme-card",
    label: "Meme Card",
    description: "Social post with punchline space.",
    prompt:
      "turn the character into a crypto meme card with a strong visual hook, bold caption space, and readable social-feed hierarchy"
  },
  {
    id: "launch-poster",
    label: "Launch Poster",
    description: "Token campaign visual.",
    prompt:
      "turn the character into a launch poster hero with ticker energy, liquidity motion, and premium campaign framing"
  },
  {
    id: "sticker",
    label: "Sticker",
    description: "Clean transparent-style character asset.",
    prompt:
      "turn the character into a crisp sticker-style asset with bold outline, expressive pose, and minimal background clutter"
  }
];

export const consistencyPresets: ConsistencyPreset[] = [
  {
    id: "strict",
    label: "Strict",
    description: "Maximum identity lock.",
    prompt:
      "strictly preserve the character identity, face or head shape, silhouette, species or avatar type, signature colors, expression, accessories, and recognizable NFT/PFP traits"
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Character lock with more styling room.",
    prompt:
      "preserve the character identity and most recognizable traits while allowing clothing, background, lighting, and composition changes"
  },
  {
    id: "wild",
    label: "Wild",
    description: "Bigger remix, still recognizable.",
    prompt:
      "keep the character recognizable, but allow a more dramatic pose, environment, styling, and crypto meme transformation"
  }
];

export function getModificationPreset(id = "pfp-remix"): ModificationPreset {
  return (
    modificationPresets.find((modification) => modification.id === id) ?? modificationPresets[0]
  );
}

export function getConsistencyPreset(id = "strict"): ConsistencyPreset {
  return consistencyPresets.find((consistency) => consistency.id === id) ?? consistencyPresets[0];
}
