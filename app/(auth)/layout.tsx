// Copyright (c) Said Borna. All rights reserved.

const APP_NAME = "OutreachPilot";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-lg"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #A855F7)",
              }}
              aria-hidden="true"
            />
            <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {APP_NAME}
            </span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
