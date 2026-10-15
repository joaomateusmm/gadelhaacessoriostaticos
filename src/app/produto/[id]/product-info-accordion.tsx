import { Plus, X } from "lucide-react";
import type { ReactNode } from "react";

export interface ProductSpec {
  label: string;
  value: ReactNode;
}

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-t border-neutral-200 last:border-b"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-base text-neutral-900 marker:hidden [&::-webkit-details-marker]:hidden">
        {title}
        <Plus className="h-4 w-4 group-open:hidden" />
        <X className="hidden h-4 w-4 group-open:block" />
      </summary>
      <div className="pb-6 text-sm leading-relaxed text-neutral-500">
        {children}
      </div>
    </details>
  );
}

export function ProductInfoAccordion({
  description,
  specs,
}: {
  description: string | null;
  specs: ProductSpec[];
}) {
  return (
    <div className="mt-10">
      <Section title="Descrição" defaultOpen>
        <p className="whitespace-pre-line">
          {description || "Sem descrição disponível."}
        </p>
      </Section>

      {specs.length > 0 && (
        <Section title="Características e Dados Técnicos">
          <ul className="space-y-2">
            {specs.map((spec) => (
              <li key={spec.label} className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
                <span>
                  <span className="text-neutral-900">{spec.label}:</span>{" "}
                  {spec.value}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
