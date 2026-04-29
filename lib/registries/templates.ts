export type TemplatePreset = {
  id: string;
  label: string;
  aspect: string;
  prompt: string;
};

export const templatePresets: TemplatePreset[] = [
  {
    id: "square-post",
    label: "Square",
    aspect: "1:1",
    prompt: "compose for a 1:1 X and Telegram feed post with readable central subject"
  },
  {
    id: "story",
    label: "Story",
    aspect: "9:16",
    prompt: "compose for a vertical 9:16 story with safe top and bottom margins"
  },
  {
    id: "wide-banner",
    label: "Banner",
    aspect: "16:9",
    prompt: "compose for a 16:9 launch banner with strong center-left subject balance"
  }
];

export function getTemplatePreset(id: string): TemplatePreset {
  return templatePresets.find((template) => template.id === id) ?? templatePresets[0];
}
