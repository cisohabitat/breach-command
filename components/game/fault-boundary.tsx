"use client";

import { Component, type ReactNode } from "react";
import { recordLastError } from "@/lib/diagnostics";

// A fault in one part of the game stays in that part. Before, a render error in
// the review or a workspace took the whole page to the last-resort error
// screen, and with it the operation on screen. The operation is saved after
// every step, so the notice says so, offers the one action that helps, and
// gives a diagnostic a player can paste into a report: the build, the browser
// and the error, nothing personal and nothing sent anywhere.
type Props = { name: string; children: ReactNode; onReset?: () => void };
type State = { error: Error | null; copied: boolean };

const BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? "local";

export function faultDiagnostic(name: string, error: Error) {
  const agent = typeof navigator === "undefined" ? "unknown" : navigator.userAgent;
  return [`Breach Command fault in ${name}`, `Build: ${BUILD}`, `Browser: ${agent}`, `Error: ${error.name}: ${error.message}`].join("\n");
}

export class FaultBoundary extends Component<Props, State> {
  state: State = { error: null, copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`Breach Command: ${this.props.name} stopped.`, error);
    recordLastError(this.props.name, error);
  }

  private reset = () => {
    this.setState({ error: null, copied: false });
    this.props.onReset?.();
  };

  private copy = () => {
    const text = faultDiagnostic(this.props.name, this.state.error!);
    navigator.clipboard?.writeText(text).then(() => this.setState({ copied: true }), () => this.setState({ copied: false }));
  };

  render() {
    const { error, copied } = this.state;
    if (!error) return this.props.children;
    return (
      <section className="fault-notice" role="alert">
        <strong>The {this.props.name} could not be shown.</strong>
        <p>Your operation is saved after every step, so nothing has been lost. Try again, or reload the page and resume from the assignment screen.</p>
        <div>
          <button className="secondary-button" onClick={this.reset}>Try again</button>
          <button className="text-action" onClick={this.copy}>{copied ? "Diagnostic copied" : "Copy diagnostic"}</button>
        </div>
        <pre aria-label="Diagnostic">{faultDiagnostic(this.props.name, error)}</pre>
      </section>
    );
  }
}
