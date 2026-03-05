// Copyright (c) Said Borna. All rights reserved.
import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Placeholder component for pages under construction.
 */
export function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24">
      <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-8 text-center">
        <Icon className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
    </div>
  );
}
