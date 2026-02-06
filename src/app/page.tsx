"use client";

import { useState, useCallback } from "react";
import ApiKeyInput, { Provider } from "@/components/ApiKeyInput";
import ImageUpload from "@/components/ImageUpload";
import CanvasEditor from "@/components/CanvasEditor";
import ResultView from "@/components/ResultView";

type AppState = "upload" | "edit" | "result";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<Provider>("fal");
  const [appState, setAppState] = useState<AppState>("upload");
  const [imageSrc, setImageSrc] = useState("");
  const [resultSrc, setResultSrc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleKeySet = useCallback((key: string) => {
    setApiKey(key);
  }, []);

  const handleImageLoad = (dataUrl: string) => {
    setImageSrc(dataUrl);
    setAppState("edit");
    setError("");
  };

  const handleGenerate = async (
    imageData: string,
    maskData: string,
    prompt: string,
    model?: string
  ) => {
    if (!apiKey) {
      setError("Legg inn API-nøkkel først.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          mask: maskData,
          prompt,
          apiKey,
          provider,
          model: model || "qwen",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Noe gikk galt. Prøv igjen.");
        return;
      }

      setResultSrc(data.output);
      setAppState("result");
    } catch {
      setError("Kunne ikke koble til serveren. Sjekk internettforbindelsen.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setImageSrc("");
    setResultSrc("");
    setAppState("upload");
    setError("");
  };

  const handleEditAgain = () => {
    setAppState("edit");
    setError("");
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold">Interiørdesign Editor</h1>
          <p className="text-sm text-gray-500 mt-1">
            Endre farger og erstatt objekter i interiørbilder med AI
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {/* API Key */}
        <ApiKeyInput
          onKeySet={handleKeySet}
          provider={provider}
          onProviderChange={setProvider}
        />

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <StepBadge
            num={1}
            label="Last opp"
            active={appState === "upload"}
            done={appState !== "upload"}
          />
          <div className="h-px flex-1 bg-border" />
          <StepBadge
            num={2}
            label="Rediger"
            active={appState === "edit"}
            done={appState === "result"}
          />
          <div className="h-px flex-1 bg-border" />
          <StepBadge
            num={3}
            label="Resultat"
            active={appState === "result"}
            done={false}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {appState === "upload" && <ImageUpload onImageLoad={handleImageLoad} />}

        {appState === "edit" && imageSrc && (
          <CanvasEditor
            imageSrc={imageSrc}
            onGenerate={handleGenerate}
            isProcessing={isProcessing}
          />
        )}

        {appState === "result" && resultSrc && (
          <ResultView
            originalSrc={imageSrc}
            resultSrc={resultSrc}
            onReset={handleReset}
            onEditAgain={handleEditAgain}
          />
        )}

        {/* No API key warning */}
        {!apiKey && appState !== "upload" && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
            Husk å legge inn din API-nøkkel ovenfor for å generere bilder.
          </div>
        )}
      </main>
    </div>
  );
}

function StepBadge({
  num,
  label,
  active,
  done,
}: {
  num: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          active
            ? "bg-primary text-white"
            : done
              ? "bg-success text-white"
              : "bg-gray-200 text-gray-500"
        }`}
      >
        {done ? "✓" : num}
      </span>
      <span
        className={`${active ? "font-medium text-foreground" : "text-gray-500"}`}
      >
        {label}
      </span>
    </div>
  );
}
