import type { ReactNode } from 'react';
import { stagger } from './stagger';
import { Tag } from './Tag';

/** Screen title block: optional tag, big display title, subtitle, and actions on the right. */
export function PageHeader({
  tag,
  title,
  subtitle,
  actions,
}: {
  tag?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="rise">
        {tag && (
          <Tag tone="surface" className="mb-2">
            {tag}
          </Tag>
        )}
        <h1 className="text-display-l sm:text-display-xl">{title}</h1>
        {subtitle && <p className="text-ink-muted mt-2">{subtitle}</p>}
      </div>
      {actions && (
        <div className="rise flex flex-wrap gap-3" style={stagger(2)}>
          {actions}
        </div>
      )}
    </div>
  );
}
