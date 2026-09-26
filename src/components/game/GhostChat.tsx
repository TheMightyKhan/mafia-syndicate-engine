'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Ghost, Send, Eye, EyeOff } from 'lucide-react';

interface GhostMessage {
  readonly senderName: string;
  readonly senderId: string;
  readonly text: string;
  readonly timestamp: number;
}

interface GhostChatProps {
  readonly currentUserId: string;
  readonly currentUsername: string;
  readonly isAlive: boolean;
  readonly lobbyId: string;
  readonly deadPlayerNames: ReadonlyArray<{ userId: string; username: string }>;
  readonly phase: string;
}

// In-memory ghost chat store per lobby
const ghostChatStore: Record<string, GhostMessage[]> = {};

export const GhostChat: React.FC<GhostChatProps> = ({
  currentUserId,
  currentUsername,
  isAlive,
  lobbyId,
  deadPlayerNames,
  phase,
}) => {
  const [messages, setMessages] = useState<GhostMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [spectatorMode, setSpectatorMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const storeKey = `ghost_${lobbyId}`;

  // Poll local store
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = ghostChatStore[storeKey] ?? [];
      if (stored.length !== messages.length) {
        setMessages([...stored]);
        if (!isOpen) setHasNew(true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [storeKey, messages.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasNew(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isOpen, messages]);

  const sendMessage = () => {
    if (!input.trim() || isAlive) return;

    const msg: GhostMessage = {
      senderName: currentUsername,
      senderId: currentUserId,
      text: input.trim(),
      timestamp: Date.now(),
    };

    if (!ghostChatStore[storeKey]) ghostChatStore[storeKey] = [];
    ghostChatStore[storeKey].push(msg);
    setMessages([...ghostChatStore[storeKey]]);
    setInput('');
  };

  // If alive — only show if there are ghost messages (spectator read-only mode)
  const canSeeGhosts = !isAlive || (isAlive && spectatorMode && messages.length > 0);
  
  if (isAlive && messages.length === 0) return null;

  const gameIsOver = phase === 'ENDED';

  return (
    <div className={`fixed bottom-6 ${!isAlive ? 'right-24' : 'right-6'} z-40 flex flex-col items-end gap-3`}>
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-2xl border border-zinc-700/60 bg-gradient-to-b from-zinc-900/97 to-zinc-950/97 ring-1 ring-zinc-600/20 shadow-2xl flex flex-col overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <Ghost className="w-4 h-4 text-zinc-400 animate-pulse" />
              <span className="text-sm font-black tracking-wider uppercase text-zinc-400">
                Kabus Çatı
              </span>
              {isAlive && (
                <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Oxunur
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">{deadPlayerNames.length + (isAlive ? 0 : 1)} ruh</span>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lore description */}
          {!isAlive && (
            <div className="px-3 py-1.5 bg-zinc-950/70 border-b border-zinc-800/50 text-[10px] text-zinc-500 italic text-center">
              Ölülər burada danışır. Dirilər eşitmir.
            </div>
          )}

          {isAlive && (
            <div className="px-3 py-1.5 bg-amber-950/30 border-b border-amber-900/20 text-[10px] text-amber-600 font-bold uppercase tracking-wider text-center">
              👁 Siz yalnız izləyirsiniz — yazı yazmaq olmaz
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 max-h-64 min-h-[120px]">
            {messages.length === 0 ? (
              <div className="text-center text-xs text-zinc-700 italic py-4">
                Sükut... hələ heç kim danışmır.
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.senderId === currentUserId ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] font-bold mb-0.5 text-zinc-500 opacity-70">
                    👻 {msg.senderId === currentUserId ? 'Siz' : msg.senderName}
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-sm max-w-[80%] break-words italic ${
                      msg.senderId === currentUserId
                        ? 'bg-zinc-800/80 text-zinc-300 rounded-br-sm'
                        : 'bg-zinc-900/60 text-zinc-400 rounded-bl-sm border border-zinc-800/50'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input — only for dead players */}
          {!isAlive && (
            <div className="px-3 py-2 border-t border-zinc-800/50 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ruhunuzu ifadə edin..."
                maxLength={200}
                className="flex-1 bg-zinc-950/80 border border-zinc-800/50 rounded-lg px-3 py-1.5 text-sm text-zinc-400 placeholder-zinc-700 italic focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ring-1 ring-zinc-600/40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-14 h-14 rounded-2xl text-zinc-300 flex items-center justify-center shadow-xl ring-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
          isAlive
            ? 'bg-zinc-800/80 ring-zinc-700/50 hover:bg-zinc-700/80'
            : 'bg-zinc-900 ring-zinc-700/60 hover:bg-zinc-800'
        }`}
        title={isAlive ? 'Ölü Oyunçuların Mesajlarına Bax' : 'Kabus Çatı'}
      >
        <Ghost className="w-6 h-6 opacity-80" />
        {hasNew && !isOpen && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            !
          </span>
        )}
        {isAlive && messages.length > 0 && !isOpen && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-600 text-zinc-200 text-[9px] font-black rounded-full flex items-center justify-center">
            {messages.length}
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
