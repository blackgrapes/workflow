"use client";

import React from "react";

export default function NavbarSkeleton() {
  return (
    <header className="bg-white border-b px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      {/* Left side - skeleton for dashboard title */}
      <div className="w-48 h-6 bg-gray-200 rounded-md animate-pulse motion-reduce:animate-none"></div>

      {/* Right side - skeleton for user info + settings */}
      <div className="flex items-center gap-4">
        {/* User name skeleton */}
        <div className="w-24 h-5 bg-gray-200 rounded-md animate-pulse motion-reduce:animate-none"></div>
        {/* User icon skeleton */}
        <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse motion-reduce:animate-none"></div>
        {/* Settings icon skeleton */}
        <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse motion-reduce:animate-none"></div>
      </div>
    </header>
  );
}
