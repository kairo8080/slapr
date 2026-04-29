"use client";

import { useState } from "react";
import { CreativeForm } from "@/components/CreativeForm";
import { ResultPanel } from "@/components/ResultPanel";
import type { ApiError, GenerationRequest, GenerationResult } from "@/lib/types";

const defaultRequest: GenerationRequest = {
  token: "SLAPR",
  narrative: "Turn market noise into a clean launch visual for people who live on CT.",
  toneId: "degen",
  styleId: "meme-terminal",
  templateId: "square-post",
  type: "image",
  modelId: "auto"
};

export function GeneratorApp() {
  const [request, setRequest] = useState<GenerationRequest>(defaultRequest);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"prompt" | "video" | null>(null);

  async function runGenerate(overrides: Partial<GenerationRequest> = {}) {
    const payload: GenerationRequest = {
      ...request,
      ...overrides,
      seed: makeSeed()
    };

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as GenerationResult | ApiError;

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Generation failed.");
      }

      setResult(data);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(value: string, kind: "prompt" | "video") {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1400);
  }

  return (
    <main className="min-h-screen px-4 py-4 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col">
        <header className="mb-4 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-mint/40 bg-mint/10 text-sm font-black text-mint shadow-glow">
              S
            </div>
            <div>
              <h1 className="text-xl font-black tracking-normal text-white sm:text-2xl">slapr.ai</h1>
              <p className="text-sm font-medium text-zinc-400">Alpha creative console</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-full bg-mint" />
            Local-first MVP
          </div>
        </header>

        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.35fr)]">
          <CreativeForm
            request={request}
            loading={loading}
            error={error}
            onChange={(patch) => setRequest((current) => ({ ...current, ...patch }))}
            onGenerate={() => runGenerate()}
          />
          <ResultPanel
            result={result}
            loading={loading}
            copied={copied}
            onCopyPrompt={() => result && copyText(result.prompt, "prompt")}
            onCopyVideo={() => result?.videoPrompt && copyText(result.videoPrompt, "video")}
            onRegenerate={() => runGenerate()}
          />
        </div>
      </div>
    </main>
  );
}

function makeSeed(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`;
}
