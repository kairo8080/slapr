export type GenerationType = "image" | "video";

export type GenerationRequest = {
  token: string;
  narrative: string;
  toneId: string;
  styleId: string;
  templateId: string;
  type: GenerationType;
  modelId?: string;
  seed?: string;
};

export type BuiltPrompt = {
  prompt: string;
  title: string;
  negativePrompt: string;
  metadata: {
    tone: string;
    style: string;
    template: string;
  };
};

export type GenerationResult = {
  imageUrl: string;
  prompt: string;
  videoPrompt?: string;
  provider: string;
  model: string;
  type: GenerationType;
  seed: string;
};

export type ApiError = {
  error: string;
};
