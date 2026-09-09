import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {emoji && <div className="text-5xl mb-4">{emoji}</div>}
      {Icon && !emoji && (
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-primary" />
        </div>
      )}
      <h3 className="text-lg font-bold text-ink mb-1">{title}</h3>
      {description && <p className="text-muted mb-5 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
