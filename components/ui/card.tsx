import { type HTMLAttributes } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive = false, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-hairline bg-white p-4 shadow-sm ${
        interactive
          ? "cursor-pointer transition hover:shadow-lg active:scale-[0.97]"
          : ""
      } ${className}`}
      {...props}
    />
  )
}
