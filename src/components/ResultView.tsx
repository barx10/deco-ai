"use client";

import { useState } from "react";

interface ResultViewProps {
  originalSrc: string;
  resultSrc: string;
  onReset: () => void;
  onEditAgain: () => void;
}

export default function ResultView({
  originalSrc,
  resultSrc,
  onReset,
  onEditAgain,
}: ResultViewProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = resultSrc;
    link.download = `interiør-redigert-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Toggle */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setShowOriginal(false)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              !showOriginal
                ? "bg-primary text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Resultat
          </button>
          <button
            onClick={() => setShowOriginal(true)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              showOriginal
                ? "bg-primary text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Original
          </button>
        </div>

        {/* Image */}
        <div className="flex justify-center bg-gray-50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showOriginal ? originalSrc : resultSrc}
            alt={showOriginal ? "Originalbilde" : "Redigert bilde"}
            className="max-w-full max-h-[600px] object-contain rounded"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex-1 py-3 bg-success text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Last ned resultat
        </button>
        <button
          onClick={onEditAgain}
          className="flex-1 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
        >
          Rediger videre
        </button>
        <button
          onClick={onReset}
          className="py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Nytt bilde
        </button>
      </div>
    </div>
  );
}
