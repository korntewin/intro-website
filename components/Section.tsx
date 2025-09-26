import type { ReactNode } from "react";

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-8">
      <h2 className="mb-3 text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
