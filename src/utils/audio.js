/**
 * Text-to-speech using Web Speech API
 */

/**
 * Speak text using browser speech synthesis
 * @param {string} text - Text to speak
 * @param {string} lang - Language code (default: 'es-ES')
 */
export function speak(text, lang = 'es-ES') {
  stopSpeaking()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang

  // Prefer "Google español" (high quality Chrome voice) if available
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.name === 'Google español')
    || voices.find(v => v.lang === lang && !v.localService)
    || voices.find(v => v.lang.startsWith('es'))
  if (preferred) utterance.voice = preferred

  window.speechSynthesis.speak(utterance)
}

// Preload voices — Chrome loads them async, so we trigger it early
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking() {
  window.speechSynthesis.cancel()
}
