"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { TodaySummaryOverlay } from "@/components/TodaySummary";

type Photo = { id: string; dataUrl: string };

const SLIDE_SECONDS = 8;

export default function PhotoSlideshow({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!open) return;
    // Reset to the first slide each time the slideshow is (re)opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(0);
    fetch("/api/photos")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPhotos(data?.photos ?? []))
      .catch(() => setPhotos([]));
  }, [open]);

  useEffect(() => {
    if (!open || photos.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, SLIDE_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [open, photos.length]);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black"
      onClick={onClose}
    >
      {photos.length === 0 ? (
        <p className="text-lg text-white/70">
          Brak zdjęć — dodaj je w Ustawieniach, żeby uruchomić ramkę cyfrową.
        </p>
      ) : (
        photos.map((photo, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.dataUrl}
            alt=""
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))
      )}

      <div className="absolute right-8 bottom-8 text-right text-white drop-shadow-lg" suppressHydrationWarning>
        <p className="text-4xl font-semibold tabular-nums">{format(now, "HH:mm")}</p>
        <p className="text-lg capitalize">{format(now, "EEEE, d MMMM", { locale: pl })}</p>
      </div>

      <p className="absolute top-8 left-8 text-sm text-white/50">
        Dotknij ekranu, aby wrócić
      </p>

      <div className="absolute bottom-8 left-8" onClick={(e) => e.stopPropagation()}>
        <TodaySummaryOverlay />
      </div>
    </div>
  );
}
