"use client";

import { useEffect, useRef, useState } from "react";

type Photo = { id: string; dataUrl: string };

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function PhotoManager() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/photos")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPhotos(data?.photos ?? []))
      .catch(() => {});
  }, []);

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        const res = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Błąd" }));
          throw new Error(body.error ?? "Nie udało się dodać zdjęcia");
        }
      }
      const refreshed = await fetch("/api/photos").then((res) => res.json());
      setPhotos(refreshed.photos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="self-start rounded-full bg-accent-teal px-5 py-2.5 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50"
      >
        {uploading ? "Dodawanie…" : "+ Dodaj zdjęcia"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesChange}
        className="hidden"
      />
      {error && <p className="text-sm text-accent-coral">{error}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.dataUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => deletePhoto(photo.id)}
                aria-label="Usuń zdjęcie"
                className="absolute top-1 right-1 rounded-full bg-black/50 px-1.5 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
