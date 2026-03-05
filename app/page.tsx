// Copyright (c) Said Borna. All rights reserved.

const APP_NAME = "OutreachPilot";
const APP_TAGLINE = "LinkedIn Automation & AI Content Platform";
const DEPLOY_STATUS = "Deploy pipeline active — Phase 0 complete.";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #A855F7)",
            }}
            aria-hidden="true"
          />
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            {APP_NAME}
          </h1>
        </div>
        <p className="text-lg text-[var(--text-secondary)]">{APP_TAGLINE}</p>
        <div className="mt-4 rounded-xl border border-white/10 bg-[var(--bg-card)] px-6 py-4">
          <p className="text-sm text-[#22C55E]">{DEPLOY_STATUS}</p>
        </div>
      </div>
    </main>
  );
}
