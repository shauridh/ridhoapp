import { type HTMLAttributes } from "react"

type Tone = "neutral" | "accent" | "success" | "danger"

const tones: Record<Tone, string> = {
  neutral: "bg-surface text-ink-soft",
  accent: "bg-tint-amber text-ink",
  success: "bg-tint-green text-success",
  danger: "bg-tint-red text-danger",
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
      {...props}
    />
  )
}
