"use client";

/* eslint-disable @next/next/no-img-element */
import { Check, Clipboard, Copy, Film, ImageIcon, RotateCcw } from "lucide-react";
import type { GenerationResult } from "@/lib/types";

type ResultPanelProps = {
  result: GenerationResult | null;
  loading: boolean;
  copied: "prompt" | "video" | null;
  onCopyPrompt: () => void;
  onCopyVideo: () => void;
  onRegenerate: () => void;
};

export function ResultPanel({
  result,
  loading,
  copied,
  onCopyPrompt,
  onCopyVideo,
  onRegenerate
}: ResultPanelProps) {
  const isVideo = result?.type === "video";

  return (
    <section className="grid min-h-0 gap-4 lg:grid-rows-[minmax(0,1fr)_auto]">
      <div className="min-h-0 rounded-lg border border-line bg-panel/92">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-black text-white">Output</h2>
            <p className="text-sm text-zinc-400">
              {result ? `${result.provider} / ${result.model}` : "Mock preview"}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 text-xs font-black uppercase tracking-normal text-zinc-400">
            {isVideo ? (
              <Film className="h-4 w-4 text-sky" aria-hidden="true" />
            ) : (
              <ImageIcon className="h-4 w-4 text-mint" aria-hidden="true" />
            )}
            {isVideo ? "Video" : "Image"}
          </div>
        </div>

        <div className="grid min-h-0 gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(340px,0.92fr)_minmax(0,1fr)]">
          <div className="relative aspect-square min-h-[320px] overflow-hidden rounded-lg border border-line bg-ink">
            <img
              src={result?.imageUrl ?? "/slapr-sample.svg"}
              alt={result ? "Generated SLAPR visual" : "SLAPR sample visual"}
              className={`h-full w-full object-cover transition duration-300 ${loading ? "scale-[1.02] opacity-55" : "opacity-100"}`}
            />
            {loading ? (
              <div className="absolute inset-0 grid place-items-center bg-ink/50 text-sm font-black uppercase tracking-normal text-mint">
                Generating
              </div>
            ) : null}
          </div>

          <div className="flex min-h-[320px] flex-col rounded-lg border border-line bg-ink">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Clipboard className="h-4 w-4 text-signal" aria-hidden="true" />
                Prompt
              </div>
              <button
                type="button"
                title="Copy prompt"
                disabled={!result}
                onClick={onCopyPrompt}
                className="flex h-9 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-black text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied === "prompt" ? (
                  <Check className="h-4 w-4 text-mint" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                Copy
              </button>
            </div>
            <pre className="slapr-scroll min-h-0 flex-1 whitespace-pre-wrap break-words p-4 text-sm leading-6 text-zinc-300">
              {result?.prompt ?? "Prompt will render after the first generation."}
            </pre>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-h-28 rounded-lg border border-line bg-panel/92">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
            <h3 className="text-sm font-black text-white">Video Pipeline</h3>
            <button
              type="button"
              title="Copy video prompt"
              disabled={!result?.videoPrompt}
              onClick={onCopyVideo}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-black text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied === "video" ? (
                <Check className="h-4 w-4 text-mint" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              Copy
            </button>
          </div>
          <pre className="slapr-scroll max-h-36 overflow-auto whitespace-pre-wrap break-words px-4 py-3 text-sm leading-6 text-zinc-400 sm:px-5">
            {result?.videoPrompt ?? "Switch to Video and generate to create the mock motion prompt."}
          </pre>
        </div>

        <div className="flex rounded-lg border border-line bg-panel/92 p-3">
          <button
            type="button"
            title="Regenerate"
            disabled={!result || loading}
            onClick={onRegenerate}
            className="flex h-12 min-w-40 items-center justify-center gap-2 rounded-lg bg-signal px-4 text-sm font-black text-ink transition hover:bg-signal/90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Regenerate
          </button>
        </div>
      </div>
    </section>
  );
}
