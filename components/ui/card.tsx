import { type HTMLAttributes } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive = false, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-hairline bg-white p-4 shadow-sm ${
        interactive
          ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
          : ""
      } ${className}`}
      {...props}
    />
  )
}
