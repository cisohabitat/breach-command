import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { CaptainVoice as Voice } from "./captain-voice";
import { useMessages } from "@/hooks/use-messages";

// Voice is optional, so its player, catalogue and speech controller load only
// when enabled. A disabled surface unmounts it and cancels its narration.
const Player = dynamic(() => import("./captain-voice").then(module => module.CaptainVoice, () => UnavailableVoice), { ssr: false });

function UnavailableVoice() {
  const { t } = useMessages();
  return <p role="status">{t("voice.unavailable")}</p>;
}

export function CaptainVoice(props: ComponentProps<typeof Voice>) {
  return props.enabled ? <Player {...props} /> : null;
}
