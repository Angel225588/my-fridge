'use client';

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { fr } from '@/lib/i18n/fr';
import Button from '@/components/ui/Button';

interface CommandBarProps {
  onCommand: (command: string) => Promise<string>;
}

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } }; length: number } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function CommandBar({ onCommand }: CommandBarProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const autoSubmitRef = useRef(false);

  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null);
  }, []);

  const submitCommand = useCallback(async (command: string) => {
    if (!command.trim() || loading) return;

    setLoading(true);
    setFeedback(null);

    try {
      const message = await onCommand(command.trim());
      setFeedback({ type: 'success', message });
      setInput('');
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Une erreur est survenue' });
    } finally {
      setLoading(false);
    }

    setTimeout(() => setFeedback(null), 4000);
  }, [loading, onCommand]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitCommand(input);
  };

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      autoSubmitRef.current = true;
    };

    recognition.onerror = () => {
      setIsListening(false);
      setFeedback({ type: 'error', message: fr.command.micError });
      setTimeout(() => setFeedback(null), 4000);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Auto-submit after speech recognition fills the input
  useEffect(() => {
    if (autoSubmitRef.current && input.trim() && !isListening) {
      autoSubmitRef.current = false;
      submitCommand(input);
    }
  }, [input, isListening, submitCommand]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder={isListening ? fr.command.listening : fr.command.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-input-bg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        {speechSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            aria-label={isListening ? fr.command.listening : 'Microphone'}
            className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              isListening
                ? 'border-danger text-danger bg-danger/10'
                : 'border-border text-muted bg-white hover:bg-input-bg dark:bg-card dark:hover:bg-zinc-800'
            }`}
          >
            {isListening && (
              <span className="absolute inset-0 rounded-full border-2 border-danger animate-ping opacity-40" />
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="relative z-10">
              <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 21h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <Button type="submit" loading={loading} size="md">
          {fr.command.send}
        </Button>
      </form>
      {feedback && (
        <p className={`mt-2 text-sm ${feedback.type === 'success' ? 'text-fresh' : 'text-danger'}`}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}
