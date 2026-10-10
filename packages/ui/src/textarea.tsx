import * as React from "react";
import { fieldClasses } from "./input";
import { cn } from "./utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean;
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, mono, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || props["aria-invalid"] || undefined}
        className={cn(
          fieldClasses,
          "block min-h-[120px] resize-y px-3 py-2.5 leading-[1.55]",
          mono && "font-mono text-small",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
