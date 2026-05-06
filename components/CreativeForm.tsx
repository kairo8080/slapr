"use client";

/* eslint-disable @next/next/no-img-element */
import {
  Check,
  Film,
  Flame,
  ImageIcon,
  KeyRound,
  Layers2,
  Loader2,
  Moon,
  Server,
  Sparkles,
  Sun,
  Upload,
  X,
  type LucideIcon
} from "lucide-react";
import { useRef, useState } from "react";
import { consistencyPresets, modificationPresets } from "@/lib/registries/modifications";
import {
  getProviderPreset,
  isCredentialProvider,
  modelPresets
} from "@/lib/registries/models";
import { stylePresets } from "@/lib/registries/styles";
import { templatePresets } from "@/lib/registries/templates";
import { tonePresets } from "@/lib/registries/tones";
import type {
  ApiCredential,
  AppTheme,
  CredentialProvider,
  GenerationRequest,
  SourceImage
} from "@/lib/types";

type CreativeFormProps = {
  request: GenerationRequest;
  theme: AppTheme;
  loading: boolean;
  error: string | null;
  onThemeChange: (theme: AppTheme) => void;
  onChange: (patch: Partial<GenerationRequest>) => void;
  onGenerate: () => void;
  credentials: ApiCredential[];
  selectedCredentialIds: Partial<Record<CredentialProvider, string>>;
  onSelectCredential: (provider: CredentialProvider, id: string) => void;
};

const themeOptions: Array<{ id: AppTheme; label: string; icon: LucideIcon }> = [
  { id: "day", label: "Day", icon: Sun },
  { id: "night", label: "Night", icon: Moon },
  { id: "degen", label: "Degen", icon: Flame }
];

const generatorFilters = [
  { id: "all", label: "all" },
  { id: "local", label: "local/free" },
  { id: "paid", label: "paid" },
  { id: "open-source", label: "open" }
] as const;

type GeneratorFilter = (typeof generatorFilters)[number]["id"];

