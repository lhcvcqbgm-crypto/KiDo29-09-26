import React, { useState } from 'react';
import { Gamepad2, Trophy, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RewardItem } from '../types';
import { audioService } from '../utils/audio';

interface GamesAndRewardsViewProps {
  initialTab?: 'games' | 'rewards';
  stars: number;
  rewards: RewardItem[];
  onUnlockReward: (rewardId: string, cost: number) => void;
}

export const GamesAndRewardsView: React.FC<GamesAndRewardsViewProps> = ({
  initialTab = 'games',
  stars,
  rewards,
  onUnlockReward,
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'rewards'>(initialTab);

  // Word Match Mini-Game State
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const gamePairs = [
    { en: 'Apple', vi: 'Quả táo' },
    { en: 'Cat', vi: 'Con mèo' },
    { en: 'Sun', vi: 'Mặt trời' },
  ];

  const handleSelectWord = (word: string) => {
    audioService.playClickSound();
    if (!selectedWord) {
      setSelectedWord(word);
    } else {
      // Check match
      const pair = gamePairs.find(
        (p) => (p.en === selectedWord && p.vi === word) || (p.vi === selectedWord && p.en === word)
      );

      if (pair) {
        audioService.playSuccessSound();
        setMatchedPairs((prev) => [...prev, pair.en, pair.vi]);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      }
      setSelectedWord(null);
    }
  };

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Tab bar */}
      <div className="flex items-center gap-2 bg-white p-2.5 rounded-3xl border border-sky-100 shadow-xs text-xs font-black">
        <button
          onClick={() => setActiveTab('games')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl transition cursor-pointer ${
            activeTab === 'games' ? 'bg-[#1d50b4] text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
          }`}
        >
          <Gamepad2 size={16} />
          <span>Trò chơi tiếng Anh</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl transition cursor-pointer ${
            activeTab === 'rewards' ? 'bg-[#1d50b4] text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
          }`}
        >
          <Trophy size={16} />
          <span>Cửa hàng phần thưởng ({stars} ⭐)</span>
        </button>
      </div>

      {/* 1. GAMES TAB */}
      {activeTab === 'games' && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-5">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Gamepad2 className="text-pink-600" />
            <span>Trò chơi nối từ (Word Match)</span>
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            Nối từ Tiếng Anh với nghĩa Tiếng Việt tương ứng để nhận sao thưởng!
          </p>

          <div className="grid grid-cols-2 gap-3">
            {['Apple', 'Con mèo', 'Sun', 'Quả táo', 'Cat', 'Mặt trời'].map((item, idx) => {
              const isMatched = matchedPairs.includes(item);
              const isSelected = selectedWord === item;

              return (
                <button
                  key={idx}
                  disabled={isMatched}
                  onClick={() => handleSelectWord(item)}
                  className={`p-4 rounded-2xl border-2 font-black text-sm transition shadow-2xs cursor-pointer ${
                    isMatched
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800 cursor-default'
                      : isSelected
                      ? 'bg-amber-100 border-amber-400 text-amber-900 scale-102'
                      : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {matchedPairs.length === 6 && (
            <div className="p-4 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 font-black text-center text-sm space-y-2">
              <Sparkles size={24} className="mx-auto text-amber-600" />
              <p>Thắng rồi! Bé nối từ xuất sắc! +10 Sao Vàng.</p>
            </div>
          )}
        </div>
      )}

      {/* 2. REWARDS STORE TAB */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-4 rounded-3xl text-white font-black text-sm flex items-center justify-between shadow-md">
            <span>Kho sao của bé: {stars} Sao Vàng ⭐</span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Đổi quà ngay</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rewards.map((rew) => (
              <div
                key={rew.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between text-center"
              >
                <div>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-4xl shadow-inner mb-2">
                    {rew.icon}
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{rew.title}</h4>
                  <p className="text-xs font-bold text-amber-600 mt-0.5">{rew.cost} Sao Vàng</p>
                </div>

                <button
                  disabled={rew.unlocked || stars < rew.cost}
                  onClick={() => {
                    audioService.playSuccessSound();
                    onUnlockReward(rew.id, rew.cost);
                    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
                  }}
                  className={`w-full py-2 rounded-2xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                    rew.unlocked
                      ? 'bg-emerald-100 text-emerald-800'
                      : stars >= rew.cost
                      ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {rew.unlocked ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Đã sở hữu</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Đổi quà ({rew.cost} ⭐)</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
