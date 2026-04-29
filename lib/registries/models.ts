export type ModelProvider = "auto" | "mock" | "openai";

export type ModelPreset = {
  id: string;
  label: string;
  provider: ModelProvider;
  output: "image" | "video-prompt" | "auto";
  modelName?: string;
};

export const modelPresets: ModelPreset[] = [
  {
    id: "auto",
    label: "Auto",
    provider: "auto",
    output: "auto"
  },
  {
    id: "mock-social-image",
    label: "Mock Social Image",
    provider: "mock",
    output: "image",
    modelName: "slapr-mock-v0"
  },
  {
    id: "openai-gpt-image",
    label: "OpenAI Image",
    provider: "openai",
    output: "image",
    modelName: "gpt-image-1"
  },
  {
    id: "mock-video-prompt",
    label: "Video Prompt Mock",
    provider: "mock",
    output: "video-prompt",
    modelName: "slapr-video-prompt-v0"
  }
];

export function getModelPreset(id = "auto"): ModelPreset {
  return modelPresets.find((model) => model.id === id) ?? modelPresets[0];
}
