import * as React from "react";
import { cn } from "./utils";

/** A bordered surface for interactive content: composers, forms, server view, link rows. */
export const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-panel border border-line bg-surface text-ink-2 shadow-[0_1px_2px_rgb(0_0_0/0.03)]", className)}
      {...props}
    />
  )
);
Panel.displayName = "Panel";

export interface PanelHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Leading icon next to the title. */
  icon?: React.ReactNode;
  /** Right-aligned controls. */
  actions?: React.ReactNode;
  /** Heading level for the title. Defaults to h2. */
  as?: "h2" | "h3" | "h4";
}

export const PanelHeader = React.forwardRef<HTMLDivElement, PanelHeaderProps>(
  ({ className, title, description, icon, actions, as: Heading = "h2", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4", className)}
      {...props}
    >
      {title || description ? (
        <div className="flex min-w-0 items-start gap-2.5">
          {icon ? <span className="mt-0.5 text-ink-3 [&_svg]:size-4">{icon}</span> : null}
          <div className="min-w-0">
            {title ? <Heading className="text-[15px] font-semibold leading-[22px] tracking-[-0.01em] text-ink">{title}</Heading> : null}
            {description ? <p className="mt-0.5 text-small text-ink-3">{description}</p> : null}
          </div>
        </div>
      ) : null}
      {children}
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
);
PanelHeader.displayName = "PanelHeader";

export const PanelBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5", className)} {...props} />
);
PanelBody.displayName = "PanelBody";

export const PanelFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-b-panel border-t border-line bg-surface-2/40 px-5 py-3.5",
        className
      )}
      {...props}
    />
  )
);
PanelFooter.displayName = "PanelFooter";
