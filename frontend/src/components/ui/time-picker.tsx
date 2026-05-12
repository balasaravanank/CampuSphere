import * as React from "react"
import { cn } from "@/lib/utils"

export interface TimePickerProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const TimePicker = React.forwardRef<HTMLSelectElement, TimePickerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
TimePicker.displayName = "TimePicker"

export { TimePicker }
