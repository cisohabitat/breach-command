import type { Metadata } from "next";
import PracticeDesk from "@/components/game/practice-desk";
import "./practice.css";

export const metadata: Metadata = { title: "Practice desk | Breach Command", description: "Short incident-response exercises in bounded signals, confidence and service-aware containment, with a private local learning record." };
export default function PracticePage() { return <PracticeDesk />; }
