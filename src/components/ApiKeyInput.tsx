"use client";

import { useState, useEffect } from "react";

export type Provider = "fal" | "replicate";

interface ApiKeyInputProps {
  onKeySet: (key: string) => void;
  provider: Provider;
  onProviderChange: (provider: Provider) => void;
}

const PROVIDER_CONFIG = {
  fal: {
    name: "FAL.ai",
    placeholder: "fal_xxxxxxxxxxxxxxxxxxxxxxxx",
    storageKey: "fal_api_key",
    signupUrl: "https://fal.ai/dashboard/keys",
    cost: "~$0.01",
  },
  replicate: {
    name: "Replicate",
    placeholder: "r8_xxxxxxxxxxxxxxxxxxxxxxxx",
    storageKey: "replicate_api_key",
    cost: "~$0.01",
  },
};

export default function ApiKeyInput({
  onKeySet,
  provider,
  onProviderChange,
}: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const config = PROVIDER_CONFIG[provider];

  useEffect(() => {
    const stored = localStorage.getItem(config.storageKey);
    if (stored) {
      setApiKey(stored);
      onKeySet(stored);
      setSaved(true);
    } else {
      setApiKey("");
      onKeySet("");
      setSaved(false);
    }
  }, [provider, config.storageKey, onKeySet]);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem(config.storageKey, apiKey.trim());
    onKeySet(apiKey.trim());
    setSaved(true);
  };

  const handleClear = () => {
    localStorage.removeItem(config.storageKey);
    setApiKey("");
    onKeySet("");
    setSaved(false);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 mb-6">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold">API-leverandør</h2>
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          <button
            onClick={() => onProviderChange("fal")}
            className={`px-3 py-1.5 transition-colors ${
              provider === "fal"
                ? "bg-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            FAL.ai
          </button>
          <button
            onClick={() => onProviderChange("replicate")}
            className={`px-3 py-1.5 transition-colors ${
              provider === "replicate"
                ? "bg-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Replicate
          </button>
        </div>
      </div>

      <p className="text-sm text-secondary mb-4">
        Du trenger en API-nøkkel fra {config.name}. Estimert kostnad:{" "}
        {config.cost} per bilde.{" "}
        {provider === "fal" ? (
          <a
            href="https://fal.ai/dashboard/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary-hover"
          >
            Få nøkkel hos FAL.ai →
          </a>
        ) : (
          <a
            href="https://replicate.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary-hover"
          >
            Få nøkkel hos Replicate →
          </a>
        )}
      </p>

      <div className="flex gap-3">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setSaved(false);
          }}
          placeholder={config.placeholder}
          className="flex-1 px-4 py-2 border border-border rounded-lg bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {saved ? (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
          >
            Fjern
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Lagre
          </button>
        )}
      </div>
      {saved && (
        <p className="text-sm text-success mt-2">
          ✓ API-nøkkel lagret for {config.name}
        </p>
      )}
    </div>
  );
}
