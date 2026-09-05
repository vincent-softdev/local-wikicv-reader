import { useCallback, useEffect, useRef, useState } from 'react';
import { chunkText } from '../utils/chunkText';

export interface SpeechOptions { rate: number; pitch: number; voice?: SpeechSynthesisVoice; onParagraph: (index: number) => void; onFinished: () => void; }
export function useSpeechSynthesis(paragraphs: string[], options: SpeechOptions) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]); const [playing, setPlaying] = useState(false); const [paused, setPaused] = useState(false);
  const paragraphRef = useRef(0); const chunkRef = useRef(0); const optionsRef = useRef(options); const paragraphsRef = useRef(paragraphs); const voiceRef = useRef<SpeechSynthesisVoice | undefined>(options.voice); const generation = useRef(0);
  useEffect(() => { optionsRef.current = options; paragraphsRef.current = paragraphs; }, [options, paragraphs]);
  useEffect(() => { const load = () => setVoices(window.speechSynthesis.getVoices()); load(); window.speechSynthesis.addEventListener('voiceschanged', load); return () => window.speechSynthesis.removeEventListener('voiceschanged', load); }, []);
  const speakCurrent = useCallback(() => {
    const list = paragraphsRef.current; const index = paragraphRef.current; if (!list.length || index >= list.length) { setPlaying(false); optionsRef.current.onFinished(); return; }
    const chunks = chunkText(list[index]); if (chunkRef.current >= chunks.length) { paragraphRef.current += 1; chunkRef.current = 0; if (paragraphRef.current >= list.length) { setPlaying(false); optionsRef.current.onFinished(); return; } optionsRef.current.onParagraph(paragraphRef.current); return speakCurrent(); }
    const utterance = new SpeechSynthesisUtterance(chunks[chunkRef.current]); utterance.lang = 'vi-VN'; utterance.rate = optionsRef.current.rate; utterance.pitch = optionsRef.current.pitch; if (voiceRef.current) utterance.voice = voiceRef.current;
    const token = generation.current; utterance.onend = () => { if (token !== generation.current) return; chunkRef.current += 1; speakCurrent(); }; utterance.onerror = () => { if (token === generation.current) setPlaying(false); };
    window.speechSynthesis.speak(utterance);
  }, []);
  const play = useCallback((index = paragraphRef.current) => { paragraphRef.current = Math.max(0, Math.min(index, Math.max(0, paragraphsRef.current.length - 1))); setPlaying(true); setPaused(false); generation.current += 1; window.speechSynthesis.cancel(); optionsRef.current.onParagraph(paragraphRef.current); speakCurrent(); }, [speakCurrent]);
  const pause = useCallback(() => { if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); setPaused(true); } }, []);
  const resume = useCallback(() => { if (paused) { window.speechSynthesis.resume(); setPaused(false); } else if (!playing) play(); }, [paused, playing, play]);
  const stop = useCallback(() => { generation.current += 1; window.speechSynthesis.cancel(); setPlaying(false); setPaused(false); }, []);
  const skip = useCallback((delta: number) => { const next = Math.max(0, Math.min(paragraphRef.current + delta, paragraphsRef.current.length - 1)); const wasPlaying = playing && !paused; generation.current += 1; window.speechSynthesis.cancel(); paragraphRef.current = next; chunkRef.current = 0; optionsRef.current.onParagraph(next); if (wasPlaying) { setPlaying(true); setPaused(false); speakCurrent(); } }, [paused, playing, speakCurrent]);
  const restart = useCallback(() => { if (playing && !paused) { generation.current += 1; window.speechSynthesis.cancel(); chunkRef.current = 0; speakCurrent(); } }, [paused, playing, speakCurrent]);
  useEffect(() => () => { generation.current += 1; window.speechSynthesis.cancel(); }, []);
  const setVoice = useCallback((voice?: SpeechSynthesisVoice) => { voiceRef.current = voice; }, []);
  return { voices, playing, paused, currentIndex: paragraphRef.current, play, pause, resume, stop, skip, restart, setVoice, setParagraph: (index: number) => { paragraphRef.current = index; chunkRef.current = 0; } };
}
