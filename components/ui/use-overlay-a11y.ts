import { useEffect, useRef, type RefObject } from "react";

// Aksesibilitas overlay: kunci scroll body, tutup via Escape,
// jebak fokus di dalam panel, dan kembalikan fokus saat ditutup.
export function useOverlayA11y(
  open: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Kunci scroll body.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Fokus elemen pertama di panel.
    const focusFirst = () => {
      const node = ref.current;
      if (!node) return;
      const focusables = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      const preferredFocus = Array.from(focusables).find((el) =>
        ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
      );
      const target = preferredFocus ?? focusables[0];
      if (target) target.focus();
      else node.focus();
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const node = ref.current;
      if (!node) return;
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, ref]);
}
