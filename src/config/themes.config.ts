// Theme Engine for TDV Mafia Minigames
// Provides distinct UI skins (Cyberpunk, Prison, WW2, etc) based on the active gamemode.

export interface MinigameTheme {
  // Lobby
  lobbyContainer: string;
  lobbyTitle: string;
  lobbyButton: string;
  
  // GameBoard Grid
  gridContainer: string;
  
  // Court Panel
  courtContainer: string;
  courtGavel: string;
  courtTitle: string;
  courtActiveBox: string;
  
  // Newspaper
  newspaperContainer: string;
  newspaperMasthead: string;
  newspaperTitle: string;
  newspaperCard: string;
}

const defaultTheme: MinigameTheme = {
  lobbyContainer: 'bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-[24px]',
  lobbyTitle: 'text-zinc-950 dark:text-white',
  lobbyButton: 'bg-zinc-900 text-white',
  gridContainer: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4',
  courtContainer: 'rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900',
  courtGavel: 'rounded-[8px] bg-red-500/10 text-red-600 border border-red-500/20',
  courtTitle: 'text-lg text-zinc-950 dark:text-white',
  courtActiveBox: 'rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950',
  newspaperContainer: 'rounded-[20px] ring-1 ring-white/10 border border-zinc-300 dark:border-zinc-700 bg-[#f4f1ea] dark:bg-[#1a1918]',
  newspaperMasthead: 'border-y border-zinc-500/30',
  newspaperTitle: 'text-zinc-900 dark:text-white',
  newspaperCard: 'border border-zinc-500/20 bg-black/5 dark:bg-white/5',
};

const allInTheme: MinigameTheme = {
  lobbyContainer: 'bg-zinc-950 border border-purple-500/30 ring-1 ring-purple-500/10 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] relative overflow-hidden',
  lobbyTitle: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-mono drop-shadow-md',
  lobbyButton: 'bg-purple-600 hover:bg-purple-500 ring-4 ring-purple-600/30 text-white shadow-[0_0_30px_rgba(147,51,234,0.6)] font-mono',
  gridContainer: 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2',
  courtContainer: 'bg-zinc-950 border border-red-500/30 rounded-[12px] shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden ring-1 ring-red-500/10',
  courtGavel: 'rounded-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)] text-white',
  courtTitle: 'text-2xl text-red-500 tracking-widest uppercase font-mono drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]',
  courtActiveBox: 'rounded-none border-l-4 border-l-red-500 bg-zinc-900 border-y border-r border-zinc-800',
  newspaperContainer: 'bg-zinc-950/95 border-2 border-cyan-500/50 ring-4 ring-cyan-500/20 text-cyan-50 font-mono rounded-[8px]',
  newspaperMasthead: 'border-y-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
  newspaperTitle: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] text-4xl sm:text-6xl font-black uppercase tracking-tighter',
  newspaperCard: 'border border-rose-500/30 bg-rose-500/10',
};

