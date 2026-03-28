type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="font-heading text-xs uppercase tracking-[0.28em] text-blue-600">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1">
          <h2 className="font-heading text-3xl text-slate-900">{title}</h2>
          {description ? (
            <p className="max-w-2xl text-base text-slate-600">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
