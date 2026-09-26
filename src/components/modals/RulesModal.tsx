'use client';

import React from 'react';
import { X, Book, Shield, Crosshair, Eye, Ban, Ghost } from 'lucide-react';
import { Button } from '../ui/Button';

interface RulesModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80  p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-2 text-indigo-400">
            <Book className="w-5 h-5" />
            <h2 className="text-xl font-black text-white">Mafiya: Rol və Qaydalar</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6 text-zinc-300">
          <p className="text-sm font-medium leading-relaxed opacity-90">
            Oyunda məqsəd sadədir: Şəhərlilər mafiyanı tapıb edam etməli, Mafiya isə şəhərliləri gizlicə öldürüb çoxluğu ələ keçirməlidir. Budur mövcud rollar:
          </p>
          
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-red-950/20 border border-red-900/30">
              <Crosshair className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-bold mb-1">Mafiya Qatili (Killer)</h3>
                <p className="text-xs">Gecələr bir nəfəri seçib öldürür. Digər mafiya üzvləri ilə birlikdə ortaq qərar verməlidir. Qərar 30% dən az səs toplasa, digər mafiyalar qiyam qaldırıb başqasını öldürə bilər.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-red-950/20 border border-red-900/30">
              <Ghost className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-bold mb-1">Şərr Atan (Framer)</h3>
                <p className="text-xs">Mafiyanın hiyləgər üzvüdür. Gecələr bir vətəndaşı seçib ona "şərr atır". Əgər Şərif həmin gecə o adamı yoxlasa, onu təmiz vətəndaş yox, mafiya kimi görəcək.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
              <Eye className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-emerald-400 font-bold mb-1">Şərif (Investigator)</h3>
                <p className="text-xs">Şəhərin qoruyucusu. Gecələr bir nəfəri seçərək onun gizli kimliyini yoxlayır və Məsum yoxsa Qatil olduğunu öyrənir.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
              <Shield className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-emerald-400 font-bold mb-1">Həkim (Doctor)</h3>
                <p className="text-xs">Gecələr bir nəfəri hədəf seçib onu qətllərdən qoruyur (mühafizə edir). Özünü ardıcıl qoruya bilməz.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
              <Ban className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-emerald-400 font-bold mb-1">Gözbağlayıcı (Blocker/Escort)</h3>
                <p className="text-xs">Gecələr bir nəfəri ziyarət edərək onun fəaliyyətini bloklayır. Bloklanan şəxs heç bir əməliyyat (qətl, qoruma, yoxlama) həyata keçirə bilməz.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-purple-950/20 border border-purple-900/30">
              <Ghost className="w-6 h-6 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-purple-400 font-bold mb-1">Dəli (Jester)</h3>
                <p className="text-xs">Neytral, psixopat rol. Tək bir məqsədi var: Səhər məhkəmədə səsvermə ilə YANDIRILMAQ! Əgər şəhər onu edam edərsə, Dəli təkbaşına oyunu qazanır.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};