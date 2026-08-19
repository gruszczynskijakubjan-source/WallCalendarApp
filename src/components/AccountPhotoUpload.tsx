"use client";

import { useRef, useState } from "react";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function AccountPhotoUpload({
  accountId,
  hasCustomImage,
}: {
  accountId: string;
  hasCustomImage: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState(hasCustomImage);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await fetch(`/api/accounts/${accountId}/photo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (!res.ok) {
        const message = await res
          .json()
          .then((body) => body.error as string)
          .catch(() => `Nie udało się zapisać zdjęcia (${res.status})`);
        throw new Error(message);
      }
      setCustomImage(true);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setUploading(false);
    }
  }

  async function handleReset() {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${accountId}/photo`, { method: "DELETE" });
      if (!res.ok) throw new Error("Nie udało się zresetować zdjęcia");
      setCustomImage(false);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-full bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-border disabled:opacity-50"
        >
          {uploading ? "Zapisywanie…" : "Zmień zdjęcie"}
        </button>
        {customImage && (
          <button
            type="button"
            onClick={handleReset}
            disabled={uploading}
            className="rounded-full px-3 py-1.5 text-sm text-foreground/50 hover:bg-surface-muted disabled:opacity-50"
          >
            Reset
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="text-xs text-accent-coral">{error}</p>}
    </div>
  );
}
