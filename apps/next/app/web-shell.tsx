import type { ReactNode } from "react";

type WebShellVariant = "app" | "auth" | "wide";

type Props = {
  children: ReactNode;
  variant?: WebShellVariant;
};

export function WebShell({ children, variant = "app" }: Props) {
  return (
    <main className={`web-shell web-shell--${variant}`}>
      <div className="web-shell__inner">{children}</div>
    </main>
  );
}
