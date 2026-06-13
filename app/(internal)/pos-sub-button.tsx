"use client";

import type React from "react";

interface PosSubButtonProps {
  label: string;
  icon: React.ElementType;
  panel: string;
  active?: boolean;
}

export function PosSubButton({ label, icon: Icon, panel, active }: PosSubButtonProps) {
  const handleClick = () => {
    // If already on /pos, dispatch custom event to open panel
    if (window.location.pathname === "/pos") {
      window.dispatchEvent(new CustomEvent("pos:open-panel", { detail: panel }));
    } else {
      // Navigate to /pos with panel param, PosClient will pick it up on mount
      window.location.href = `/pos?panel=${panel}`;
    }
  };

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
