"use client";
import { useEffect, useRef, useState } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useLearning } from "@/hooks/use-learning";
import { clearLearning, isLesson, lessonIds, updateLearning, type LessonId } from "@/lib/learning";
import { lessonDetails, lessonTitles, practiceCases, practiceScore } from "@/lib/practice";
import { register } from "@/lib/i18n";
import { practiceDeskMessages } from "@/lib/i18n/en/practice-desk";
import { LearningHistory } from "./learning";
import { usePreferences } from "@/hooks/use-preferences";
register(practiceDeskMessages);

export default function PracticeDesk() {
  usePreferences(() => {});
  const { t, locale } = useMessages();
  const record = useLearning();
  const [lesson, setLesson] = useState<LessonId | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [notice, setNotice] = useState<"memory" | "cleared" | null>(null);
  const [confirm, setConfirm] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const clearButton = useRef<HTMLButtonElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const locked = useRef(false);
  useEffect(() => { if (confirm) confirmButton.current?.focus(); }, [confirm]);
  const closeClear = () => { setConfirm(false); requestAnimationFrame(() => clearButton.current?.focus()); };
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register(`/sw.js?v=${process.env.NEXT_PUBLIC_APP_VERSION ?? "0"}-${process.env.NEXT_PUBLIC_BUILD_ID ?? "local"}`)
        .then(() => navigator.serviceWorker.ready).then(registration => registration.active?.postMessage("cache-practice")).catch(() => {});
    }
    const timer = setTimeout(() => {
      const requested = new URLSearchParams(window.location.search).get("lesson");
      if (isLesson(requested)) setLesson(requested);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const start = (id: LessonId | null) => {
    locked.current = false;
    setLesson(id); setAnswers([]); setSelected(null); setChecked(false); setComplete(false);
    heading.current?.focus();
  };
  const question = lesson ? practiceCases[lesson][answers.length] : null;
  const advance = () => {
    if (!lesson || selected === null || locked.current) return;
    locked.current = true;
    const next = [...answers, selected];
    if (next.length === 3) {
      const kept = updateLearning(r => ({ ...r, attempts: [...r.attempts, { at: Date.now(), lesson, answers: next }].slice(-100) }));
      if (!kept) setNotice("memory");
      setComplete(true);
    }
    setAnswers(next); setSelected(null); setChecked(false);
    heading.current?.focus();
    if (next.length !== 3) locked.current = false;
  };
  return <main className="practice-desk" id="main-content">
    <a href={`/play?locale=${locale}`}>{t("practiceDesk.back")}</a>
    <p className="eyebrow">{t("practiceDesk.form")}</p>
    <h1 ref={heading} tabIndex={-1}>{complete ? t("practiceDesk.result") : lesson ? t(lessonTitles[lesson]) : t("practiceDesk.title")}</h1>
    {!lesson && <><p>{t("practiceDesk.intro")}</p><nav aria-label={t("practiceDesk.title")} className="practice-lessons">{lessonIds.map(id => <button key={id} onClick={() => start(id)}><strong>{t(lessonTitles[id])}</strong><span>{t(lessonDetails[id])}</span></button>)}</nav></>}
    {lesson && !complete && question && <section aria-labelledby="practice-question">
      <p>{t("practiceDesk.question", { number: answers.length + 1 })}</p>
      <p className="practice-context">{t(question.context)}</p>
      <fieldset disabled={checked}><legend id="practice-question">{t(question.prompt)}</legend>{question.options.map((option, index) => <label key={option}><input type="radio" name="judgment" checked={selected === index} onChange={() => setSelected(index)} />{t(option)}</label>)}</fieldset>
      {!checked ? <button className="primary-button" disabled={selected === null} onClick={() => { setChecked(true); heading.current?.focus(); }}>{t("practiceDesk.check")}</button> : <div role="status" className="practice-feedback"><strong>{t(selected === question.correct ? "practiceDesk.aligned" : "practiceDesk.reconsider")}</strong><h2>{t("practiceDesk.explanation")}</h2><p>{t(question.why)}</p><button className="primary-button" onClick={advance}>{t(answers.length === 2 ? "practiceDesk.finish" : "practiceDesk.next")}</button></div>}
      <button className="text-action" onClick={() => start(null)}>{t("practiceDesk.leave")}</button>
    </section>}
    {complete && lesson && <section><p role="status">{t("practiceDesk.score", { correct: practiceScore(lesson, answers) })}</p><p>{t("practiceDesk.noGrade")}</p><button className="primary-button" onClick={() => start(lesson)}>{t("practiceDesk.again")}</button><button className="text-action" onClick={() => start(null)}>{t("practiceDesk.leave")}</button></section>}
    <section aria-labelledby="learning-record"><h2 id="learning-record">{t("practiceDesk.record")}</h2><details><summary>{t("practiceDesk.showRecord")}</summary><p>{t("practiceDesk.privacy")}</p><p>{t("practiceDesk.notebookOnly")}</p>
      {!record.attempts.length && <p>{t("practiceDesk.none")}</p>}
      <LearningHistory />
      {record.attempts.length > 0 && <details><summary>{t("practiceDesk.recentChoices")}</summary>{record.attempts.slice(-5).reverse().map((attempt, index) => <section key={`${attempt.at}-${index}`}><h3>{t(lessonTitles[attempt.lesson])}</h3><ol>{practiceCases[attempt.lesson].map((question, step) => <li key={question.prompt}><strong>{t(question.prompt)}</strong><p>{t("practiceDesk.firstChoice", { choice: t(question.options[attempt.answers[step]]) })}</p><p>{t(attempt.answers[step] === question.correct ? "practiceDesk.aligned" : "practiceDesk.reconsider")}</p><details><summary>{t("practiceDesk.explanation")}</summary><p>{t(question.why)}</p></details></li>)}</ol></section>)}</details>}
      <dl>{lessonIds.map(id => {
        const attempts = record.attempts.filter(a => a.lesson === id);
        const correct = attempts.reduce((sum, a) => sum + practiceScore(id, a.answers), 0);
        const recent = attempts.slice(-5).reduce((sum, a) => sum + 3 - practiceScore(id, a.answers), 0);
        return <div key={id}><dt>{t(lessonTitles[id])}</dt><dd>{t("practiceDesk.skillCount", { attempts: attempts.length, correct, questions: attempts.length * 3 })}{recent > 0 && <p>{t("practiceDesk.pattern", { count: recent })}</p>}</dd></div>;
      })}</dl>
      <p>{t("practiceDesk.operationCount", { operations: record.operations.length, bounded: record.operations.reduce((sum, o) => sum + o.bounded, 0), comparisons: record.operations.reduce((sum, o) => sum + o.comparisons, 0), supported: record.operations.reduce((sum, o) => sum + o.supported, 0) })}</p>
      {confirm ? <div role="group" aria-label={t("practiceDesk.confirm")}><p>{t("practiceDesk.confirm")}</p><button ref={confirmButton} onClick={() => { setNotice(clearLearning() ? "cleared" : "memory"); closeClear(); }}>{t("practiceDesk.confirmClear")}</button><button onClick={closeClear}>{t("practiceDesk.cancel")}</button></div> : <button ref={clearButton} onClick={() => setConfirm(true)}>{t("practiceDesk.clear")}</button>}
      </details>{notice && <p role="status">{t(notice === "memory" ? "practiceDesk.memory" : "practiceDesk.cleared")}</p>}
    </section>
  </main>;
}
