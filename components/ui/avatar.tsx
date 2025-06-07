<<<<<<< HEAD
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
=======
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
<<<<<<< HEAD
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
=======
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
<<<<<<< HEAD
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
=======
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
<<<<<<< HEAD
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
=======
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
