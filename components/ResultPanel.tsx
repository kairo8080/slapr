"use client";

/* eslint-disable @next/next/no-img-element */
import {
  AlertTriangle,
  Check,
  Clipboard,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  RotateCcw
} from "lucide-react";
import type { GenerationResult, SourceImage } from "@/lib/types";

type ResultPanelProps = {
  results: GenerationResult[] | null;
  sourceImage?: SourceImage;
  loading: boolean;
  copied: string | null;
  onCopyPrompt: (index: number) => void;
  onCopyVideo: (index: number) => void;
  onRegenerate: () => void;
};

export function ResultPanel({
  results,
  sourceImage,
  loading,
  copied,
  onCopyPrompt,
  onCopyVideo,
  onRegenerate
}: ResultPanelProps) {
  const hasResults = Boolean(results?.length);

  return (
    <section className="grid min-h-0 gap-4 lg:grid-rows-[auto_minmax(0,1fr)]">
      <div className="rounded-lg border border-line bg-panel/92">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-black text-white">/output</h2>
            <p className="text-xs font-bold text-zinc-400">
              {hasResults ? `${results?.length} result${results?.length === 1 ? "" : "s"}` : "awaiting first remix"}
            </p>
          </div>
          <button
            type="button"
            title="Regenerate"
            disabled={!hasResults || loading}
            onClick={onRegenerate}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm font-black text-zinc-200 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            rerun
          </button>
        </div>
      </div>

      <div className="slapr-scroll min-h-0 overflow-y-auto">
        {hasResults ? (
          <div className={`grid gap-4 ${results && results.length > 1 ? "xl:grid-cols-2" : ""}`}>
            {results?.map((result, index) => (
              <ResultCard
                key={`${result.model}-${result.seed}-${index}`}
                result={result}
                index={index}
                loading={loading}
                copied={copied}
                onCopyPrompt={onCopyPrompt}
                onCopyVideo={onCopyVideo}
              />
            ))}
          </div>
        ) : (
          <EmptyState sourceImage={sourceImage} loading={loading} />
        )}
      </div>
    </section>
  );
}

function ResultCard({
  result,
  index,
  loading,
  copied,
  onCopyPrompt,
  onCopyVideo
}: {
  result: GenerationResult;
  index: number;
  loading: boolean;
  copied: string | null;
  onCopyPrompt: (index: number) => void;
  onCopyVideo: (index: number) => void;
}) {
  const hasError = result.status === "error";

  return (
    <article className="overflow-hidden rounded-lg border border-line bg-panel/92">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-white">{result.provider}</h3>
          <p className="truncate text-xs font-bold text-zinc-500">{result.model}</p>
        </div>
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-normal ${
          hasError ? "border-danger/40 bg-danger/10 text-danger" : "border-line bg-ink text-zinc-400"
        }`}>
          {hasError ? (
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ImageIcon className="h-4 w-4 text-brand" aria-hidden="true" />
          )}
          {hasError ? "setup" : "image"}
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-ink">
          <img
            src={result.imageUrl}
            alt={hasError ? "Generator setup fallback" : "Generated SLAPR visual"}
            className={`h-full w-full object-cover transition duration-300 ${loading ? "scale-[1.02] opacity-55" : "opacity-100"} ${hasError ? "opacity-45" : ""}`}
          />
          {loading ? (
            <div className="absolute inset-0 grid place-items-center bg-ink/50 text-sm font-black uppercase tracking-normal text-brand">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </div>
          ) : null}
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
              <div className="rounded-lg border border-danger/40 bg-ink/90 px-4 py-3 text-sm font-bold text-danger">
                {result.error}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-line bg-ink">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <Clipboard className="h-4 w-4 text-signal" aria-hidden="true" />
              prompt
            </div>
            <div className="flex items-center gap-2">
              <a
                href={result.imageUrl}
                download={`slapr-${result.modelId || "remix"}.png`}
                title="Download image"
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-zinc-200 transition hover:border-zinc-500"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                title="Copy prompt"
                onClick={() => onCopyPrompt(index)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-zinc-200 transition hover:border-zinc-500"
              >
                {copied === `prompt-${index}` ? (
                  <Check className="h-4 w-4 text-brand" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <pre className="slapr-scroll max-h-48 overflow-auto whitespace-pre-wrap break-words p-4 text-sm leading-6 text-zinc-300">
            {result.prompt}
          </pre>
        </div>

        {result.notes?.length ? (
          <div className="rounded-lg border border-line bg-ink px-4 py-3">
            <h4 className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-500">
              provider_notes
            </h4>
            <div className="grid gap-2">
              {result.notes.map((note) => (
                <p key={note} className="text-xs font-semibold leading-5 text-zinc-400">
                  {note}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {result.videoPrompt ? (
          <div className="rounded-lg border border-line bg-ink">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h4 className="text-sm font-black text-white">video_prompt</h4>
              <button
                type="button"
                title="Copy video prompt"
                onClick={() => onCopyVideo(index)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-zinc-200 transition hover:border-zinc-500"
              >
                {copied === `video-${index}` ? (
                  <Check className="h-4 w-4 text-brand" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <pre className="slapr-scroll max-h-32 overflow-auto whitespace-pre-wrap break-words p-4 text-sm leading-6 text-zinc-300">
              {result.videoPrompt}
            </pre>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function EmptyState({ sourceImage, loading }: { sourceImage?: SourceImage; loading: boolean }) {
  return (
    <div className="grid min-h-[620px] place-items-center rounded-lg border border-line bg-panel/92 p-4 sm:p-5">
      <div className="w-full max-w-xl">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-ink">
          <img
            src={sourceImage?.dataUrl ?? "/slapr-sample.svg"}
            alt={sourceImage ? "Uploaded character preview" : "SLAPR sample visual"}
            className="h-full w-full object-cover opacity-85"
          />
          <div className="absolute inset-x-4 bottom-4 rounded-lg border border-white/10 bg-ink/85 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
              ) : (
                <ImageIcon className="h-4 w-4 text-brand" aria-hidden="true" />
              )}
              {loading ? "generating" : sourceImage ? "source_locked" : "no_source_image"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
