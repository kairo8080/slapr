"use client";

import {
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { useState } from "react";
import {
  credentialProviders,
  getProviderPreset,
  modelPresets,
  providerPresets
} from "@/lib/registries/models";
import type { ApiCredential, ApiCredentialStorage, CredentialProvider } from "@/lib/types";

type ApiKeysPanelProps = {
  credentials: ApiCredential[];
  selectedCredentialIds: Partial<Record<CredentialProvider, string>>;
  onAddCredential: (credential: ApiCredential) => void;
  onRemoveCredential: (id: string) => void;
  onClearCredentials: () => void;
  onSelectCredential: (provider: CredentialProvider, id: string) => void;
};

const defaultProvider: CredentialProvider = "openai";

export function ApiKeysPanel({
  credentials,
  selectedCredentialIds,
  onAddCredential,
  onRemoveCredential,
  onClearCredentials,
  onSelectCredential
}: ApiKeysPanelProps) {
  const [provider, setProvider] = useState<CredentialProvider>(defaultProvider);
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [storage, setStorage] = useState<ApiCredentialStorage>("session");
  const [error, setError] = useState<string | null>(null);
  const selectedProvider = getProviderPreset(provider);
  const keyCheck = describeKey(provider, key);

  function addCredential() {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setError("Paste an API key or token first.");
      return;
    }
    if (keyCheck.status === "bad") {
      setError(keyCheck.message);
      return;
    }

    const credential: ApiCredential = {
      id: makeId(),
      provider,
      label: (label || selectedProvider.label).trim().slice(0, 42),
      key: trimmedKey,
      storage,
      createdAt: new Date().toISOString()
    };

    onAddCredential(credential);
    setLabel("");
    setKey("");
    setError(null);
  }

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-line bg-panel/92">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">/api_keys</h2>
            <p className="text-xs font-bold text-zinc-400">local.session.provider.router</p>
          </div>
          <ShieldCheck className="h-5 w-5 text-brand" aria-hidden="true" />
        </div>
      </div>

      <div className="slapr-scroll flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
        <section className="rounded-lg border border-line bg-ink p-4">
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-normal text-zinc-400">
                provider
              </span>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value as CredentialProvider)}
                className="h-11 w-full rounded-lg border border-line bg-panel px-3 text-sm font-bold text-white outline-none transition focus:border-brand"
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
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-normal text-zinc-400">
                label
              </span>
              <input
                value={label}
                maxLength={42}
                onChange={(event) => setLabel(event.target.value)}
                className="h-11 w-full rounded-lg border border-line bg-panel px-3 text-sm font-bold text-white outline-none transition focus:border-brand"
                placeholder={`${selectedProvider.label} key`}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-normal text-zinc-400">
                key
              </span>
              <span className="grid grid-cols-[1fr_auto]">
                <input
                  value={key}
                  type={showKey ? "text" : "password"}
                  autoComplete="off"
                  onChange={(event) => {
                    setKey(event.target.value);
                    setError(null);
                  }}
                  className="h-11 w-full rounded-l-lg border border-line bg-panel px-3 text-sm font-bold text-white outline-none transition focus:border-brand"
                  placeholder={selectedProvider.keyLabel || "API key"}
                />
                <button
                  type="button"
                  title={showKey ? "Hide key" : "Show key"}
                  className="grid h-11 w-11 place-items-center rounded-r-lg border border-l-0 border-line bg-panel text-zinc-300 transition hover:border-brand hover:text-brand"
                  onClick={() => setShowKey((current) => !current)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </span>
            </label>

            <div className={`rounded-lg border px-3 py-2 text-xs font-semibold leading-5 ${
              keyCheck.status === "bad"
                ? "border-danger/40 bg-danger/10 text-danger"
                : "border-line bg-panel text-zinc-500"
            }`}>
              <span className="flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{keyCheck.message}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={storageButtonClass(storage === "session")}
                onClick={() => setStorage("session")}
              >
                session
              </button>
              <button
                type="button"
                className={storageButtonClass(storage === "local")}
                onClick={() => setStorage("local")}
              >
                remember
              </button>
            </div>

            {error ? (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={addCredential}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-black text-ink transition hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              add key
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold leading-5 text-zinc-500">
            Session keys disappear when the browser session ends. Remembered keys stay in this
            browser only. Production keys should live in server environment variables.
          </p>
          <p className="mt-2 text-xs font-semibold leading-5 text-zinc-500">
            Server fallback: set {selectedProvider.envVar} and choose the server option in /brief.
          </p>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-black uppercase tracking-normal text-zinc-400">
              saved_keys
            </h3>
            {credentials.length ? (
              <button
                type="button"
                onClick={onClearCredentials}
                className="h-8 rounded-lg border border-line px-2 text-[11px] font-black uppercase tracking-normal text-zinc-300 transition hover:border-danger hover:text-danger"
              >
                clear all
              </button>
            ) : null}
          </div>
          <div className="grid gap-2">
            {credentials.length ? (
              credentials.map((credential) => {
                const providerInfo = getProviderPreset(credential.provider);
                const active = selectedCredentialIds[credential.provider] === credential.id;
                return (
                  <div
                    key={credential.id}
                    className={`grid gap-3 rounded-lg border p-3 ${
                      active ? "border-brand bg-brand/10" : "border-line bg-ink"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{credential.label}</p>
                        <p className="truncate text-xs font-bold text-zinc-500">
                          {providerInfo.label} // {maskKey(credential.key)} // {credential.storage}
                        </p>
                      </div>
                      <button
                        type="button"
                        title="Delete key"
                        onClick={() => onRemoveCredential(credential.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-zinc-300 transition hover:border-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectCredential(credential.provider, credential.id)}
                      className={`h-9 rounded-lg border px-3 text-xs font-black uppercase tracking-normal transition ${
                        active
                          ? "border-brand bg-brand text-ink"
                          : "border-line text-zinc-300 hover:border-brand hover:text-brand"
                      }`}
                    >
                      {active ? "selected" : "use for provider"}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-line bg-ink p-4 text-sm font-semibold leading-6 text-zinc-400">
                No browser keys saved. You can still use server environment variables for providers.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

export function KeyGuidePanel() {
  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-line bg-panel/92">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">/key_guide</h2>
            <p className="text-xs font-bold text-zinc-400">where.find.paste.select.run</p>
          </div>
          <KeyRound className="h-5 w-5 text-brand" aria-hidden="true" />
        </div>
      </div>

      <div className="slapr-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
        <section className="rounded-lg border border-line bg-ink p-4">
          <h3 className="text-sm font-black text-white">starter_path</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-semibold leading-6 text-zinc-400">
            <li>Use SLAPR Local or Pollinations first to test the prompt and layout.</li>
            <li>Add one paid key only when you need real provider output.</li>
            <li>Select the matching model in /brief before running the generation.</li>
          </ol>
        </section>

        {providerPresets
          .filter((provider) => provider.id !== "auto")
          .map((provider) => {
            const models = modelPresets.filter((model) => model.provider === provider.id && model.output === "image");
            return (
              <article key={provider.id} className="rounded-lg border border-line bg-ink p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white">{provider.label}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-normal text-zinc-500">
                      {provider.category} // {provider.implemented ? "wired" : "planned"}
                    </p>
                  </div>
                  {provider.keyUrl ? (
                    <a
                      href={provider.keyUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={`${provider.label} API key page`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-zinc-200 transition hover:border-brand hover:text-brand"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>

                <p className="text-sm font-semibold leading-6 text-zinc-300">{provider.summary}</p>

                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-semibold leading-6 text-zinc-400">
                  {provider.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>

                {models.length ? (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="mb-2 text-xs font-black uppercase tracking-normal text-zinc-500">
                      models
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {models.map((model) => (
                        <span
                          key={model.id}
                          className="rounded-lg border border-line bg-panel px-2 py-1 text-[11px] font-black text-zinc-300"
                        >
                          {model.modelName}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {provider.docsUrl ? (
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-normal text-brand"
                  >
                    official docs
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </article>
            );
          })}
      </div>
    </section>
  );
}

function storageButtonClass(active: boolean): string {
  return `h-10 rounded-lg border px-3 text-xs font-black uppercase tracking-normal transition ${
    active ? "border-brand bg-brand/10 text-brand" : "border-line bg-panel text-zinc-300 hover:border-zinc-500"
  }`;
}

function maskKey(value: string): string {
  if (value.length <= 10) return "hidden";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function describeKey(
  provider: CredentialProvider,
  value: string
): { status: "empty" | "ok" | "warn" | "bad"; message: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    if (provider === "openai") return { status: "empty", message: "OpenAI keys usually start with sk-." };
    if (provider === "google") return { status: "empty", message: "Google AI Studio keys are pasted as a single API key string." };
    if (provider === "stability") return { status: "empty", message: "Stability keys are pasted from the Developer Platform API key page." };
    if (provider === "huggingface") return { status: "empty", message: "Hugging Face tokens usually start with hf_." };
    if (provider === "xai") return { status: "empty", message: "xAI keys are pasted from the xAI API Console." };
    return { status: "empty", message: "BFL keys are pasted from the Black Forest Labs dashboard." };
  }
  if (trimmed.length < 16) {
    return { status: "bad", message: "That key looks too short. Paste the full provider key." };
  }
  if (provider === "openai" && !trimmed.startsWith("sk-")) {
    return { status: "warn", message: "This does not look like a typical OpenAI key, but SLAPR will allow it." };
  }
  if (provider === "huggingface" && !trimmed.startsWith("hf_")) {
    return { status: "warn", message: "This does not look like a typical Hugging Face token, but SLAPR will allow it." };
  }
  return { status: "ok", message: "Key shape looks plausible. It is not validated until a generation request runs." };
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
