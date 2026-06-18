"use client";

import { useState, useRef, useCallback } from "react";
import {
  Scissors, Upload, Download, Image as ImageIcon,
  Loader2, Check, ZoomIn, ZoomOut,
} from "lucide-react";

interface CreatureViewerProps {
  creatureUrl?: string;
  franchise: string;
  slug: string;
  className?: string;
  onCreatureProcessed?: (newUrl: string) => void;
}

export default function CreatureViewer({
  creatureUrl,
  franchise,
  slug,
  className = "",
  onCreatureProcessed,
}: CreatureViewerProps) {
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showCheckerboard, setShowCheckerboard] = useState(true);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveBackground = useCallback(async () => {
    if (!creatureUrl) {
      setError("No creature image to process");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrl: creatureUrl, franchise, slug }),
      });
      const data = await res.json();
      if (data.success && data.resultUrl) {
        const url = data.resultUrl + "?t=" + Date.now();
        setPreviewUrl(url);
        onCreatureProcessed?.(url);
      } else {
        setError(data.error || "Background removal failed");
      }
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setProcessing(false);
    }
  }, [creatureUrl, franchise, slug, onCreatureProcessed]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setProcessing(true);
      setError("");
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("franchise", franchise);
        formData.append("slug", slug);

        const res = await fetch("/api/admin/remove-bg", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.resultUrl) {
          const url = data.resultUrl + "?t=" + Date.now();
          setPreviewUrl(url);
          onCreatureProcessed?.(url);
        } else {
          setError(data.error || "Upload failed");
        }
      } catch (e: any) {
        setError(e.message || "Upload error");
      } finally {
        setProcessing(false);
      }
    },
    [franchise, slug, onCreatureProcessed]
  );

  const displayUrl = previewUrl || creatureUrl;

  return (
    <div className={`mag-card p-3 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5" /> Creature Art
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1 rounded hover:bg-ttg-black/5 text-ttg-black/30"
            disabled={!displayUrl}
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[8px] font-bold text-ttg-black/20 w-8 text-center">{zoom.toFixed(1)}x</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-1 rounded hover:bg-ttg-black/5 text-ttg-black/30"
            disabled={!displayUrl}
          >
            <ZoomIn className="w-3 h-3" />
          </button>

          <div className="w-px h-4 bg-ttg-black/10 mx-1" />

          <button
            onClick={() => setShowCheckerboard(!showCheckerboard)}
            className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded transition-all ${
              showCheckerboard
                ? "bg-ttg-black/10 text-ttg-black/50"
                : "bg-transparent text-ttg-black/20"
            }`}
          >
            α
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div
        className="relative rounded-lg overflow-hidden border border-ttg-black/10 mb-2 flex items-center justify-center min-h-[180px]"
        style={{
          backgroundImage: showCheckerboard
            ? `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='10' height='10' fill='%23e5e5e5'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23e5e5e5'/%3E%3Crect x='10' width='10' height='10' fill='%23fff'/%3E%3Crect y='10' width='10' height='10' fill='%23fff'/%3E%3C/svg%3E")`
            : "var(--ttg-black)",
          backgroundSize: showCheckerboard ? "20px 20px" : undefined,
        }}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Creature art"
            className="object-contain transition-transform"
            style={{
              maxWidth: `${200 * zoom}px`,
              maxHeight: `${200 * zoom}px`,
              transform: `scale(${zoom})`,
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ttg-black/15 py-8">
            <ImageIcon className="w-10 h-10" />
            <span className="text-[9px] font-bold uppercase">No creature</span>
          </div>
        )}

        {/* Processing overlay */}
        {processing && (
          <div className="absolute inset-0 bg-ttg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-ttg-yellow" />
              <span className="text-[9px] font-black text-white uppercase">Removing background...</span>
            </div>
          </div>
        )}

        {/* Success badge */}
        {previewUrl && !processing && (
          <div className="absolute top-2 right-2 bg-ttg-success text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-ttg-black/20">
            <Check className="w-2.5 h-2.5" /> No BG
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-[8px] font-bold text-ttg-red px-2 py-1 bg-ttg-red/5 rounded mb-2">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRemoveBackground}
          disabled={!creatureUrl || processing}
          className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded bg-ttg-red text-white border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] hover:shadow-[1px_1px_0px_var(--ttg-black)] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {processing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Scissors className="w-3 h-3" />
          )}
          Remove BG
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded bg-ttg-black/5 hover:bg-ttg-black/10 text-ttg-black/50 border-2 border-ttg-black/10 flex items-center gap-1.5 disabled:opacity-40 transition-all"
        >
          <Upload className="w-3 h-3" />
          Upload
        </button>

        {previewUrl && (
          <a
            href={previewUrl}
            download={`${slug}-creature.png`}
            className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded bg-ttg-success/10 hover:bg-ttg-success/20 text-ttg-success border-2 border-transparent flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3 h-3" />
            Download
          </a>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Info */}
      <div className="mt-2 pt-2 border-t border-ttg-black/10 flex items-center gap-2 text-[7px] font-medium text-ttg-black/25">
        <span>Slug: {slug || "—"}</span>
        <span>·</span>
        <span>Franchise: {franchise || "—"}</span>
      </div>
    </div>
  );
}
