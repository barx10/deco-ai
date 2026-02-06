"use client";

import { useState, useEffect } from "react";

interface ApiKeyInputProps {
  onKeySet: (key: string) => void;
}

export default function ApiKeyInput({ onKeySet }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("replicate_api_key");
    if (stored) {
      setApiKey(stored);
      onKeySet(stored);
      setSaved(true);
    }
  }, [onKeySet]);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem("replicate_api_key", apiKey.trim());
    onKeySet(apiKey.trim());
    setSaved(true);
  };

  const handleClear = () => {
    localStorage.removeItem("replicate_api_key");
    setApiKey("");
    onKeySet("");
    setSaved(false);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 mb-6">
      <h2 className="text-lg font-semibold mb-2">Replicate API-nøkkel</h2>
      <p className="text-sm text-secondary mb-4">
        Du trenger en API-nøkkel fra Replicate for å bruke denne tjenesten.
        Estimert kostnad: ~$0.01 per bilde.{" "}
        <a
          href="https://replicate.com/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary-hover"
        >
          Få nøkkel her →
        </a>
      </p>
      <div className="flex gap-3">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setSaved(false);
          }}
          placeholder="r8_xxxxxxxxxxxxxxxxxxxxxxxx"
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
          ✓ API-nøkkel lagret
        </p>
      )}
    </div>
  );
}
