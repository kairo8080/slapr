"use client";

import { Film, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { modelPresets } from "@/lib/registries/models";
import { stylePresets } from "@/lib/registries/styles";
import { templatePresets } from "@/lib/registries/templates";
import { tonePresets } from "@/lib/registries/tones";
import type { GenerationRequest } from "@/lib/types";

type CreativeFormProps = {
  request: GenerationRequest;
  loading: boolean;
  error: string | null;
  onChange: (patch: Partial<GenerationRequest>) => void;
  onGenerate: () => void;
};

export function CreativeForm({
  request,
  loading,
  error,
  onChange,
  onGenerate
}: CreativeFormProps) {
  return (
    <form
      className="flex min-h-0 flex-col rounded-lg border border-line bg-panel/92"
      onSubmit={(event) => {
        event.preventDefault();
        onGenerate();
      }}
    >
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">Creative Brief</h2>
            <p className="text-sm text-zinc-400">Image and video prompt builder</p>
          </div>
          <Sparkles className="h-5 w-5 text-mint" aria-hidden="true" />
        </div>
      </div>

      <div className="slapr-scroll flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
        <fieldset>
          <legend className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-400">
            Output
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              title="Image output"
              className={modeButtonClass(request.type === "image")}
              onClick={() => onChange({ type: "image" })}
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              Image
            </button>
            <button
              type="button"
              title="Video prompt output"
              className={modeButtonClass(request.type === "video")}
              onClick={() => onChange({ type: "video", modelId: "auto" })}
            >
              <Film className="h-4 w-4" aria-hidden="true" />
              Video
            </button>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-[0.72fr_1fr]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-normal text-zinc-400">
              Token / Brand
            </span>
            <input
              value={request.token}
              maxLength={42}
              onChange={(event) => onChange({ token: event.target.value })}
              className="h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm font-bold text-white outline-none transition focus:border-mint"
              placeholder="SLAPR"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-normal text-zinc-400">
              Engine
            </span>
            <select
              value={request.modelId ?? "auto"}
              onChange={(event) => onChange({ modelId: event.target.value })}
              className="h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm font-bold text-white outline-none transition focus:border-mint"
            >
              {modelPresets.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-normal text-zinc-400">
            Narrative
          </span>
          <textarea
            value={request.narrative}
            maxLength={260}
            onChange={(event) => onChange({ narrative: event.target.value })}
            className="min-h-28 w-full resize-none rounded-lg border border-line bg-ink px-3 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-mint"
            placeholder="What should CT understand in one glance?"
          />
        </label>

        <fieldset>
          <legend className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-400">
            Tone
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
            Style
          </legend>
          <div className="grid gap-2">
            {stylePresets.map((style) => (
              <button
                key={style.id}
                type="button"
                title={style.description}
                className={`flex min-h-16 items-center justify-between gap-3 rounded-lg border px-3 text-left transition ${
                  request.styleId === style.id
                    ? "border-mint bg-mint/10"
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
            Template
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
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 text-sm font-black text-ink transition hover:bg-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          {request.type === "video" ? "Generate Video Prompt" : "Generate Image"}
        </button>
      </div>
    </form>
  );
}

function modeButtonClass(active: boolean): string {
  return `flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-black transition ${
    active ? "border-mint bg-mint/10 text-mint" : "border-line bg-ink text-zinc-300 hover:border-zinc-500"
  }`;
}

function chipClass(active: boolean): string {
  return `min-h-11 rounded-lg border px-3 text-center text-sm font-black transition ${
    active ? "border-mint bg-mint/10 text-mint" : "border-line bg-ink text-zinc-300 hover:border-zinc-500"
  }`;
}
