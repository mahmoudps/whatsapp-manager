<<<<<<< HEAD
import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
=======
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
<<<<<<< HEAD
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)}
    {...props}
  />
))
=======
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
