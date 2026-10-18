// Safari grants playback permission per media element. Keep the player across
// delayed lines, and prime it synchronously from an explicit game gesture.
let player: HTMLAudioElement | null = null;
let owner: typeof Audio | null = null;
let generation = 0;

export function captainAudio(): HTMLAudioElement {
  if (!player || owner !== window.Audio) {
    player = new window.Audio();
    owner = window.Audio;
  }
  generation++;
  return player;
}

export function unlockCaptainAudio(): void {
  try {
    if (player && owner === window.Audio && !player.paused) return;
    const audio = captainAudio();
    const claim = generation;
    audio.src = "/audio/captain-ready.wav";
    void audio.play().then(() => {
      // A delayed primer must never clear narration that has since claimed it.
      if (claim !== generation) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }).catch(() => {});
  } catch { /* Audio failure must never prevent starting an operation. */ }
}
