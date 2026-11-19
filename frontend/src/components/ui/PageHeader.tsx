import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: string | BreadcrumbItem[];
  breadcrumbs?: string | BreadcrumbItem[];
  border?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumb,
  breadcrumbs,
  border = true,
}) => {
  const activeBreadcrumbs = breadcrumbs || breadcrumb;
  return (
    <div
      className={`flex flex-col gap-1 pb-4 ${border ? 'border-b border-[var(--color-border)]' : ''}`}
    >
      {activeBreadcrumbs && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
          {typeof activeBreadcrumbs === 'string' ? (
            <span>{activeBreadcrumbs}</span>
          ) : (
            activeBreadcrumbs.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="opacity-40">/</span>}
                {item.href ? (
                  <a href={item.href} className="hover:text-[var(--color-text-primary)] transition-colors">
                    {item.label}
                  </a>
                ) : (
                  <span className="text-[var(--color-text-primary)]">{item.label}</span>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
