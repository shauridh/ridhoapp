"use client";

import type React from "react";

interface PosSubButtonProps {
  label: string;
  icon: React.ElementType;
  panel: string;
  active?: boolean;
  iconOnly?: boolean;
}

export function PosSubButton({ label, icon: Icon, panel, active, iconOnly }: PosSubButtonProps) {
  const handleClick = () => {
    if (window.location.pathname === "/pos") {
      window.dispatchEvent(new CustomEvent("pos:open-panel", { detail: panel }));
    } else {
      window.location.href = `/pos?panel=${panel}`;
    }
  };

  if (iconOnly) {
    return (
      <button
        onClick={handleClick}
        title={label}
        aria-label={label}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
          active ? "bg-white/20" : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon size={15} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
        active ? "bg-white/20 font-semibold" : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}
