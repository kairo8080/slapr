"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { buildPrompt } from "@/lib/promptBuilder";
import { generateMockCreative } from "@/lib/providers/mockProvider";
import {
  credentialProviders,
  getModelPreset,
  getProviderPreset,
  isCredentialProvider,
  modelPresets
} from "@/lib/registries/models";
import type {
  ApiCredential,
  ApiCredentialStorage,
  AspectRatio,
  CredentialProvider,
  GenerationRequest,
  GenerationResult,
  ModelProvider,
  SourceImage
} from "@/lib/types";

type UiTheme = "light" | "dark" | "degen";
type WorkspaceTab = "generate" | "api";
type DownloadFormat = "png" | "jpg" | "webp" | "svg";
type ProviderStatus = "connected" | "checking" | "working" | "failed";

const GM_PFP_PROMPT =
  "Turn the uploaded PFP into a clean gm crypto profile image: preserve the character identity, make it bold in a social feed, add subtle on-chain energy, strong contrast, and a simple SLAPR-ready finish.";

const SESSION_KEY = "slapr.apiKeys.session";
const LOCAL_KEY = "slapr.apiKeys.local";
const STATUS_KEY = "slapr.providerStatus";
const ASPECT_RATIOS: AspectRatio[] = ["1:1", "16:9", "9:16", "21:9"];
const DOWNLOAD_FORMATS: DownloadFormat[] = ["png", "jpg", "webp", "svg"];
const THEMES: UiTheme[] = ["light", "dark", "degen"];
const modelOptions = modelPresets.filter((model) => model.output === "image");
const API_HELP: Record<CredentialProvider, { short: string; steps: string[]; models: string }> = {
  openai: {
    short: "Use this for OpenAI GPT Image models.",
    models: "OpenAI GPT Image 2",
    steps: [
      "Open the OpenAI key page and sign in.",
      "Create a new secret key, then copy it once.",
      "Paste it below, click add, then pick an OpenAI model in Generate."
    ]
  },
  google: {
    short: "Use this for Google Gemini image models.",
    models: "Google Nano Banana 2",
    steps: [
      "Open Google AI Studio and sign in with Google.",
      "Create or copy an API key from the API keys page.",
      "Paste it below, click add, then pick a Google model in Generate."
    ]
  },
  stability: {
    short: "Use this for Stability image models.",
    models: "Stability Core",
    steps: [
      "Open the Stability Developer Platform and sign in.",
      "Find API Keys in your account settings and create a key.",
      "Paste it below, click add, then pick a Stability model in Generate."
    ]
  },
  huggingface: {
    short: "Use this for open models through Hugging Face.",
    models: "HF Qwen Image",
    steps: [
      "Open Hugging Face tokens and sign in.",
      "Create a token that can call Inference Providers.",
      "Paste it below, click add, then pick a Hugging Face model in Generate."
    ]
  },
  xai: {
    short: "Use this for Grok Imagine image generation.",
    models: "Grok Imagine Image",
    steps: [
      "Open the xAI API Console and sign in.",
      "Create or copy an API key from the console.",
      "Paste it below, click add, then pick Grok Imagine Image in Generate."
    ]
  },
  bfl: {
    short: "Use this for official Black Forest Labs FLUX.2 models.",
    models: "FLUX.2 Pro Preview, FLUX.2 Pro, FLUX.2 Klein 9B",
    steps: [
      "Open the Black Forest Labs dashboard and sign in.",
      "Create or copy an API key from the dashboard.",
      "Paste it below, click add, then pick a FLUX model in Generate."
    ]
  }
};

