export type GenerationType = "image" | "video";

export type AppTheme = "day" | "night" | "degen";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "21:9";

export type ModelProvider =
  | "auto"
  | "mock"
  | "openai"
  | "pollinations"
  | "google"
  | "stability"
  | "huggingface"
  | "xai"
  | "bfl";

export type CredentialProvider = Extract<
  ModelProvider,
  "openai" | "google" | "stability" | "huggingface" | "xai" | "bfl"
>;

export type ApiCredentialStorage = "session" | "local";

export type ApiCredential = {
  id: string;
  provider: CredentialProvider;
  label: string;
  key: string;
  storage: ApiCredentialStorage;
  createdAt: string;
};

export type SourceImage = {
  dataUrl: string;
  name: string;
  mimeType: string;
  width?: number;
  height?: number;
};

export type GenerationRequest = {
  token: string;
  narrative: string;
  toneId: string;
  styleId: string;
  templateId: string;
  type: GenerationType;
  modelId?: string;
  modelIds?: string[];
  sourceImage?: SourceImage;
  characterName?: string;
  modificationId?: string;
  consistencyId?: string;
  seed?: string;
  apiKey?: string;
  aspectRatio?: AspectRatio;
  enhancePrompt?: boolean;
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
  modelId?: string;
  sourceImageUrl?: string;
  aspectRatio?: AspectRatio;
  status?: "ready" | "error";
  error?: string;
  notes?: string[];
};

export type ApiError = {
  error: string;
};
