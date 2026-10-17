import { useCallback } from "react";

// Animate the decorative shell, keeping the changing number upright. The
// actual roll lives in the session; motion never chooses or delays its result.
export function useDieMotion(rolling: boolean, settled: boolean) {
  // The dialog portal can attach after its parent's effect has run. A ref
  // cleanup starts at attachment and cancels at settlement or detachment.
  return useCallback((shell: HTMLDivElement | null) => {
    if (!rolling || settled || !shell?.animate) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const animation = shell.animate([
      { transform: "rotate(-24deg) scale(.88)" },
      { transform: "rotate(18deg) scale(1.03)", offset: .35 },
      { transform: "rotate(-9deg) scale(.97)", offset: .7 },
      { transform: "none" },
    ], { duration: 850, easing: "ease-out" });
    const stop = () => { if (motion.matches) animation.cancel(); };
    motion.addEventListener("change", stop);
    return () => { animation.cancel(); motion.removeEventListener("change", stop); };
  }, [rolling, settled]);
}
