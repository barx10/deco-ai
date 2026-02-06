"use client";

import { useCallback, useRef } from "react";

interface ImageUploadProps {
  onImageLoad: (dataUrl: string) => void;
}

export default function ImageUpload({ onImageLoad }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Vennligst velg en bildefil (JPG eller PNG).");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageLoad(result);
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-blue-50/50 transition-colors"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <div>
          <p className="text-lg font-medium">
            Dra og slipp et bilde her
          </p>
          <p className="text-sm text-gray-500 mt-1">
            eller klikk for å velge fil (JPG/PNG)
          </p>
        </div>
      </div>
    </div>
  );
}
