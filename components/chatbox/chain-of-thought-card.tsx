"use client";

import { ReactNode } from "react";

interface ChainOfThoughtCardProps {
  title?: string;
  children: ReactNode;
}

export function ChainOfThoughtCard({ title, children }: ChainOfThoughtCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      {title && (
        <div className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
          {title}
        </div>
      )}
      <div className="space-y-0">{children}</div>
    </div>
  );
}
