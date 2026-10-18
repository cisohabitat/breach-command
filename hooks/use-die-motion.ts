import { useCallback } from "react";
import { DICE_ROLL_MS } from "@/lib/dice-timing";

// Animate the decorative twenty-face shell within its tray. The
// actual roll lives in the session; motion never chooses or delays its result.
export function useDieMotion(rolling: boolean, settled: boolean) {
  // The dialog portal can attach after its parent's effect has run. A ref
  // cleanup starts at attachment and cancels at settlement or detachment.
  return useCallback((shell: HTMLDivElement | null) => {
    if (!rolling || settled || !shell?.animate) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const animation = shell.animate([
      { transform: "translate3d(-92px,-66px,50px) rotateX(250deg) rotateY(-310deg) rotateZ(-35deg)" },
      { transform: "translate3d(-32px,20px,0) rotateX(135deg) rotateY(-170deg) rotateZ(20deg)", offset: .3 },
      { transform: "translate3d(22px,-24px,26px) rotateX(65deg) rotateY(-80deg) rotateZ(-12deg)", offset: .52 },
      { transform: "translate3d(8px,12px,0) rotateX(-12deg) rotateY(20deg) rotateZ(5deg)", offset: .72 },
      { transform: "translate3d(-3px,-4px,4px) rotateX(4deg) rotateY(-6deg)", offset: .87 },
      { transform: "none" },
    ], { duration: DICE_ROLL_MS, easing: "ease-out" });
    const stop = () => { if (motion.matches) animation.cancel(); };
    motion.addEventListener("change", stop);
    return () => { animation.cancel(); motion.removeEventListener("change", stop); };
  }, [rolling, settled]);
}
