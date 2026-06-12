/**
 * Utility function to synthesize speech for accessibility (blind/visually impaired users)
 */
export function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any currently speaking voice
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}
