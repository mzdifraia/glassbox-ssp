"use client";

interface BeatPauseBannerProps {
  message: string | null;
}

export function BeatPauseBanner({ message }: BeatPauseBannerProps) {
  if (!message) return null;

  return (
    <div
      className="animate-moment-in rounded-xl border border-cyan-700/50 bg-cyan-950/40 px-4 py-3 text-center text-sm text-cyan-100"
      role="status"
    >
      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
      {message}
    </div>
  );
}
