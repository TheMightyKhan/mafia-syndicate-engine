'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, ChevronDown, ChevronUp, Users } from 'lucide-react';

interface FactionMessage {
  readonly senderName: string;
  readonly senderId: string;
  readonly text: string;
  readonly timestamp: number;
}

interface FactionChatProps {
  readonly currentUserId: string;
  readonly currentUsername: string;
  readonly faction: string; // 'MAFIA' | 'YAKUZA' | etc.
  readonly lobbyId: string;
  readonly factionMates: ReadonlyArray<{ userId: string; username: string }>;
  readonly phase: string;
}

// Simple in-memory chat store (persists only for session, not across page reloads)
const factionChatStore: Record<string, FactionMessage[]> = {};

export const FactionChat: React.FC<FactionChatProps> = ({
  currentUserId,
  currentUsername,
  faction,
  lobbyId,
  factionMates,
  phase,
}) => {
  const [messages, setMessages] = useState<FactionMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const storeKey = `${lobbyId}_${faction}`;

  // Poll local store for new messages every second
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = factionChatStore[storeKey] ?? [];
      if (stored.length !== messages.length) {
        setMessages([...stored]);
        if (!isOpen) setHasNewMessage(true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [storeKey, messages.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const msg: FactionMessage = {
      senderName: currentUsername,
      senderId: currentUserId,
      text: input.trim(),
      timestamp: Date.now(),
    };

    if (!factionChatStore[storeKey]) factionChatStore[storeKey] = [];
    factionChatStore[storeKey].push(msg);
    setMessages([...factionChatStore[storeKey]]);
    setInput('');
  };

  const factionLabel = faction === 'MAFIA' ? 'Mafiya' : faction === 'YAKUZA' ? 'Yakuza' : 'Klan';
  const factionColor =
    faction === 'MAFIA'
      ? 'from-red-900/95 to-red-950/95 border-red-700/60 ring-red-500/30'
      : faction === 'YAKUZA'
      ? 'from-purple-900/95 to-purple-950/95 border-purple-700/60 ring-purple-500/30'
      : 'from-zinc-900/95 to-zinc-950/95 border-zinc-700/60 ring-zinc-500/30';
  const accentColor =
    faction === 'MAFIA' ? 'text-red-400' : faction === 'YAKUZA' ? 'text-purple-400' : 'text-zinc-400';
  const btnColor =
    faction === 'MAFIA'
      ? 'bg-red-600 hover:bg-red-500 ring-red-500/30'
      : faction === 'YAKUZA'
      ? 'bg-purple-600 hover:bg-purple-500 ring-purple-500/30'
      : 'bg-zinc-600 hover:bg-zinc-500 ring-zinc-500/30';

  const isNightPhase = phase.includes('NIGHT');

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`w-80 sm:w-96 rounded-2xl border bg-gradient-to-b ${factionColor} ring-1 shadow-2xl flex flex-col overflow-hidden animate-slideUp`}
        >
          {/* Header */}
          <div className={`px-4 py-3 flex items-center justify-between border-b border-white/10`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-red-500 animate-pulse`}></div>
              <span className={`text-sm font-black tracking-wider uppercase ${accentColor}`}>
                {factionLabel} Şifrəli Kanal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Users className="w-3 h-3" />
                {factionMates.length + 1}
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Night notice */}
          {isNightPhase && (
            <div className="px-3 py-1.5 bg-red-950/50 border-b border-red-900/30 text-[10px] text-red-400 font-bold uppercase tracking-widest text-center animate-pulse">
              🔇 Gecə Əməliyyatı — Koordinasiya Aktiv
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 max-h-64 min-h-[120px]">
            {messages.length === 0 ? (
              <div className="text-center text-xs text-zinc-600 italic py-4">
                Heç bir mesaj yoxdur. Koordinasiyanı başladın.
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.senderId === currentUserId ? 'items-end' : 'items-start'}`}>
                  <div className={`text-[10px] font-bold mb-0.5 ${accentColor} opacity-70`}>
                    {msg.senderId === currentUserId ? 'Siz' : msg.senderName}
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-sm max-w-[80%] break-words ${
                      msg.senderId === currentUserId
                        ? 'bg-red-700/60 text-white rounded-br-sm'
                        : 'bg-zinc-800/60 text-zinc-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Şifrəli mesaj..."
              maxLength={200}
              className="flex-1 bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`w-8 h-8 rounded-lg ${btnColor} text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ring-1`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-14 h-14 rounded-2xl ${btnColor} text-white flex items-center justify-center shadow-2xl ring-2 transition-all duration-200 hover:scale-105 active:scale-95`}
      >
        <MessageSquare className="w-6 h-6" />
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-black text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
            !
          </span>
        )}
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.25s ease-out forwards; }
      `}} />
    </div>
  );
};
