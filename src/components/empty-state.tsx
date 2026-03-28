import { Sparkles } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="surface-card p-8 text-center">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-blue-50">
        <Sparkles className="size-7 text-blue-600" />
      </div>
      <div className="space-y-2">
        <h3 className="font-heading text-2xl text-slate-900">{title}</h3>
        <p className="mx-auto max-w-xl text-base text-slate-600">{description}</p>
      </div>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
