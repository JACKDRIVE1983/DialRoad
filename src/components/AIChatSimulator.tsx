import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Bot, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface AIChatSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  centerName: string;
  aiResponses: string[];
}

interface ChatMessage {
  id: string;
  type: 'bot';
  content: string;
  isTyping?: boolean;
}

export function AIChatSimulator({ isOpen, onClose, centerName, aiResponses }: AIChatSimulatorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [usedResponses, setUsedResponses] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Get a random unused response
  const getRandomResponse = useCallback(() => {
    if (!aiResponses || aiResponses.length === 0) {
      return "Mi dispiace, non ho informazioni disponibili per questo centro al momento.";
    }

    // If all responses have been used, reset
    if (usedResponses.size >= aiResponses.length) {
      setUsedResponses(new Set());
    }

    // Find unused indices
    const unusedIndices = aiResponses
      .map((_, index) => index)
      .filter(index => !usedResponses.has(index));

    // Pick a random unused response
    const randomIndex = unusedIndices[Math.floor(Math.random() * unusedIndices.length)];
    setUsedResponses(prev => new Set([...prev, randomIndex]));

    return aiResponses[randomIndex];
  }, [aiResponses, usedResponses]);

  // Typing effect
  const typeText = useCallback((text: string, onComplete: () => void) => {
    let currentIndex = 0;
    setDisplayedText('');

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        scrollToBottom();
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        onComplete();
      }
    }, 15); // Speed of typing effect
  }, [scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Generate analysis
  const generateAnalysis = useCallback(() => {
    if (isLoading) return;

    setIsLoading(true);
    setDisplayedText('');

    // Add initial greeting message
    const greetingId = `msg-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: greetingId,
        type: 'bot',
        content: `Ciao! Sto analizzando la zona intorno a ${centerName}...`,
      }
    ]);

    scrollToBottom();

    // Simulate loading delay
    setTimeout(() => {
      const response = getRandomResponse();
      const responseId = `msg-${Date.now() + 1}`;

      // Replace greeting with typing response
      setMessages(prev => [
        ...prev.filter(m => m.id !== greetingId),
        {
          id: greetingId,
          type: 'bot',
          content: `Ciao! Sto analizzando la zona intorno a ${centerName}...`,
        },
        {
          id: responseId,
          type: 'bot',
          content: '',
          isTyping: true,
        }
      ]);

      // Start typing effect
      typeText(response, () => {
        setMessages(prev => prev.map(m => 
          m.id === responseId 
            ? { ...m, content: response, isTyping: false }
            : m
        ));
        setIsLoading(false);
      });
    }, 1500);
  }, [centerName, getRandomResponse, isLoading, scrollToBottom, typeText]);

  // Auto-generate on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      generateAnalysis();
    }
  }, [isOpen, messages.length, generateAnalysis]);

  // Reset when closed
  const handleClose = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setMessages([]);
    setDisplayedText('');
    setIsLoading(false);
    onClose();
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[2147483648] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Chat Container */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[2147483649] bg-gradient-to-b from-slate-900 to-slate-950 rounded-t-3xl max-h-[75vh] min-h-[50vh] flex flex-col overflow-hidden border-t border-x border-teal-500/30"
            style={{
              boxShadow: '0 -10px 60px rgba(20, 184, 166, 0.15), 0 -2px 20px rgba(0, 0, 0, 0.2)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-teal-500/20 bg-gradient-to-r from-teal-600/20 to-indigo-600/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Assistente Virtuale</h3>
                  <p className="text-xs text-teal-300/70">Analisi zona • Consigli personalizzati</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all hover:bg-white/20 active:scale-95"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                >
                  {/* Bot Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/20">
                    <Bot className="w-4 h-4 text-white" />
                  </div>

                  {/* Message Bubble */}
                  <div className="flex-1 max-w-[85%]">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-800/80 rounded-2xl rounded-tl-md px-4 py-3 border border-teal-500/20 shadow-lg">
                      {message.isTyping ? (
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {displayedText}
                          <span className="inline-block w-0.5 h-4 bg-teal-400 ml-0.5 animate-pulse" />
                        </p>
                      ) : (
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                  <span className="text-xs text-teal-300/70">Elaborazione in corso...</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Action Bar (no input, just regenerate button) */}
            <div className="px-4 py-4 border-t border-teal-500/20 bg-slate-900/80 backdrop-blur-xl">
              <button
                onClick={generateAnalysis}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-teal-600/25 hover:shadow-xl hover:from-teal-500 hover:to-indigo-500 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Elaborazione...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Genera nuova analisi</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-500 mt-2">
                {aiResponses?.length || 0} risposte disponibili
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
