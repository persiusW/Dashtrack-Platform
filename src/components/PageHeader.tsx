import type { ReactNode } from "react";
import Icon, { IconName } from "@/components/ui/Icon";

export interface PageHeaderProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="reveal mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-gray-600">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
