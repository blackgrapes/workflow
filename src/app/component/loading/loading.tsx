import React from "react";

export type SkeletonVariant =
  | "full"
  | "card"
  | "list"
  | "nav"
  | "sidebar"
  | "avatar"
  | "text";

export interface LoadingSkeletonProps {
  /** Which visual variant to render (nav, sidebar, card, list, full, avatar, text) */
  variant?: SkeletonVariant;
  /** Additional className forwarded to root wrapper */
  className?: string;
  /** For list variant: how many repeated rows */
  count?: number;
}

/**
 * Reusable Loading Skeleton
 * - Single component meant to be used everywhere: navbar, sidebar, content cards, lists, avatars, full page
 * - Built with Tailwind CSS utility classes (animate-pulse, responsive utilities)
 * - Respects prefers-reduced-motion using `motion-reduce:animate-none`
 *
 * Usage examples shown at bottom of file. Default export is the component.
 */
export default function LoadingSkeleton({
  variant = "full",
  className = "",
  count = 3,
}: LoadingSkeletonProps) {
  const common =
    "bg-gray-200/80 dark:bg-gray-700/60 rounded-md motion-safe:animate-pulse motion-reduce:animate-none";

  if (variant === "nav") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading navigation"
        className={`w-full flex items-center gap-3 p-3 ${className}`}
      >
        <div className={`${common} h-8 w-32 sm:w-48`} />
        <div className="flex-1 hidden sm:flex gap-3">
          <div className={`${common} h-6 w-20`} />
          <div className={`${common} h-6 w-20`} />
          <div className={`${common} h-6 w-20`} />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className={`${common} h-8 w-8 rounded-full`} />
          <div className={`${common} h-8 w-8 rounded-md`} />
        </div>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <aside
        aria-busy="true"
        aria-label="Loading sidebar"
        className={`w-64 sm:w-72 lg:w-80 p-4 ${className}`}
      >
        <div className={`${common} h-10 w-full mb-4`} />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`${common} h-9 w-9 rounded-md`} />
              <div className={`${common} h-6 w-36`} />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  if (variant === "card") {
    return (
      <div aria-busy="true" aria-label="Loading card" className={`p-4 ${className}`}>
        <div className={`${common} h-44 w-full rounded-xl mb-4`} />
        <div className="space-y-3">
          <div className={`${common} h-6 w-3/4`} />
          <div className={`${common} h-4 w-1/2`} />
          <div className="flex gap-2 mt-2">
            <div className={`${common} h-9 w-20 rounded-md`} />
            <div className={`${common} h-9 w-20 rounded-md`} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div aria-busy="true" aria-label="Loading list" className={`space-y-4 ${className}`}>
        {Array.from({ length: Math.max(1, count) }).map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className={`${common} h-12 w-12 rounded-md flex-shrink-0`} />
            <div className="flex-1">
              <div className={`${common} h-5 w-1/2 mb-2`} />
              <div className={`${common} h-4 w-3/4`} />
            </div>
            <div className={`${common} h-8 w-8 rounded-md`} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "avatar") {
    return (
      <div aria-busy="true" aria-label="Loading avatar" className={`flex items-center gap-3 ${className}`}>
        <div className={`${common} h-12 w-12 rounded-full`} />
        <div>
          <div className={`${common} h-4 w-36 mb-2`} />
          <div className={`${common} h-3 w-28`} />
        </div>
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div aria-busy="true" aria-label="Loading text block" className={`${className} space-y-2`}>
        <div className={`${common} h-4 w-5/6`} />
        <div className={`${common} h-4 w-4/6`} />
        <div className={`${common} h-4 w-3/6`} />
      </div>
    );
  }

  // Full page / generic fallback skeleton
  return (
    <div
      aria-busy="true"
      aria-label="Loading content"
      className={`min-h-[200px] w-full p-4 grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}
    >
      <div className="md:col-span-2 space-y-4">
        <div className={`${common} h-8 w-1/3`} />
        <div className={`${common} h-44 w-full rounded-xl`} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`${common} h-32 w-full rounded-lg`} />
          <div className={`${common} h-32 w-full rounded-lg`} />
        </div>

        <div className={`${common} h-4 w-2/3`} />
        <div className={`${common} h-4 w-3/4`} />
        <div className={`${common} h-4 w-1/2`} />
      </div>

      <aside className="space-y-4">
        <div className={`${common} h-10 w-full`} />
        <div className={`${common} h-10 w-full`} />
        <div className={`${common} h-10 w-full`} />
      </aside>
    </div>
  );
}