export function GeneratorApp() {
  const [theme, setTheme] = useState<UiTheme>("dark");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("generate");
  const [sourceImage, setSourceImage] = useState<SourceImage | undefined>();
  const [prompt, setPrompt] = useState("");
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [modelId, setModelId] = useState("mock-character-lock");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("png");
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [selectedCredentialIds, setSelectedCredentialIds] = useState<
    Partial<Record<CredentialProvider, string>>
  >({});
  const [providerStatuses, setProviderStatuses] = useState<Partial<Record<CredentialProvider, ProviderStatus>>>({});
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedModel = useMemo(() => getModelPreset(modelId), [modelId]);
  const themeClass = theme === "dark" ? "theme-night" : theme === "light" ? "theme-day" : "theme-degen";
  const selectedCredential = resolveCredentialForModel(modelId, credentials, selectedCredentialIds);
  const selectedModelStatus = getModelStatus(modelId, credentials, selectedCredentialIds, providerStatuses);

  useEffect(() => {
    const loaded = loadCredentials();
    const selected = defaultSelectedCredentials(loaded);
    setCredentials(loaded);
    setSelectedCredentialIds(selected);
    setProviderStatuses(loadProviderStatuses());
    window.setTimeout(() => {
      const checked = new Set<CredentialProvider>();
      Object.values(selected).forEach((credentialId) => {
        const credential = loaded.find((item) => item.id === credentialId);
        if (!credential || checked.has(credential.provider)) return;
        checked.add(credential.provider);
        void checkCredential(credential);
      });
    }, 0);
  }, []);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await readFileAsDataUrl(file);
    setSourceImage({
      dataUrl,
      name: file.name,
      mimeType: file.type || "image/png"
    });
    setResult(null);
    setMessage(null);
  }

  async function handleGenerate() {
    const seed = makeSeed();
    setActiveTab("generate");
    setLoading(true);
    setMessage(null);

    try {
      const requestSourceImage = sourceImage
        ? await prepareSourceImageForAspectRatio(sourceImage, aspectRatio)
        : undefined;
      const payload = makeGenerationRequest({
        modelId,
        prompt: prompt.trim() || GM_PFP_PROMPT,
        seed,
        sourceImage: requestSourceImage,
        apiKey: selectedCredential?.key,
        aspectRatio,
        enhancePrompt
      });
      const builtPrompt = buildPrompt(payload);
      const minimumAnimationTime = wait(900);
      let nextResult: GenerationResult;

      if (selectedModel.requiresServer) {
        try {
          nextResult = await generateRemoteCreative(payload);
          markProviderStatus(selectedModel.provider, "working");
        } catch (remoteError) {
          if (selectedCredential) markProviderStatus(selectedModel.provider, "failed");
          const fallback = await generateLocalCreative(payload, builtPrompt);
          nextResult = {
            ...fallback,
            notes: [
              `Showing local preview because ${selectedModel.label} needs the API server and key.`,
              remoteError instanceof Error ? remoteError.message : "Remote generation was unavailable."
            ]
          };
          setMessage(
            !selectedCredential && modelNeedsCredential(modelId)
              ? `key needed: add/select a ${getProviderNameForModel(modelId)} key`
              : `api fallback: ${remoteError instanceof Error ? remoteError.message : "remote generation failed"}`
          );
        }
      } else {
        nextResult = await generateLocalCreative(payload, builtPrompt);
      }

      await minimumAnimationTime;
      setResult(nextResult);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "generation failed");
    } finally {
      setLoading(false);
    }
  }

  function addCredential(credential: ApiCredential) {
    setCredentials((current) => {
      const next = [...current.filter((item) => item.id !== credential.id), credential];
      persistCredentials(next);
      return next;
    });
    setSelectedCredentialIds((current) => ({
      ...current,
      [credential.provider]: credential.id
    }));
    markProviderStatus(credential.provider, "checking");
    void checkCredential(credential);
  }

  function removeCredential(id: string) {
    setCredentials((current) => {
      const removed = current.find((credential) => credential.id === id);
      const next = current.filter((credential) => credential.id !== id);
      persistCredentials(next);
      if (removed) {
        setSelectedCredentialIds((selected) => {
          if (selected[removed.provider] !== id) return selected;
          const replacement = next.find((credential) => credential.provider === removed.provider);
          return {
            ...selected,
            [removed.provider]: replacement?.id
          };
        });
      }
      return next;
    });
  }

  function selectCredential(provider: CredentialProvider, id: string) {
    setSelectedCredentialIds((current) => ({
      ...current,
      [provider]: id
    }));
    const credential = credentials.find((item) => item.provider === provider && item.id === id);
    if (credential) void checkCredential(credential);
  }

  function markProviderStatus(provider: ModelProvider, status: ProviderStatus) {
    if (!isCredentialProvider(provider)) return;
    setProviderStatuses((current) => {
      const next = { ...current, [provider]: status };
      persistProviderStatuses(next);
      return next;
    });
  }

  async function checkCredential(credential: ApiCredential) {
    markProviderStatus(credential.provider, "checking");
    try {
      const response = await fetch("/api/check-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: credential.provider,
          apiKey: credential.key
        })
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
      if (!response.ok || !payload?.ok) throw new Error("key check failed");
      markProviderStatus(credential.provider, "working");
    } catch {
      markProviderStatus(credential.provider, "failed");
    }
  }

  function handleSave() {
    if (!result?.imageUrl) {
      setMessage("error: no image to save yet");
      return;
    }

    void saveGeneratedImage(result.imageUrl, downloadFormat, aspectRatio).catch((error) => {
      setMessage(error instanceof Error ? error.message : "save failed");
    });
  }

  return (
    <main className={`slapr-app ${themeClass} h-screen overflow-hidden p-2 lg:p-3`}>
      <div className="slapr-shell-scale flex h-full w-full flex-col gap-3">
        <header className="grid shrink-0 gap-3 border border-line bg-panel/90 px-3 py-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
          <div className="min-w-0">
            <pre className="ascii-brand" aria-label="SLAPR v0.1.2 alpha">{String.raw` ____  _        _    ____  ____
/ ___|| |      / \  |  _ \|  _ \
\___ \| |     / _ \ | |_) | |_) |
 ___) | |___ / ___ \|  __/|  _ <
|____/|_____/_/   \_\_|   |_| \_\  v0.1.2 alpha`}</pre>
          </div>

          <nav className="grid grid-cols-2 border border-line bg-ink/30 p-1 lg:justify-self-center">
            {(["generate", "api"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-7 px-5 text-xs font-black uppercase tracking-normal transition ${
                  activeTab === tab ? "bg-brand text-ink" : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 items-center justify-end gap-2">
            <div className="grid grid-cols-3 border border-line bg-ink/40 p-1">
              {THEMES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTheme(option)}
                  className={`h-7 px-3 text-xs font-black uppercase tracking-normal transition ${
                    theme === option ? "bg-brand text-ink" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[500px_minmax(0,1fr)] xl:grid-cols-[560px_minmax(0,1fr)] 2xl:grid-cols-[620px_minmax(0,1fr)]">
          <aside className="min-h-0 border border-line bg-panel/90 p-2">
            {activeTab === "generate" ? (
              <form
                className="grid min-h-0 content-start gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleGenerate();
                }}
              >
                <TerminalSection label="source">
                  <label className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
                    <span className="grid h-[96px] cursor-pointer place-items-center overflow-hidden border border-dashed border-line bg-ink/30 text-center text-[11px] font-black uppercase leading-4 text-zinc-500 hover:border-brand hover:text-white">
                      {sourceImage ? (
                        <img
                          src={sourceImage.dataUrl}
                          alt="Uploaded source"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="px-3">select image</span>
                      )}
                      <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
                    </span>
                    <span className="grid content-center gap-1 text-xs">
                      <span className="font-black uppercase text-zinc-500">image upload</span>
                      <span className="truncate font-bold text-white">
                        {sourceImage ? cleanName(sourceImage.name) : "none"}
                      </span>
                      <span className="font-semibold leading-5 text-zinc-500">
                        PFP/NFT source is used as the character anchor.
                      </span>
                    </span>
                  </label>
                </TerminalSection>

                <TerminalSection label="prompt_1:1">
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="write exact prompt"
                    rows={4}
                    className="h-[108px] resize-none border border-line bg-ink/40 px-3 py-2 text-sm font-semibold leading-relaxed text-white outline-none placeholder:text-zinc-500 focus:border-brand"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrompt(GM_PFP_PROMPT)}
                      className="h-8 border border-line bg-ink/20 text-[11px] font-black uppercase tracking-normal text-zinc-300 hover:border-brand hover:text-white"
                    >
                      gm pfp template
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnhancePrompt((current) => !current)}
                      className={`h-8 border text-[11px] font-black uppercase tracking-normal ${
                        enhancePrompt
                          ? "border-brand bg-brand/20 text-brand"
                          : "border-line text-zinc-400 hover:text-white"
                      }`}
                    >
                      slapr enhance: {enhancePrompt ? "on" : "off"}
                    </button>
                  </div>
                </TerminalSection>

                <TerminalSection label="model">
                  <select
                    value={modelId}
                    onChange={(event) => setModelId(event.target.value)}
                    className="h-9 border border-line bg-ink/40 px-3 text-xs font-black text-white outline-none focus:border-brand"
                  >
                    {modelOptions.map((model) => (
                      <option key={model.id} value={model.id}>
                        {modelStatusLabel(getModelStatus(model.id, credentials, selectedCredentialIds, providerStatuses)).short} {model.label}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-black uppercase">
                    <span className="border border-line px-2 py-1 text-zinc-500">
                      server: {selectedModel.requiresServer ? "required" : "local"}
                    </span>
                    <span className="truncate border border-line px-2 py-1 text-zinc-500">
                      {modelStatusLabel(selectedModelStatus).label}: {selectedCredential ? selectedCredential.label : "none"}
                    </span>
                  </div>
                  <ModelHealth
                    modelId={modelId}
                    credentials={credentials}
                    selectedCredentialIds={selectedCredentialIds}
                    providerStatuses={providerStatuses}
                    onSelectModel={setModelId}
                  />
                </TerminalSection>

                <TerminalSection label="ratio">
                  <SegmentedButtons
                    options={ASPECT_RATIOS}
                    value={aspectRatio}
                    onChange={setAspectRatio}
                  />
                </TerminalSection>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 border border-brand bg-brand text-sm font-black uppercase tracking-normal text-ink transition hover:bg-signal disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "generating" : "generate"}
                </button>
              </form>
            ) : (
              <ApiKeysTab
                credentials={credentials}
                selectedCredentialIds={selectedCredentialIds}
                providerStatuses={providerStatuses}
                onAddCredential={addCredential}
                onRemoveCredential={removeCredential}
                onSelectCredential={selectCredential}
                onCheckCredential={checkCredential}
              />
            )}
          </aside>

          <section className="grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden border border-line bg-panel/90 p-3">
            <div className="grid shrink-0 gap-2 border-b border-line pb-2 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="grid gap-1">
                <p className="text-[11px] font-black uppercase tracking-normal text-zinc-500">
                  output buffer
                </p>
                <p className="text-sm font-black text-white">{selectedModel.label}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[auto_auto] sm:items-center">
                <SegmentedButtons
                  options={DOWNLOAD_FORMATS}
                  value={downloadFormat}
                  onChange={setDownloadFormat}
                />
                <button
                  type="button"
                  onClick={handleSave}
                  className="h-8 border border-brand bg-brand px-4 text-xs font-black uppercase tracking-normal text-ink transition hover:bg-signal"
                >
                  save
                </button>
              </div>
            </div>

            <div className="grid h-full min-h-0 grid-cols-1 gap-3 py-2 xl:grid-cols-[1fr_210px]">
              <div className="relative grid h-full min-h-0 w-full place-items-center overflow-hidden border border-line bg-ink/40">
                {loading ? (
                  <ProgressAnimation />
                ) : result ? (
                  <img
                    src={result.imageUrl}
                    alt="Generated SLAPR output"
                    className="absolute inset-0 h-full max-h-full w-full max-w-full object-contain"
                  />
                ) : (
                  <div className="px-8 text-center text-xs font-black uppercase leading-relaxed text-zinc-500">
                    awaiting generation
                  </div>
                )}
              </div>

              <div className="hidden content-start border border-line bg-ink/25 text-xs xl:grid">
                <MetaRow label="input" value={sourceImage ? cleanName(sourceImage.name) : "none"} />
                <MetaRow label="model" value={selectedModel.modelName || selectedModel.id} />
                <MetaRow label="ratio" value={aspectRatio} />
                <MetaRow label="save" value={downloadFormat} />
                <MetaRow label="server" value={selectedModel.requiresServer ? "required" : "local"} />
                <MetaRow label="key" value={selectedCredential ? selectedCredential.label : "none"} />
                <MetaRow label="status" value={loading ? "rendering" : result ? "ready" : "idle"} />
              </div>
            </div>

            <div className="shrink-0 border-t border-line pt-2">
              {message ? (
                <p className="mb-1 text-xs font-bold uppercase leading-relaxed text-brand">{message}</p>
              ) : null}
              <p className="max-h-10 overflow-hidden text-xs font-semibold leading-5 text-zinc-400">
                {result?.prompt || "prompt trace will appear after generation"}
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function ApiKeysTab({
  credentials,
  selectedCredentialIds,
  providerStatuses,
  onAddCredential,
  onRemoveCredential,
  onSelectCredential,
  onCheckCredential
}: {
  credentials: ApiCredential[];
  selectedCredentialIds: Partial<Record<CredentialProvider, string>>;
  providerStatuses: Partial<Record<CredentialProvider, ProviderStatus>>;
  onAddCredential: (credential: ApiCredential) => void;
  onRemoveCredential: (id: string) => void;
  onSelectCredential: (provider: CredentialProvider, id: string) => void;
  onCheckCredential: (credential: ApiCredential) => Promise<void>;
}) {
  const [provider, setProvider] = useState<CredentialProvider>("openai");
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [storage, setStorage] = useState<ApiCredentialStorage>("session");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerInfo = getProviderPreset(provider);
  const help = API_HELP[provider];

  function submitKey() {
    const trimmedKey = key.trim();
    if (trimmedKey.length < 16) {
      setError("paste the full provider api key");
      return;
    }

    onAddCredential({
      id: makeId(),
      provider,
      label: (label || providerInfo.label).trim().slice(0, 42),
      key: trimmedKey,
      storage,
      createdAt: new Date().toISOString()
    });
    setLabel("");
    setKey("");
    setError(null);
  }

  return (
    <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(84px,0.44fr)] gap-2">
      <div className="slapr-scroll grid min-h-0 gap-2 overflow-y-auto border border-line bg-ink/20 p-2">
        <p className="text-[11px] font-black uppercase tracking-normal text-brand">/api_setup</p>
        <select
          value={provider}
          onChange={(event) => {
            setProvider(event.target.value as CredentialProvider);
            setError(null);
          }}
          className="h-8 border border-line bg-ink/40 px-2 text-xs font-black text-white outline-none focus:border-brand"
        >
          {credentialProviders.map((providerId) => {
            const option = getProviderPreset(providerId);
            return (
              <option key={providerId} value={providerId}>
                {option.label}
              </option>
            );
          })}
        </select>

        <div className="grid gap-2 border border-line bg-panel/50 p-2">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-white">{providerInfo.label}</p>
              <p className="mt-1 text-[11px] font-bold uppercase text-zinc-500">
                works with: {help.models}
              </p>
            </div>
            {providerInfo.keyUrl ? (
              <a
                href={providerInfo.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="grid h-8 place-items-center border border-brand bg-brand px-3 text-[11px] font-black uppercase text-ink"
              >
                open key page
              </a>
            ) : null}
          </div>
          <p className="text-[11px] font-semibold leading-4 text-zinc-400">{help.short}</p>
          <ol className="grid gap-1 pl-4 text-[11px] font-semibold leading-4 text-zinc-400">
            {help.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-[11px] font-semibold leading-4 text-zinc-500">
            No terminal work is needed. For deployments, the server variable is{" "}
            <span className="font-black text-zinc-300">{providerInfo.envVar}</span>.
          </p>
        </div>

        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="h-8 border border-line bg-ink/40 px-2 text-xs font-bold text-white outline-none placeholder:text-zinc-500 focus:border-brand"
          placeholder={`${providerInfo.label} label`}
        />
        <div className="grid grid-cols-[1fr_auto]">
          <input
            value={key}
            type={showKey ? "text" : "password"}
            autoComplete="off"
            onChange={(event) => {
              setKey(event.target.value);
              setError(null);
            }}
            className="h-8 border border-line bg-ink/40 px-2 text-xs font-bold text-white outline-none placeholder:text-zinc-500 focus:border-brand"
            placeholder={providerInfo.keyLabel || "api key"}
          />
          <button
            type="button"
            onClick={() => setShowKey((current) => !current)}
            className="h-8 border border-l-0 border-line px-3 text-[11px] font-black uppercase text-zinc-400 hover:text-white"
          >
            {showKey ? "hide" : "show"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setStorage("session")}
            className={storageClass(storage === "session")}
          >
            session
          </button>
          <button
            type="button"
            onClick={() => setStorage("local")}
            className={storageClass(storage === "local")}
          >
            remember
          </button>
          <button
            type="button"
            onClick={submitKey}
            className="h-8 border border-brand bg-brand text-[11px] font-black uppercase text-ink"
          >
            add
          </button>
        </div>
        {error ? <p className="text-xs font-bold uppercase text-brand">{error}</p> : null}
        <p className="text-[11px] font-semibold leading-4 text-zinc-500">
          Keys stay in this browser and are sent only to SLAPR's same-origin /api/generate route.
        </p>
      </div>

      <div className="slapr-scroll min-h-0 overflow-y-auto border border-line bg-ink/20">
        {credentials.length ? (
          credentials.map((credential) => {
            const active = selectedCredentialIds[credential.provider] === credential.id;
            const info = getProviderPreset(credential.provider);
            const status = providerStatuses[credential.provider] || "connected";
            const statusLabel =
              status === "working"
                ? "working"
                : status === "failed"
                  ? "not working"
                  : status === "checking"
                    ? "checking"
                    : "connected";
            return (
              <div key={credential.id} className="grid gap-2 border-b border-line p-2 last:border-b-0">
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-white">{credential.label}</p>
                    <p className="truncate text-[11px] font-bold uppercase text-zinc-500">
                      {info.label} / {statusLabel} / {maskKey(credential.key)} / {credential.storage}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        void onCheckCredential(credential);
                      }}
                      className="h-7 border border-line px-2 text-[11px] font-black uppercase text-zinc-400 hover:border-brand hover:text-brand"
                    >
                      {status === "checking" ? "..." : "chk"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveCredential(credential.id)}
                      className="h-7 border border-line px-2 text-[11px] font-black uppercase text-zinc-400 hover:border-brand hover:text-brand"
                    >
                      del
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCredential(credential.provider, credential.id)}
                  className={`h-7 border text-[11px] font-black uppercase ${
                    active
                      ? "border-brand bg-brand text-ink"
                      : "border-line text-zinc-400 hover:border-brand hover:text-brand"
                  }`}
                >
                  {active ? "selected" : "use for provider"}
                </button>
              </div>
            );
          })
        ) : (
          <div className="p-3 text-xs font-bold uppercase leading-5 text-zinc-500">
            no saved keys. add one to use openai, google, stability, hugging face, grok, or flux models.
          </div>
        )}
      </div>
    </div>
  );
}

function TerminalSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="grid gap-2 border border-line bg-ink/20 p-2">
      <p className="text-[11px] font-black uppercase tracking-normal text-brand">/{label}</p>
      {children}
    </section>
  );
}

function SegmentedButtons<T extends string>({
  options,
  value,
  onChange
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-4 border border-line bg-ink/30 p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-7 px-2 text-[11px] font-black uppercase tracking-normal transition ${
            value === option ? "bg-brand text-ink" : "text-zinc-400 hover:text-white"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ModelHealth({
  modelId,
  credentials,
  selectedCredentialIds,
  providerStatuses,
  onSelectModel
}: {
  modelId: string;
  credentials: ApiCredential[];
  selectedCredentialIds: Partial<Record<CredentialProvider, string>>;
  providerStatuses: Partial<Record<CredentialProvider, ProviderStatus>>;
  onSelectModel: (modelId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {modelOptions.map((model) => {
        const status = modelStatusLabel(
          getModelStatus(model.id, credentials, selectedCredentialIds, providerStatuses)
        );
        return (
          <button
            key={model.id}
            type="button"
            onClick={() => onSelectModel(model.id)}
            className={`grid min-h-9 grid-cols-[auto_minmax(0,1fr)] items-start gap-1 border px-1.5 py-1 text-left text-[10px] font-black uppercase ${
              modelId === model.id ? "border-brand text-white" : "border-line text-zinc-500"
            }`}
          >
            <span className={`mt-1 h-1.5 w-1.5 ${status.dotClass}`} />
            <span className="min-w-0">
              <span className="block text-[9px] leading-3 text-zinc-500">{status.short}</span>
              <span className="block leading-3">{model.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] border-b border-line last:border-b-0">
      <span className="border-r border-line px-2 py-2 font-black uppercase text-zinc-500">{label}</span>
      <span className="truncate px-2 py-2 font-bold text-white">{value}</span>
    </div>
  );
}

function ProgressAnimation() {
  return (
    <div className="grid w-full max-w-sm place-items-center gap-4 px-8 text-center">
      <div className="grid w-full grid-cols-12 gap-1">
        {Array.from({ length: 12 }, (_, index) => (
          <span
            key={index}
            className="h-8 animate-pulse border border-brand/50 bg-brand/20"
            style={{ animationDelay: `${index * 55}ms` }}
          />
        ))}
      </div>
      <div className="h-px w-full bg-brand/70" />
      <p className="text-xs font-black uppercase tracking-normal text-brand">rendering frame buffer</p>
    </div>
  );
}

function makeGenerationRequest({
  modelId,
  prompt,
  seed,
  sourceImage,
  apiKey,
  aspectRatio,
  enhancePrompt
}: {
  modelId: string;
  prompt: string;
  seed: string;
  sourceImage?: SourceImage;
  apiKey?: string;
  aspectRatio: AspectRatio;
  enhancePrompt: boolean;
}): GenerationRequest {
  return {
    token: "SLAPR",
    narrative: prompt,
    toneId: "degen",
    styleId: "meme-terminal",
    templateId: "square-post",
    type: "image",
    modelId,
    modelIds: [modelId],
    sourceImage,
    characterName: sourceImage ? cleanName(sourceImage.name) : "",
    modificationId: "pfp-remix",
    consistencyId: "strict",
    seed,
    apiKey,
    aspectRatio,
    enhancePrompt
  };
}

async function generateLocalCreative(
  input: GenerationRequest,
  builtPrompt = buildPrompt(input)
): Promise<GenerationResult> {
  const model = getModelPreset(input.modelId);
  return generateMockCreative({
    input,
    builtPrompt,
    model: model.modelName || "slapr-character-lock-v0",
    seed: input.seed || makeSeed()
  });
}

async function generateRemoteCreative(input: GenerationRequest): Promise<GenerationResult> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const payload = (await response.json().catch(() => null)) as GenerationResult | { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error || "remote image api unavailable");
  }

  return payload as GenerationResult;
}

function resolveCredentialForModel(
  modelId: string,
  credentials: ApiCredential[],
  selectedCredentialIds: Partial<Record<CredentialProvider, string>>
): ApiCredential | undefined {
  const provider = getModelPreset(modelId).provider;
  if (!isCredentialProvider(provider)) return undefined;
  const selectedId = selectedCredentialIds[provider];
  return credentials.find(
    (credential) => credential.provider === provider && credential.id === selectedId
  );
}

function getProviderNameForModel(modelId: string): string {
  return getProviderPreset(getModelPreset(modelId).provider).label;
}

function modelNeedsCredential(modelId: string): boolean {
  return isCredentialProvider(getModelPreset(modelId).provider);
}

function getModelStatus(
  modelId: string,
  credentials: ApiCredential[],
  selectedCredentialIds: Partial<Record<CredentialProvider, string>>,
  providerStatuses: Partial<Record<CredentialProvider, ProviderStatus>>
): "local" | "missing" | "connected" | "checking" | "working" | "failed" {
  const model = getModelPreset(modelId);
  if (model.provider === "mock") return "local";
  if (!isCredentialProvider(model.provider)) {
    return model.provider === "pollinations" ? "failed" : "connected";
  }
  const credential = resolveCredentialForModel(modelId, credentials, selectedCredentialIds);
  if (!credential) return "missing";
  return providerStatuses[model.provider] || "connected";
}

function modelStatusLabel(status: ReturnType<typeof getModelStatus>) {
  if (status === "local") return { label: "local", short: "LOCAL", dotClass: "bg-white" };
  if (status === "missing") return { label: "not connected", short: "NO KEY", dotClass: "bg-brand" };
  if (status === "checking") return { label: "checking", short: "TEST", dotClass: "bg-yellow-300" };
  if (status === "working") return { label: "working", short: "OK", dotClass: "bg-green-400" };
  if (status === "failed") return { label: "not working", short: "BAD", dotClass: "bg-brand" };
  return { label: "connected", short: "CONN", dotClass: "bg-yellow-300" };
}

function loadCredentials(): ApiCredential[] {
  if (typeof window === "undefined") return [];
  return [
    ...readStoredCredentials(sessionStorage.getItem(SESSION_KEY), "session"),
    ...readStoredCredentials(localStorage.getItem(LOCAL_KEY), "local")
  ];
}

function loadProviderStatuses(): Partial<Record<CredentialProvider, ProviderStatus>> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STATUS_KEY) || "{}") as Partial<
      Record<CredentialProvider, ProviderStatus>
    >;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistProviderStatuses(statuses: Partial<Record<CredentialProvider, ProviderStatus>>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
}

function persistCredentials(credentials: ApiCredential[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(credentials.filter((credential) => credential.storage === "session"))
  );
  localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify(credentials.filter((credential) => credential.storage === "local"))
  );
}

function readStoredCredentials(
  value: string | null,
  storage: ApiCredentialStorage
): ApiCredential[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as ApiCredential[];
    return Array.isArray(parsed)
      ? parsed
          .filter((credential) => credential.storage === storage)
          .filter((credential) => credential.id && credential.provider && credential.key)
      : [];
  } catch {
    return [];
  }
}

function defaultSelectedCredentials(
  credentials: ApiCredential[]
): Partial<Record<CredentialProvider, string>> {
  return credentials.reduce<Partial<Record<CredentialProvider, string>>>((selected, credential) => {
    if (!selected[credential.provider]) selected[credential.provider] = credential.id;
    return selected;
  }, {});
}

function storageClass(active: boolean): string {
  return `h-8 border px-2 text-[11px] font-black uppercase ${
    active ? "border-brand bg-brand/20 text-brand" : "border-line text-zinc-400 hover:text-white"
  }`;
}

function maskKey(value: string): string {
  if (value.length <= 10) return "hidden";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

async function saveGeneratedImage(
  imageUrl: string,
  format: DownloadFormat,
  aspectRatio: AspectRatio
): Promise<void> {
  if (format === "svg") {
    const [width, height] = dimensionsForAspectRatio(aspectRatio);
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      '<rect width="100%" height="100%" fill="#050707"/>',
      `<image href="${escapeAttribute(imageUrl)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`,
      "</svg>"
    ].join("");
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "slapr-output.svg");
    return;
  }

  const image = await loadImage(imageUrl);
  const fallbackDimensions = dimensionsForAspectRatio(aspectRatio);
  const width = image.naturalWidth || fallbackDimensions[0];
  const height = image.naturalHeight || fallbackDimensions[1];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("could not prepare image export");

  if (format === "jpg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, 0, 0, width, height);

  const mimeType = format === "jpg" ? "image/jpeg" : `image/${format}`;
  const blob = await canvasToBlob(canvas, mimeType);
  downloadBlob(blob, `slapr-output.${format}`);
}

async function prepareSourceImageForAspectRatio(
  sourceImage: SourceImage,
  aspectRatio: AspectRatio
): Promise<SourceImage> {
  const image = await loadImage(sourceImage.dataUrl);
  const [targetWidth, targetHeight] = dimensionsForAspectRatio(aspectRatio);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("could not prepare source image");

  context.fillStyle = "#050707";
  context.fillRect(0, 0, targetWidth, targetHeight);

  const imageRatio = (image.naturalWidth || targetWidth) / (image.naturalHeight || targetHeight);
  const targetRatio = targetWidth / targetHeight;
  const drawWidth = imageRatio > targetRatio ? targetWidth : targetHeight * imageRatio;
  const drawHeight = imageRatio > targetRatio ? targetWidth / imageRatio : targetHeight;
  const drawX = (targetWidth - drawWidth) / 2;
  const drawY = (targetHeight - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.92),
    name: `${cleanName(sourceImage.name) || "source"}-${aspectRatio.replace(":", "x")}.jpg`,
    mimeType: "image/jpeg",
    width: targetWidth,
    height: targetHeight
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("could not load generated image for export"));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("could not encode selected image format"));
      },
      mimeType,
      0.94
    );
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function dimensionsForAspectRatio(aspectRatio: AspectRatio): [number, number] {
  if (aspectRatio === "16:9") return [1600, 900];
  if (aspectRatio === "9:16") return [900, 1600];
  if (aspectRatio === "21:9") return [2100, 900];
  return [1200, 1200];
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("could not read uploaded image"));
    reader.readAsDataURL(file);
  });
}

function cleanName(value: string): string {
  return value.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim();
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeSeed(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
