export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Speak text with the device's built-in voices. Quietly does nothing if unsupported. */
export function say(text: string, lang: string): void {
  if (!canSpeak) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
