"use client";
import { useEffect, useState } from "react";
import { emptyLearning, readLearning, subscribeLearning } from "@/lib/learning";

export function useLearning() {
  const [record, setRecord] = useState(emptyLearning);
  useEffect(() => {
    const refresh = () => setRecord(readLearning());
    const timer = setTimeout(refresh, 0);
    const unsubscribe = subscribeLearning(refresh);
    window.addEventListener("storage", refresh);
    return () => { clearTimeout(timer); unsubscribe(); window.removeEventListener("storage", refresh); };
  }, []);
  return record;
}
