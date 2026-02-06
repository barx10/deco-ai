"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface CanvasEditorProps {
  imageSrc: string;
  onGenerate: (imageData: string, maskData: string, prompt: string) => void;
  isProcessing: boolean;
}

export default function CanvasEditor({
  imageSrc,
  onGenerate,
  isProcessing,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [prompt, setPrompt] = useState("");
  const [action, setAction] = useState<"replace" | "color">("replace");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hasMask, setHasMask] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image and compute canvas size
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;

      const container = containerRef.current;
      if (!container) return;

      const maxWidth = Math.max(container.clientWidth, 300);
      const scale = Math.min(maxWidth / img.width, 600 / img.height, 1);
      const width = Math.floor(img.width * scale);
      const height = Math.floor(img.height * scale);
      setCanvasSize({ width, height });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw image on canvas once canvasSize is set and canvases are mounted
  useEffect(() => {
    const img = imageRef.current;
    if (!img || canvasSize.width === 0) return;

    const imageCanvas = imageCanvasRef.current;
    if (imageCanvas) {
      imageCanvas.width = canvasSize.width;
      imageCanvas.height = canvasSize.height;
      const ctx = imageCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
      }
    }

    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      maskCanvas.width = canvasSize.width;
      maskCanvas.height = canvasSize.height;
      const ctx = maskCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      }
    }
  }, [canvasSize]);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height,
      };
    },
    []
  );

  const draw = useCallback(
    (x: number, y: number) => {
      const ctx = maskCanvasRef.current?.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(255, 0, 100, 0.5)";
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      setHasMask(true);
    },
    [brushSize]
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const coords = getCanvasCoords(e);
      draw(coords.x, coords.y);
    },
    [getCanvasCoords, draw]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const coords = getCanvasCoords(e);

      if ("clientX" in e) {
        const canvas = maskCanvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      }

      if (!isDrawing) return;
      e.preventDefault();
      draw(coords.x, coords.y);
    },
    [isDrawing, getCanvasCoords, draw]
  );

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearMask = () => {
    const ctx = maskCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    setHasMask(false);
  };

  const handleGenerate = () => {
    if (!prompt.trim() || !hasMask) return;

    // Get original image as full-res data URL
    const img = imageRef.current;
    if (!img) return;

    // Create full-res image canvas
    const imgCanvas = document.createElement("canvas");
    imgCanvas.width = img.width;
    imgCanvas.height = img.height;
    const imgCtx = imgCanvas.getContext("2d");
    if (!imgCtx) return;
    imgCtx.drawImage(img, 0, 0);
    const imageData = imgCanvas.toDataURL("image/png");

    // Create full-res mask: white where painted, black elsewhere
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const fullMask = document.createElement("canvas");
    fullMask.width = img.width;
    fullMask.height = img.height;
    const maskCtx = fullMask.getContext("2d");
    if (!maskCtx) return;

    // Fill black
    maskCtx.fillStyle = "#000000";
    maskCtx.fillRect(0, 0, img.width, img.height);

    // Scale mask drawing to full resolution
    const scaleX = img.width / maskCanvas.width;
    const scaleY = img.height / maskCanvas.height;

    // Get the mask pixel data from the displayed mask
    const displayCtx = maskCanvas.getContext("2d");
    if (!displayCtx) return;
    const displayData = displayCtx.getImageData(
      0,
      0,
      maskCanvas.width,
      maskCanvas.height
    );

    // Draw white circles where the mask has paint
    maskCtx.fillStyle = "#ffffff";
    for (let y = 0; y < maskCanvas.height; y++) {
      for (let x = 0; x < maskCanvas.width; x++) {
        const i = (y * maskCanvas.width + x) * 4;
        if (displayData.data[i + 3] > 0) {
          maskCtx.fillRect(
            Math.floor(x * scaleX),
            Math.floor(y * scaleY),
            Math.ceil(scaleX),
            Math.ceil(scaleY)
          );
        }
      }
    }

    const maskData = fullMask.toDataURL("image/png");

    const fullPrompt =
      action === "color"
        ? `Change the color to: ${prompt}. Keep the same object and shape, only change the color.`
        : prompt;

    onGenerate(imageData, maskData, fullPrompt);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Pensel:</label>
          <input
            type="range"
            min="5"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-500 w-8">{brushSize}px</span>
        </div>

        <button
          onClick={clearMask}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Nullstill maske
        </button>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Handling:</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as "replace" | "color")}
            className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white"
          >
            <option value="replace">Erstatt objekt</option>
            <option value="color">Endre farge</option>
          </select>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative bg-surface border border-border rounded-xl overflow-hidden flex justify-center"
      >
        {canvasSize.width > 0 && (
          <div
            className="relative canvas-drawing"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
            }}
            onMouseLeave={() => setCursorPos(null)}
          >
            <canvas
              ref={imageCanvasRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{ imageRendering: "auto" }}
            />
            <canvas
              ref={maskCanvasRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{ imageRendering: "auto" }}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
            {/* Custom cursor */}
            {cursorPos && (
              <div
                className="absolute pointer-events-none border-2 border-white rounded-full"
                style={{
                  width: brushSize,
                  height: brushSize,
                  left: cursorPos.x - brushSize / 2,
                  top: cursorPos.y - brushSize / 2,
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
                }}
              />
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 text-center">
        Mal over området du vil endre. Det rosa feltet viser hva som vil bli
        erstattet.
      </p>

      {/* Prompt and generate */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <label className="block text-sm font-medium">
          {action === "replace"
            ? "Beskriv hva som skal erstatte det markerte området:"
            : "Beskriv hvilken farge du vil ha:"}
        </label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            action === "replace"
              ? "F.eks: moderne blå sofa, minimalistisk gulvlampe..."
              : "F.eks: hvit, varm terrakotta, lys grå..."
          }
          className="w-full px-4 py-2.5 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleGenerate();
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || !hasMask || isProcessing}
          className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Genererer... dette kan ta 10-30 sekunder
            </span>
          ) : (
            "Generer med AI"
          )}
        </button>
      </div>
    </div>
  );
}
