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
    const options = { duration: DICE_ROLL_MS, easing: "linear" };
    const animations = [shell.animate([
      { transform: "translate3d(-88px,-44px,30px) rotateX(570deg) rotateY(-450deg) rotateZ(-30deg)", easing: "cubic-bezier(.4,0,.8,.5)" },
      { transform: "translate3d(-10px,8px,0) rotateX(195deg) rotateY(-150deg) rotateZ(14deg)", offset: .4, easing: "cubic-bezier(.2,.6,.4,1)" },
      { transform: "translate3d(24px,-12px,12px) rotateX(86deg) rotateY(-72deg) rotateZ(-10deg)", offset: .56, easing: "cubic-bezier(.4,0,.8,.5)" },
      { transform: "translate3d(10px,6px,0) rotateX(-14deg) rotateY(18deg) rotateZ(5deg)", offset: .765, easing: "ease-out" },
      { transform: "translate3d(-4px,-6px,3px) rotateX(4deg) rotateY(-7deg) rotateZ(-2deg)", offset: .87, easing: "ease-in" },
      { transform: "rotateX(-1deg) rotateY(1deg)", offset: .965 },
      { transform: "none" },
    ], options)];
    const shadow = shell.parentElement?.querySelector<HTMLElement>(".dice-shadow");
    if (shadow) animations.push(shadow.animate([
      { transform: "translateX(-88px) scale(1.35)", opacity: .12 },
      { transform: "translateX(-10px) scale(.85)", opacity: .55, offset: .4 },
      { transform: "translateX(24px) scale(1.2)", opacity: .25, offset: .56 },
      { transform: "translateX(10px) scale(.9)", opacity: .55, offset: .765 },
      { transform: "translateX(-4px) scale(1.02)", opacity: .36, offset: .87 },
      { transform: "none", opacity: .55, offset: .965 },
      { transform: "none", opacity: .55 },
    ], options));
    const cancel = () => animations.forEach(animation => animation.cancel());
    const stop = () => { if (motion.matches) cancel(); };
    motion.addEventListener("change", stop);
    return () => { cancel(); motion.removeEventListener("change", stop); };
  }, [rolling, settled]);
}