export function CreativeForm({
  request,
  theme,
  loading,
  error,
  onThemeChange,
  onChange,
  onGenerate,
  credentials,
  selectedCredentialIds,
  onSelectCredential
}: CreativeFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generatorFilter, setGeneratorFilter] = useState<GeneratorFilter>("all");
  const selectedModelIds = request.type === "video"
    ? ["mock-video-prompt"]
    : request.modelIds?.length
      ? request.modelIds
      : [request.modelId || "mock-character-lock"];
  const selectedCredentialProviders = Array.from(
    new Set(
      selectedModelIds
        .map((modelId) => modelPresets.find((model) => model.id === modelId)?.provider)
        .filter((provider): provider is CredentialProvider => Boolean(provider && isCredentialProvider(provider)))
    )
  );
  const visibleImageModels = modelPresets.filter((model) => {
    if (model.output !== "image") return false;
    const provider = getProviderPreset(model.provider);
    if (generatorFilter === "all") return true;
    if (generatorFilter === "local") {
      return provider.category === "local" || provider.category === "free";
    }
    return provider.category === generatorFilter;
  });

  async function handleFile(file: File | undefined) {
    setUploadError(null);
    if (!file) return;

    try {
      const sourceImage = await readSourceImage(file);
      onChange({
        sourceImage,
        characterName: request.characterName || cleanName(file.name)
      });
    } catch (fileError) {
      setUploadError(fileError instanceof Error ? fileError.message : "Image upload failed.");
    }
  }

  function toggleModel(modelId: string) {
    const active = selectedModelIds.includes(modelId);
    const next = active
      ? selectedModelIds.filter((id) => id !== modelId)
      : [...selectedModelIds, modelId];
    const normalized = (next.length ? next : ["mock-character-lock"]).slice(-2);
    onChange({
      type: "image",
      modelId: normalized[0],
      modelIds: normalized
    });
  }

  function switchToImage() {
    const imageModelIds = request.modelIds?.filter((id) => id !== "mock-video-prompt");
    const nextModelIds = imageModelIds?.length ? imageModelIds : ["mock-character-lock"];
    onChange({
      type: "image",
      modelId: nextModelIds[0],
      modelIds: nextModelIds
    });
  }

  return (
    <form
      className="flex min-h-0 flex-col rounded-lg border border-line bg-panel/92"
      onSubmit={(event) => {
        event.preventDefault();
        onGenerate();
      }}
    >
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">/brief</h2>
            <p className="text-xs font-bold text-zinc-400">upload.lock.remix.compare</p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-ink p-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  title={option.label}
                  className={`flex h-8 items-center gap-1.5 rounded-md px-2 text-[11px] font-black uppercase transition ${
                    theme === option.id ? "bg-brand text-ink" : "text-zinc-400 hover:text-white"
                  }`}
                  onClick={() => onThemeChange(option.id)}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="slapr-scroll flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
        <fieldset>
          <legend className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-400">
            output
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              title="Image output"
              className={modeButtonClass(request.type === "image")}
              onClick={switchToImage}
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              image
            </button>
            <button
              type="button"
              title="Video prompt output"
              className={modeButtonClass(request.type === "video")}
              onClick={() =>
                onChange({
                  type: "video",
                  modelId: "mock-video-prompt",
                  modelIds: ["mock-video-prompt"]
                })
              }
            >
              <Film className="h-4 w-4" aria-hidden="true" />
              video
            </button>
          </div>
        </fieldset>

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-black uppercase tracking-normal text-zinc-400">
              pfp_source
            </h3>
            {request.sourceImage ? (
              <button
                type="button"
                title="Remove source image"
                className="grid h-8 w-8 place-items-center rounded-md border border-line text-zinc-300 transition hover:border-brand hover:text-brand"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  onChange({ sourceImage: undefined });
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />

          <button
            type="button"
            className="relative grid min-h-48 w-full place-items-center overflow-hidden rounded-lg border border-dashed border-line bg-ink text-left transition hover:border-brand"
            onClick={() => fileInputRef.current?.click()}
            onDrop={(event) => {
              event.preventDefault();
              void handleFile(event.dataTransfer.files[0]);
            }}
            onDragOver={(event) => event.preventDefault()}
          >
            {request.sourceImage ? (
              <img
                src={request.sourceImage.dataUrl}
                alt="Uploaded character source"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="flex flex-col items-center gap-3 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-lg border border-brand/45 bg-brand/10 text-brand">
                  <Upload className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-sm font-black text-white">drop_or_choose_image</span>
                <span className="text-xs font-semibold text-zinc-500">PNG, JPG, WEBP</span>
              </span>
            )}
            {request.sourceImage ? (
              <span className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/10 bg-ink/80 px-3 py-2 text-xs font-black text-white backdrop-blur">
                {request.sourceImage.name}
              </span>
            ) : null}
          </button>

          {uploadError ? (
            <p className="mt-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
              {uploadError}
            </p>
          ) : null}
        </section>

        <div className="grid gap-4 sm:grid-cols-[0.72fr_1fr]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-normal text-zinc-400">
              token
            </span>
            <input
              value={request.token}
              maxLength={42}
              onChange={(event) => onChange({ token: event.target.value })}
              className="h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm font-bold text-white outline-none transition focus:border-brand"
              placeholder="SLAPR"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-normal text-zinc-400">
              character
            </span>
            <input
              value={request.characterName ?? ""}
              maxLength={42}
              onChange={(event) => onChange({ characterName: event.target.value })}
              className="h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm font-bold text-white outline-none transition focus:border-brand"
              placeholder="PFP name"
            />
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-400">
            generators
          </legend>
          <div className="mb-2 grid grid-cols-4 gap-1 rounded-lg border border-line bg-ink p-1">
            {generatorFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`h-8 rounded-md text-[11px] font-black uppercase tracking-normal transition ${
                  generatorFilter === filter.id
                    ? "bg-brand text-ink"
                    : "text-zinc-400 hover:text-white"
                }`}
                onClick={() => setGeneratorFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            {visibleImageModels
              .map((model) => {
                const active = selectedModelIds.includes(model.id);
                const provider = getProviderPreset(model.provider);
                const providerCredentials = isCredentialProvider(model.provider)
                  ? credentials.filter((credential) => credential.provider === model.provider)
                  : [];
                return (
                  <button
                    key={model.id}
                    type="button"
                    title={model.description}
                    className={`flex min-h-14 items-center justify-between gap-3 rounded-lg border px-3 text-left transition ${
                      active ? "border-brand bg-brand/10" : "border-line bg-ink hover:border-zinc-500"
                    }`}
                    onClick={() => toggleModel(model.id)}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${active ? "bg-brand text-ink" : "bg-panel text-zinc-400"}`}>
                        {model.requiresServer ? (
                          <Server className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Layers2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-white">{model.label}</span>
                        <span className="block truncate text-xs font-semibold text-zinc-500">
                          {provider.label} // {model.requiresApiKey ? "key" : model.requiresServer ? "server" : "local"}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          <span className="rounded-md border border-line bg-panel px-1.5 py-0.5 text-[10px] font-black uppercase text-zinc-500">
                            {model.supportsImageInput ? "image input" : "text only"}
                          </span>
                          {model.requiresApiKey ? (
                            <span className="rounded-md border border-line bg-panel px-1.5 py-0.5 text-[10px] font-black uppercase text-zinc-500">
                              {providerCredentials.length ? `${providerCredentials.length} key` : "no browser key"}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </span>
                    {active ? <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" /> : null}
                  </button>
                );
              })}
          </div>
          {selectedCredentialProviders.length ? (
            <div className="mt-3 grid gap-2">
              {selectedCredentialProviders.map((providerId) => {
                const provider = getProviderPreset(providerId);
                const providerCredentials = credentials.filter(
                  (credential) => credential.provider === providerId
                );
                return (
                  <div key={providerId} className="rounded-lg border border-line bg-ink p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-normal text-zinc-400">
                      <KeyRound className="h-4 w-4 text-brand" aria-hidden="true" />
                      {provider.label} key
                    </div>
                    <select
                      value={selectedCredentialIds[providerId] || "env"}
                      onChange={(event) => onSelectCredential(providerId, event.target.value)}
                      className="h-10 w-full rounded-lg border border-line bg-panel px-3 text-xs font-bold text-white outline-none transition focus:border-brand"
                    >
                      <option value="env">{provider.envVar || "server env"} / server</option>
                      {providerCredentials.map((credential) => (
                        <option key={credential.id} value={credential.id}>
                          {credential.label} // {credential.storage}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-[11px] font-semibold leading-5 text-zinc-500">
                      Add browser keys in /api_keys or use {provider.envVar || "server env"}.
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-400">
            modification
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {modificationPresets.map((modification) => (
              <button
                key={modification.id}
                type="button"
                title={modification.description}
                className={chipClass(request.modificationId === modification.id)}
                onClick={() => onChange({ modificationId: modification.id })}
              >
                {modification.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-400">
            consistency
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {consistencyPresets.map((consistency) => (
              <button
                key={consistency.id}
                type="button"
                title={consistency.description}
                className={chipClass(request.consistencyId === consistency.id)}
                onClick={() => onChange({ consistencyId: consistency.id })}
              >
                {consistency.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-normal text-zinc-400">
            narrative
          </span>
          <textarea
            value={request.narrative}
            maxLength={260}
            onChange={(event) => onChange({ narrative: event.target.value })}
            className="min-h-28 w-full resize-none rounded-lg border border-line bg-ink px-3 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-brand"
            placeholder="What should CT understand in one glance?"
          />
        </label>

        <fieldset>
          <legend className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-400">
            tone
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {tonePresets.map((tone) => (
              <button
                key={tone.id}
                type="button"
                title={tone.description}
                className={chipClass(request.toneId === tone.id)}
                onClick={() => onChange({ toneId: tone.id })}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-400">
            style
          </legend>
          <div className="grid gap-2">
            {stylePresets.map((style) => (
              <button
                key={style.id}
                type="button"
                title={style.description}
                className={`flex min-h-16 items-center justify-between gap-3 rounded-lg border px-3 text-left transition ${
                  request.styleId === style.id
                    ? "border-brand bg-brand/10"
                    : "border-line bg-ink hover:border-zinc-500"
                }`}
                onClick={() => onChange({ styleId: style.id })}
              >
                <span>
                  <span className="block text-sm font-black text-white">{style.label}</span>
                  <span className="block text-xs font-medium text-zinc-400">
                    {style.description}
                  </span>
                </span>
                <span className="flex shrink-0 overflow-hidden rounded-md border border-white/10">
                  {style.swatch.map((color) => (
                    <span
                      key={color}
                      className="h-9 w-5"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-400">
            format
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {templatePresets.map((template) => (
              <button
                key={template.id}
                type="button"
                title={`${template.label} ${template.aspect}`}
                className={chipClass(request.templateId === template.id)}
                onClick={() => onChange({ templateId: template.id })}
              >
                <span className="block">{template.label}</span>
                <span className="block text-[11px] font-bold text-zinc-500">{template.aspect}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="border-t border-line p-4 sm:p-5">
        {error ? (
          <p className="mb-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-black text-ink transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          {request.type === "video"
            ? "run video prompt"
            : selectedModelIds.length > 1
              ? "compare generators"
              : "run remix"}
        </button>
      </div>
    </form>
  );
}

function chipClass(active: boolean): string {
  return `min-h-11 rounded-lg border px-3 text-center text-sm font-black transition ${
    active ? "border-brand bg-brand/10 text-brand" : "border-line bg-ink text-zinc-300 hover:border-zinc-500"
  }`;
}

function modeButtonClass(active: boolean): string {
  return `flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-black transition ${
    active ? "border-brand bg-brand/10 text-brand" : "border-line bg-ink text-zinc-300 hover:border-zinc-500"
  }`;
}

function cleanName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 42);
}

async function readSourceImage(file: File): Promise<SourceImage> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Use a PNG, JPG, or WEBP image.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Use an image under 8MB.");
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(rawDataUrl);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare image preview.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const mimeType = "image/jpeg";
  return {
    dataUrl: canvas.toDataURL(mimeType, 0.9),
    name: file.name,
    mimeType,
    width,
    height
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image file."));
    image.src = src;
  });
}
