import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechOptions {
  enabled: boolean;
  rate: number;
  selectedVoiceURI: string;
}

export function useSpeechSynthesis() {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [options, setOptions] = useState<SpeechOptions>({
    enabled: true,
    rate: 0.95,
    selectedVoiceURI: '',
  });

  const lastSpokenRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      const englishVoices = available.filter((v) => v.lang.toLowerCase().startsWith('en'));
      const list = englishVoices.length > 0 ? englishVoices : available;
      setVoices(list);
      setOptions((prev) => {
        if (prev.selectedVoiceURI || list.length === 0) return prev;
        const preferred =
          list.find((v) => v.lang === 'en-IN') ||
          list.find((v) => v.lang === 'en-GB') ||
          list[0];
        return { ...prev, selectedVoiceURI: preferred?.voiceURI ?? '' };
      });
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, force = false) => {
      if (!isSupported || !text.trim()) return;
      if (!force && !options.enabled) return;

      const normalized = text.trim();
      const now = Date.now();
      // Prevent repeating the exact same prediction every frame window (4.5s cooldown)
      if (
        !force &&
        lastSpokenRef.current.text.toLowerCase() === normalized.toLowerCase() &&
        now - lastSpokenRef.current.time < 4500
      ) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(normalized);
      utterance.lang = 'en-IN';
      utterance.rate = options.rate;

      const chosenVoice = voices.find((v) => v.voiceURI === options.selectedVoiceURI);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      lastSpokenRef.current = { text: normalized, time: now };
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, options.enabled, options.rate, options.selectedVoiceURI, voices]
  );

  const resetCooldown = useCallback(() => {
    lastSpokenRef.current = { text: '', time: 0 };
  }, []);

  return {
    isSupported,
    isSpeaking,
    voices,
    options,
    setOptions,
    speak,
    stop,
    resetCooldown,
  };
}
