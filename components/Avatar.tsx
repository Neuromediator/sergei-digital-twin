"use client";

import { useState } from "react";
import { config } from "@/data/config";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type AvatarProps = {
  size?: number;
  showStatus?: boolean;
  ring?: boolean;
};

// Circular avatar. Uses public/avatar.png; if that image is missing/broken it
// falls back to the user's initials so nothing looks broken before you add a photo.
export default function Avatar({ size = 40, showStatus = false, ring = false }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const dot = Math.max(8, Math.round(size * 0.26));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`h-full w-full overflow-hidden rounded-full bg-neutral-800 ${
          ring ? "ring-2 ring-green-500" : ""
        }`}
      >
        {failed ? (
          <div
            className="flex h-full w-full items-center justify-center font-semibold text-neutral-300"
            style={{ fontSize: size * 0.4 }}
          >
            {initials(config.name)}
          </div>
        ) : (
          // Plain <img> (not next/image) so a missing file degrades gracefully.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={config.avatarSrc}
            alt={config.name}
            width={size}
            height={size}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      {showStatus && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-black bg-green-500"
          style={{ width: dot, height: dot }}
          aria-label="online"
        />
      )}
    </div>
  );
}
