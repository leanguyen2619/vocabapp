export function speakWord(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-GB";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}