export const MINIGAME_THEMES: Record<string, MinigameTheme> = {
  ALL_IN: allInTheme,
  
  CATENACCIO: {
    ...defaultTheme,
    lobbyContainer: 'bg-emerald-950 border border-emerald-600/30 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    lobbyTitle: 'text-emerald-400 font-bold uppercase tracking-wide',
    lobbyButton: 'bg-emerald-700 hover:bg-emerald-600 text-white',
    courtContainer: 'bg-emerald-950/50 border-2 border-emerald-600/20 rounded-xl',
    courtTitle: 'text-emerald-400 font-bold',
    courtGavel: 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg',
    newspaperContainer: 'bg-[#0f1f15] border border-emerald-500/30 text-emerald-100 rounded-lg font-mono',
    newspaperTitle: 'text-emerald-500 font-bold',
  },

  STANFORD_PRISON: {
    ...defaultTheme,
    lobbyContainer: 'bg-orange-950/90 border border-orange-600/40 rounded-sm shadow-inner',
    lobbyTitle: 'text-orange-500 font-black tracking-tighter',
    lobbyButton: 'bg-orange-700 hover:bg-orange-600 text-orange-100 rounded-sm',
    courtContainer: 'bg-zinc-950 border-4 border-orange-700/50 rounded-sm shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]',
    courtTitle: 'text-orange-600 font-black uppercase tracking-tighter text-xl',
    courtGavel: 'bg-orange-900 text-orange-400 border-2 border-orange-600',
    newspaperContainer: 'bg-zinc-950 border border-zinc-700 text-orange-50 rounded-sm shadow-2xl',
    newspaperMasthead: 'border-y-4 border-orange-800',
    newspaperTitle: 'text-orange-500 font-black uppercase',
  },

  OPERATION_VALKYRIE: {
    ...defaultTheme,
    lobbyContainer: 'bg-zinc-900 border-2 border-red-800 rounded-none shadow-[4px_4px_0_rgba(153,27,27,0.5)]',
    lobbyTitle: 'text-red-500 font-serif font-black uppercase',
    lobbyButton: 'bg-red-800 hover:bg-red-700 text-white font-serif uppercase rounded-none',
    courtContainer: 'bg-[#2b2725] border border-red-900 rounded-none shadow-[8px_8px_0_rgba(0,0,0,0.5)]',
    courtTitle: 'text-red-600 font-serif font-black uppercase text-xl',
    courtGavel: 'bg-red-950 text-red-500 border border-red-800 rounded-none',
    newspaperContainer: 'bg-[#d6cfc5] border border-red-900/50 text-zinc-900 rounded-none font-serif',
    newspaperMasthead: 'border-y border-red-900/80',
    newspaperTitle: 'text-red-800 font-black uppercase tracking-widest',
  },

  DANTES_INFERNO: {
    ...defaultTheme,
    lobbyContainer: 'bg-[#1a0505] border border-red-900/50 rounded-full sm:rounded-3xl shadow-[0_0_100px_rgba(220,38,38,0.15)]',
    lobbyTitle: 'text-red-500 font-serif font-black tracking-widest',
    lobbyButton: 'bg-red-900 hover:bg-red-800 text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.4)]',
    courtContainer: 'bg-gradient-to-b from-[#2a0808] to-[#120000] border border-red-900/30 rounded-3xl',
    courtTitle: 'text-red-600 font-serif tracking-widest',
    courtGavel: 'bg-red-950 text-red-500 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]',
    newspaperContainer: 'bg-[#140808] border-2 border-red-900/30 text-red-200 rounded-lg font-serif',
    newspaperMasthead: 'border-y border-red-900 shadow-[0_0_15px_rgba(220,38,38,0.2)]',
    newspaperTitle: 'text-red-600 drop-shadow-md font-black uppercase',
  },

  CYBERPUNK_NEO_BAKU: {
    ...defaultTheme,
    lobbyContainer: 'bg-zinc-950 border border-cyan-500/40 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)]',
    lobbyTitle: 'text-cyan-400 font-mono tracking-tighter uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]',
    lobbyButton: 'bg-cyan-600 hover:bg-cyan-500 text-white font-mono',
    courtContainer: 'bg-zinc-950 border border-cyan-500/20 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.1)]',
    courtTitle: 'text-cyan-400 font-mono tracking-widest uppercase',
    courtGavel: 'bg-cyan-950 text-cyan-400 border border-cyan-500/30',
    newspaperContainer: 'bg-zinc-950/90 border border-cyan-500/50 text-cyan-50 font-mono rounded-lg',
    newspaperMasthead: 'border-y border-cyan-500/50',
    newspaperTitle: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] font-black uppercase',
  },
  
  CHERNOBYL_EXCLUSION_ZONE: {
    ...defaultTheme,
    lobbyContainer: 'bg-[#1c221a] border border-yellow-500/40 rounded-lg shadow-[0_0_30px_rgba(234,179,8,0.15)]',
    lobbyTitle: 'text-yellow-500 font-mono tracking-widest',
    lobbyButton: 'bg-yellow-600 hover:bg-yellow-500 text-zinc-900 font-bold',
    courtContainer: 'bg-[#151a14] border border-yellow-500/20 rounded-lg',
    courtTitle: 'text-yellow-500 font-mono tracking-wider',
    courtGavel: 'bg-yellow-950/50 text-yellow-500 border border-yellow-500/30',
    newspaperContainer: 'bg-[#1c221a] border-2 border-yellow-600/30 text-yellow-100 rounded-md font-mono',
    newspaperMasthead: 'border-y-2 border-yellow-500/50',
    newspaperTitle: 'text-yellow-500 font-black uppercase',
  }
};

export const getTheme = (mode: string): MinigameTheme => {
  return MINIGAME_THEMES[mode] || defaultTheme;
};
