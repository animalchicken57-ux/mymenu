"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";

import { removeItemPhoto, uploadItemPhoto } from "@/app/actions/menu";
import { photoUrl, tileColor, tileLetter } from "@/lib/domain/photos";

/**
 * The photo control on one row of the menu editor.
 *
 * No Save button and no modal, because the rest of this editor has neither —
 * picking a file uploads it (EXPERIENCE.md § Component Patterns). A dish with
 * no photo shows the same coloured tile the Diner will see, so the owner is
 * looking at the real thing rather than at an empty grey box.
 */
export function PhotoButton({
  itemId,
  name,
  photoPath,
}: {
  itemId: string;
  name: string;
  photoPath: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const url = photoUrl(photoPath);
  const label = name.trim() || "this dish";

  function upload(file: File) {
    setError(null);
    const data = new FormData();
    data.set("photo", file);

    startTransition(async () => {
      const result = await uploadItemPhoto(itemId, data);
      if (!result.ok) setError(result.error ?? "That did not work.");
      if (input.current) input.current.value = "";
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        id={`photo-${itemId}`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
        }}
      />

      <label
        htmlFor={`photo-${itemId}`}
        title={url ? `Change the photo of ${label}` : `Add a photo of ${label}`}
        className={`relative flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-border-hairline ${
          pending ? "opacity-50" : ""
        }`}
        style={
          url
            ? undefined
            : {
                backgroundColor: `color-mix(in srgb, ${tileColor(name || itemId)} var(--tile-mix), transparent)`,
                color: tileColor(name || itemId),
              }
        }
      >
        {url ? (
          <Image
            src={url}
            alt=""
            width={64}
            height={64}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          <span aria-hidden="true" className="text-heading font-bold">
            {tileLetter(name)}
          </span>
        )}
        <span className="sr-only">
          {url ? `Change the photo of ${label}` : `Add a photo of ${label}`}
        </span>
      </label>

      {url ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await removeItemPhoto(itemId);
              if (!result.ok) setError(result.error ?? "That did not work.");
            });
          }}
          className="text-meta text-ink-secondary hover:text-status-problem disabled:opacity-60"
        >
          Remove
        </button>
      ) : (
        <span className="text-meta text-ink-secondary">
          {pending ? "Sending…" : "Photo"}
        </span>
      )}

      {error ? (
        <p role="alert" className="max-w-32 text-center text-meta text-status-problem">
          {error}
        </p>
      ) : null}
    </div>
  );
}
